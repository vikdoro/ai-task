import { afterAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { $fetch, fetch, setup, startServer, useTestContext } from '@nuxt/test-utils/e2e';
import { saveAlert } from '../../lib/alert.ts';
import { matchAlerts } from '../../lib/delivery/match.ts';
import { openDb, type Db } from '../../lib/storage/db.ts';
import { recordPoll } from '../../lib/storage/store.ts';
import type { ParsedEvent } from '../../lib/sources/types.ts';
import { FULL_SAMPLES, ROOT, cleanupTmp, jsonResponse, throwingFetch, tmpDir } from '../helpers.ts';

const SECRETS = {
  DEMO_USER_EMAIL: 'fake-m5-user@example.invalid',
  SLACK_WEBHOOK_URL: 'https://hooks.example.invalid/fake-m5-webhook-777',
  RESEND_API_KEY: 're_fake_m5_resend_key_888',
};

const db1 = join(tmpDir(), 'alerts-e2e.db');
const env1 = { ...SECRETS, SOURCE_MODE: 'samples', SAMPLES_DIR: FULL_SAMPLES, DB_PATH: db1, POLLING: 'off' };

await setup({ rootDir: ROOT, server: true, build: true, env: env1 });

afterAll(cleanupTmp);

type Alerts = { total: number; shown: number; countLine: string; rows: Record<string, string>[] };

const html = (path: string) => $fetch<string>(path, { responseType: 'text' });

/** The cells of each row of the Alerts fired table, header row first. */
function alertsTable(page: string): string[][] {
  const at = page.indexOf('>Alerts fired<');
  expect(at).toBeGreaterThan(-1);
  const section = page.slice(at, page.indexOf('</section>', at));
  return [...section.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([^<]*)<\/t[hd]>/g)].map((c) => c[1]));
}

const MESSAGE_LINES = /Where: |When: |Source: GDACS|(rose|fell) \d+\.\d% today/;

async function adminTexts(): Promise<string[]> {
  return [await html('/admin'), ...(await Promise.all(['/api/admin/sources', '/api/admin/events', '/api/admin/alerts'].map(async (p) => JSON.stringify(await $fetch(p)))))];
}

function pollOnce(dbPath: string) {
  const clean = { ...process.env };
  for (const k of ['SOURCE_MODE', 'DELIVERY_MODE', 'POLLING', 'TWELVE_DATA_API_KEY', 'EVENT_REGISTRY_API_KEY']) delete clean[k];
  return spawnSync('node', ['--import', join(ROOT, 'tests/setup/no-network-child.mjs'), 'scripts/poll-once.ts'], {
    cwd: ROOT,
    env: { ...clean, ...SECRETS, SAMPLES_DIR: FULL_SAMPLES, DB_PATH: dbPath },
    encoding: 'utf8',
  });
}

