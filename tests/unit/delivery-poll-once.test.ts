import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { saveAlert } from '../../lib/alert.ts';
import { formatAlertLine, formatAlertSummary } from '../../lib/delivery/report.ts';
import { openDb } from '../../lib/storage/db.ts';
import { recordPoll } from '../../lib/storage/store.ts';
import { FULL_SAMPLES, ROOT, cleanupTmp, tmpDir } from '../helpers.ts';

afterEach(cleanupTmp);

const SECRETS = { DEMO_USER_EMAIL: 'po-user@example.invalid', SLACK_WEBHOOK_URL: 'https://hooks.example.invalid/po-hook', RESEND_API_KEY: 're_po_key' };

function run(env: Record<string, string>) {
  const clean = { ...process.env };
  for (const k of ['SOURCE_MODE', 'SAMPLES_DIR', 'DB_PATH', 'TWELVE_DATA_API_KEY', 'EVENT_REGISTRY_API_KEY', 'DELIVERY_MODE', 'POLLING', ...Object.keys(SECRETS)]) delete clean[k];
  return spawnSync('node', ['--import', join(ROOT, 'tests/setup/no-network-child.mjs'), 'scripts/poll-once.ts'], { cwd: ROOT, env: { ...clean, ...env }, encoding: 'utf8' });
}

const SOURCE_LINES = [
  'gdacs ok 4 items, 2 made the cut',
  'twelvedata ok 5 items, 2 made the cut. USO: code 404: symbol not found',
  'eventregistry ok 2 items, 1 made the cut',
];

describe('M5 AC-16 poll:once prints the alerts', () => {
  it('AC-16 with no alert: the three source lines, then alerts: 0 sent, 5 not sent; exit 0', () => {
    const r = run({ SAMPLES_DIR: FULL_SAMPLES, DB_PATH: join(tmpDir(), 'p.db') });
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    expect(r.stdout.trim().split('\n')).toEqual([...SOURCE_LINES, 'alerts: 0 sent, 5 not sent']);
  });

  it('AC-16 AC-14 with an alert, fake delivery: one line per event sent, then the summary; no secrets, no message text', async () => {
    const path = join(tmpDir(), 'p.db');
    const db = await openDb(path);
    await saveAlert(db, SECRETS, { email: true, slack: false }, new Date('2000-01-01T00:00:00.000Z'));
    await db.dispose();
    const r = run({ SAMPLES_DIR: FULL_SAMPLES, DB_PATH: path, ...SECRETS });
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    const lines = r.stdout.trim().split('\n');
    expect(lines.slice(0, 3)).toEqual(SOURCE_LINES);
    const after = await openDb(path);
    const fired = (await after.prepare('SELECT e.kind, e.source_id FROM alerts_fired f JOIN events e USING (kind, source_id) ORDER BY e.cleared_at, e.source_time, e.kind, e.source_id').all()) as { kind: string; source_id: string }[];
    await after.dispose();
    const label: Record<string, string> = { disaster: 'Natural disaster', market: 'Market movement', news: 'Breaking news' };
    expect(fired).toHaveLength(5);
    // Printed in the order matched; compared as a set, since two polls may share a millisecond.
    expect(lines.slice(3, -1).sort()).toEqual(fired.map((f) => `alert sent ${label[f.kind]} ${f.source_id}: email delivered, slack not picked`).sort());
    expect(lines.at(-1)).toBe('alerts: 5 sent, 0 not sent');
    for (const v of Object.values(SECRETS)) expect(r.stdout).not.toContain(v);
    expect(r.stdout).not.toMatch(/Where: |When: |Source: GDACS|% today/);
  });

  it('AC-16 a second run never sends an event the first run sent', async () => {
    const path = join(tmpDir(), 'p.db');
    const db = await openDb(path);
    await saveAlert(db, SECRETS, { email: true, slack: true }, new Date('2000-01-01T00:00:00.000Z'));
    await db.dispose();
    const ids = (out: string) => out.split('\n').filter((l) => l.startsWith('alert sent ')).map((l) => l.slice(0, l.indexOf(':')));
    const first = ids(run({ SAMPLES_DIR: FULL_SAMPLES, DB_PATH: path }).stdout);
    expect(first).toHaveLength(5);
    // The fixtures' round 2 brings new events; none of round 1's is sent again.
    const second = run({ SAMPLES_DIR: FULL_SAMPLES, DB_PATH: path });
    for (const id of ids(second.stdout)) expect(first).not.toContain(id);
    const counts = await openDb(path);
    const perChannel = (await counts.prepare('SELECT kind, source_id, channel, COUNT(*) AS n FROM deliveries GROUP BY kind, source_id, channel HAVING n > 1').all());
    expect(perChannel).toEqual([]);
    await counts.dispose();
    // A run that adds no new event: nothing sent, nothing not sent.
    const empty = join(tmpDir(), 'empty');
    const third = run({ SAMPLES_DIR: empty, DB_PATH: path });
    expect(third.stdout.trim().split('\n').at(-1)).toBe('alerts: 0 sent, 0 not sent');
  });

  it('AC-16 the exit code still depends only on the sources', () => {
    const r = run({ SAMPLES_DIR: tmpDir(), DB_PATH: join(tmpDir(), 'p.db') });
    expect(r.status).toBe(1);
    expect(r.stdout.trim().split('\n').at(-1)).toBe('alerts: 0 sent, 0 not sent');
  });

  it('AC-16 the line format for each outcome', () => {
    expect(
      formatAlertLine({ kind: 'market', sourceId: 'SPY 2026-11-04', sent: true, reason: '', email: { outcome: 'failed', detail: 'HTTP 422 validation_error: bad' }, slack: { outcome: 'delivered', detail: '' } }),
    ).toBe('alert sent Market movement SPY 2026-11-04: email failed: HTTP 422 validation_error: bad, slack delivered');
    expect(formatAlertLine({ kind: 'news', sourceId: 'eng-1', sent: true, reason: '', email: null, slack: { outcome: 'failed', detail: 'timeout after 10s' } })).toBe(
      'alert sent Breaking news eng-1: email not picked, slack failed: timeout after 10s',
    );
    const notSent = { kind: 'news', sourceId: 'x', sent: false, reason: 'no alert set up', email: null, slack: null };
    expect(formatAlertSummary([notSent, notSent, { ...notSent, sent: true, reason: '' }])).toBe('alerts: 1 sent, 2 not sent');
  });
});