describe('M5 Alerts fired, end to end', () => {
  it('AC-15 AC-18 POLLING=off: no startup poll, no check rows; the screens work; No alerts fired yet. while waiting', async () => {
    await new Promise((r) => setTimeout(r, 1500));
    const sources = await $fetch<{ lines: string[]; checked: number }>('/api/admin/sources');
    expect(sources.checked).toBe(0);
    const db = await openDb(db1);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM source_checks').get()).toEqual({ n: 0 });
    await db.dispose();
    const page = await html('/admin');
    expect(page).toContain('Waiting for the first event.');
    expect(page).toContain('<h2>Alerts fired</h2>');
    expect(page).toContain('No alerts fired yet.');
    expect(page).not.toContain('<table');
    expect(await $fetch<Alerts>('/api/admin/alerts')).toEqual({ total: 0, shown: 0, countLine: 'No alerts fired yet.', rows: [] });
    expect(await html('/')).toContain('<title>Your alert</title>');
  });

  it('AC-17 /api/admin/alerts answers GET only, and writes leave the database unchanged', async () => {
    expect((await fetch('/api/admin/alerts')).status).toBe(200);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const r = await fetch('/api/admin/alerts', { method, body: method === 'DELETE' ? undefined : '{}', headers: { 'content-type': 'application/json' } });
      expect(r.status, method).toBeGreaterThanOrEqual(400);
      expect(r.status, method).toBeLessThan(500);
    }
    const db = await openDb(db1);
    expect(await db.prepare('SELECT (SELECT COUNT(*) FROM alerts_fired) AS f, (SELECT COUNT(*) FROM deliveries) AS d').get()).toEqual({ f: 0, d: 0 });
    await db.dispose();
  });

  it('AC-21 fake delivery to both channels: no contact value or message line on /admin or /api/admin/*; contacts only in the alert table', async () => {
    const put = await fetch('/api/alert', { method: 'PUT', body: JSON.stringify({ email: true, slack: true }), headers: { 'content-type': 'application/json' } });
    expect(put.status).toBe(200);
    const r = pollOnce(db1);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('alerts: 5 sent, 0 not sent');

    const page = await html('/admin');
    const table = alertsTable(page);
    expect(table[0]).toEqual(['Cleared bar at (UTC)', 'Kind', 'What', 'Alert', 'Email', 'Slack']);
    expect(table).toHaveLength(6);
    for (const row of table.slice(1)) {
      expect(row[0]).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d UTC$/);
      expect(row.slice(3)).toEqual(['Sent', 'Delivered (fake: not sent)', 'Delivered (fake: not sent)']);
    }
    expect(page).toContain('Showing 5 of 5 alerts fired, newest first.');

    for (const text of await adminTexts()) {
      for (const v of Object.values(SECRETS)) expect(text).not.toContain(v);
      expect(text).not.toMatch(MESSAGE_LINES);
    }

    const db = await openDb(db1);
    const tables = ((await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all()) as { name: string }[]).map((t) => t.name);
    expect(tables).toEqual(expect.arrayContaining(['events', 'source_checks', 'alert', 'alerts_fired', 'deliveries']));
    for (const t of tables) {
      const dump = JSON.stringify(await db.prepare(`SELECT * FROM ${t}`).all());
      if (t === 'alert') {
        expect(dump).toContain(SECRETS.DEMO_USER_EMAIL);
        expect(dump).toContain(SECRETS.SLACK_WEBHOOK_URL);
      } else {
        for (const v of Object.values(SECRETS)) expect(dump, t).not.toContain(v);
      }
      expect(dump, t).not.toMatch(/Where: |When: |Source: GDACS|% today/);
    }
    await db.dispose();
  });

  it('AC-22 AC-20 AC-7 a sent event with one channel delivered and one failed, the three not-sent reasons, and an interrupted delivery', async () => {
    const db2 = join(tmpDir(), 'alerts-e2e-2.db');
    const db = await openDb(db2);
    const ev = (sourceId: string): ParsedEvent => ({ kind: 'disaster', sourceId, what: `Event ${sourceId}`, where: 'Chad', sourceTime: '2026-11-04T00:00:00.000Z', measure: 'Red', current: true, madeCut: true, raw: {} });
    const add = (d: Db, at: string, id: string) => recordPoll(d, { source: 'gdacs', checkedAt: at, outcome: 'ok', detail: '', events: [ev(id)] });
    const contacts = { DEMO_USER_EMAIL: SECRETS.DEMO_USER_EMAIL, SLACK_WEBHOOK_URL: SECRETS.SLACK_WEBHOOK_URL };

    await add(db, '2026-11-04T01:00:00.000Z', 'nosetup');
    await matchAlerts({ db, mode: 'fake', env: {}, fetch: throwingFetch() });
    await saveAlert(db, contacts, { email: true, slack: true }, new Date('2026-11-04T03:00:00.000Z'));
    await add(db, '2026-11-04T02:00:00.000Z', 'before');
    await add(db, '2026-11-04T04:00:00.000Z', 'sent');
    const f = (async (url: string) =>
      String(url).startsWith('https://api.resend.com') ? jsonResponse({ id: 'em_e2e' }) : new Response('no_service', { status: 404 })) as unknown as typeof fetch;
    await matchAlerts({ db, mode: 'live', env: { RESEND_API_KEY: SECRETS.RESEND_API_KEY }, fetch: f });
    await saveAlert(db, contacts, { email: false, slack: false }, new Date('2026-11-04T05:00:00.000Z'));
    await add(db, '2026-11-04T06:00:00.000Z', 'none');
    await matchAlerts({ db, mode: 'fake', env: {}, fetch: throwingFetch() });
    // A delivery left in progress by a process that stopped.
    await add(db, '2026-11-04T07:00:00.000Z', 'cut');
    await db.exec("INSERT INTO alerts_fired (kind, source_id, matched_at, sent, reason) VALUES ('disaster', 'cut', '2026-11-04T07:00:00.000Z', 1, '')");
    await db.exec("INSERT INTO deliveries (kind, source_id, channel, outcome, detail, started_at) VALUES ('disaster', 'cut', 'email', 'sending', '', '2026-11-04T07:00:00.000Z')");
    await db.dispose();

    await startServer({ env: { ...env1, DB_PATH: db2 } });
    const page = await html('/admin');
    expect(page).toContain('Showing 5 of 5 alerts fired, newest first.');
    expect(alertsTable(page)).toEqual([
      ['Cleared bar at (UTC)', 'Kind', 'What', 'Alert', 'Email', 'Slack'],
      ['2026-11-04 07:00:00 UTC', 'Natural disaster', 'Event cut', 'Sent', 'Failed: interrupted, outcome unknown', 'Not picked'],
      ['2026-11-04 06:00:00 UTC', 'Natural disaster', 'Event none', 'Not sent: no channels picked', '', ''],
      ['2026-11-04 04:00:00 UTC', 'Natural disaster', 'Event sent', 'Sent', 'Delivered (accepted by Resend)', 'Failed: HTTP 404 no_service'],
      ['2026-11-04 02:00:00 UTC', 'Natural disaster', 'Event before', 'Not sent: made the cut before the alert was set up', '', ''],
      ['2026-11-04 01:00:00 UTC', 'Natural disaster', 'Event nosetup', 'Not sent: no alert set up', '', ''],
    ]);
    for (const text of await adminTexts()) for (const v of Object.values(SECRETS)) expect(text).not.toContain(v);
  });

  it('AC-14 AC-15 the built server refuses to start on a bad DELIVERY_MODE or POLLING', () => {
    const out = useTestContext().nuxt!.options.nitro.output!.dir!;
    const cases: [Record<string, string>, RegExp][] = [
      [{ DELIVERY_MODE: 'foo' }, /DELIVERY_MODE.*"fake".*"live"/],
      [{ POLLING: 'foo' }, /POLLING.*"on".*"off"/],
    ];
    for (const [extra, message] of cases) {
      const clean = { ...process.env };
      delete clean.DELIVERY_MODE;
      delete clean.POLLING;
      const r = spawnSync('node', ['--import', join(ROOT, 'tests/setup/no-network-child.mjs'), join(out, 'server/index.mjs')], {
        env: { ...clean, ...extra, SOURCE_MODE: 'samples', SAMPLES_DIR: FULL_SAMPLES, PORT: '0', HOST: '127.0.0.1', DB_PATH: join(tmpDir(), 'x.db') },
        encoding: 'utf8',
        timeout: 20_000,
      });
      expect(r.status, JSON.stringify(extra)).not.toBe(0);
      expect(r.signal).toBeNull();
      expect(`${r.stdout}${r.stderr}`).toMatch(message);
    }
  });
});