describe('M5 AC-14 AC-7 poll:once switches and sweep', () => {
  it('AC-14 a bad DELIVERY_MODE exits 2 with a message naming the allowed values, before opening the database', () => {
    const db = join(tmpDir(), 'p.db');
    const r = run({ DELIVERY_MODE: 'foo', DB_PATH: db });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/DELIVERY_MODE.*"fake".*"live"/);
    expect(existsSync(db)).toBe(false);
  });

  it('AC-15 poll:once ignores POLLING', () => {
    const r = run({ POLLING: 'foo', SAMPLES_DIR: FULL_SAMPLES, DB_PATH: join(tmpDir(), 'p.db') });
    expect(r.status).toBe(0);
  });

  it('AC-7 poll:once turns a delivery still sending into failed: interrupted, outcome unknown', async () => {
    const path = join(tmpDir(), 'p.db');
    const db = await openDb(path);
    await recordPoll(db, { source: 'gdacs', checkedAt: '2026-11-01T00:00:00.000Z', outcome: 'ok', detail: '', events: [{ kind: 'disaster', sourceId: 'old', what: 'w', where: '', sourceTime: null, measure: '', current: true, madeCut: true, raw: {} }] });
    await db.exec("INSERT INTO alerts_fired (kind, source_id, matched_at, sent, reason) VALUES ('disaster', 'old', '2026-11-01T00:00:00.000Z', 1, '')");
    await db.exec("INSERT INTO deliveries (kind, source_id, channel, outcome, detail, started_at) VALUES ('disaster', 'old', 'slack', 'sending', '', '2026-11-01T00:00:00.000Z')");
    await db.dispose();
    run({ SAMPLES_DIR: FULL_SAMPLES, DB_PATH: path });
    const after = await openDb(path);
    expect(await after.prepare("SELECT outcome, detail FROM deliveries WHERE source_id = 'old'").get()).toEqual({ outcome: 'failed', detail: 'interrupted, outcome unknown' });
    await after.dispose();
  });
});
