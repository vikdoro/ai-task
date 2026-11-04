import { afterAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { $fetch, fetch, setup, startServer, useTestContext } from '@nuxt/test-utils/e2e';
import { openDb } from '../../lib/storage/db.ts';
import { EMPTY_SAMPLES, FULL_SAMPLES, ROOT, cleanupTmp, tmpDir } from '../helpers.ts';

const SECRETS = {
  DEMO_USER_EMAIL: 'fake-demo-user@example.invalid',
  SLACK_WEBHOOK_URL: 'https://hooks.example.invalid/fake-slack-webhook-123',
  RESEND_API_KEY: 're_fake_resend_key_456',
  TWELVE_DATA_API_KEY: 'td_fake_key_789',
  EVENT_REGISTRY_API_KEY: 'er_fake_key_abc',
};

const dbs: string[] = [];
function envFor(samplesDir: string) {
  const db = join(tmpDir(), 'e2e.db');
  dbs.push(db);
  return { db, env: { ...SECRETS, SOURCE_MODE: 'samples', SAMPLES_DIR: samplesDir, DB_PATH: db } };
}

const first = envFor(EMPTY_SAMPLES);
await setup({ rootDir: ROOT, server: true, build: true, env: first.env });

afterAll(cleanupTmp);

type Sources = { lines: string[]; checked: number };
type Events = { total: number; shown: number; countLine: string; rows: Record<string, string>[] };

async function waitForChecks() {
  for (let i = 0; i < 100; i++) {
    const s = await $fetch<Sources>('/api/admin/sources');
    if (s.checked === 3) return s;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('startup polls did not finish');
}

function expectNoSecrets(text: string) {
  for (const v of Object.values(SECRETS)) expect(text).not.toContain(v);
}

async function expectNoSecretsAnywhere(dbPath: string) {
  const html = await $fetch<string>('/admin', { responseType: 'text' });
  expectNoSecrets(html);
  expectNoSecrets(JSON.stringify(await $fetch('/api/admin/sources')));
  expectNoSecrets(JSON.stringify(await $fetch('/api/admin/events')));
  for (const f of [dbPath, `${dbPath}-wal`]) if (existsSync(f)) expectNoSecrets(readFileSync(f).toString('latin1'));
}

describe('admin view, end to end', () => {
  it('AC-20 AC-21 waiting state: no events, status line per source', async () => {
    await waitForChecks();
    const html = await $fetch<string>('/admin', { responseType: 'text' });
    expect(html).toContain('<title>Admin: events in</title>');
    expect(html).toContain('Waiting for the first event.');
    expect(html).toMatch(/GDACS: last checked \d{4}-\d\d-\d\d \d\d:\d\d:\d\d UTC/);
    expect(html).toMatch(/Twelve Data: last checked \d{4}-\d\d-\d\d \d\d:\d\d:\d\d UTC/);
    expect(html).toMatch(/Event Registry: last checked \d{4}-\d\d-\d\d \d\d:\d\d:\d\d UTC/);
    expect(html).not.toContain('<table');
  });

  it('AC-22 the admin API answers GET only and writes leave the database unchanged', async () => {
    const db = await openDb(first.db);
    const count = async () => JSON.stringify(await db.prepare('SELECT (SELECT COUNT(*) FROM events) AS e, (SELECT COUNT(*) FROM source_checks) AS c').get());
    const before = await count();
    for (const path of ['/api/admin/sources', '/api/admin/events']) {
      expect((await fetch(path)).status).toBe(200);
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        const r = await fetch(path, { method, body: method === 'DELETE' ? undefined : '{}', headers: { 'content-type': 'application/json' } });
        expect(r.status, `${method} ${path}`).toBeGreaterThanOrEqual(400);
        expect(r.status, `${method} ${path}`).toBeLessThan(500);
      }
    }
    expect(await count()).toBe(before);
    const html = await $fetch<string>('/admin', { responseType: 'text' });
    expect(html).not.toMatch(/<form|<button|<input|<textarea|<select/);
  });

  it('AC-18 AC-19 AC-23 events state: server-rendered table with the columns and rows, no secrets', async () => {
    const next = envFor(FULL_SAMPLES);
    await startServer({ env: next.env });
    await waitForChecks();
    const html = await $fetch<string>('/admin', { responseType: 'text' });
    expect(html).toContain('<title>Admin: events in</title>');
    expect(html).not.toContain('Waiting for the first event.');
    const headers = [...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1]);
    expect(headers).toEqual(['Received (UTC)', 'Kind', 'What', 'Where', 'Source time', 'Measure', 'Current', 'Cleared bar', 'Source ID']);
    expect(html).toContain('Showing 11 of 11 events, newest first.');
    expect(html).toContain('Tropical Cyclone A');
    expect(html).toContain('Natural disaster');
    expect(html).toContain('Market movement');
    expect(html).toContain('Breaking news');
    expect(html).toContain('+3.50%');
    expect(html).toContain('1,234 articles');
    expect(html).toContain('Twelve Data: last checked');
    expect(html).toContain('. USO: code 404: symbol not found');
    const ev = await $fetch<Events>('/api/admin/events');
    expect(ev.total).toBe(11);
    expect(ev.rows).toHaveLength(11);
    await expectNoSecretsAnywhere(next.db);
  });

  it('AC-21 unreachable state: the reason and last success are shown', async () => {
    const missing = resolve(tmpDir(), 'no-samples-here');
    const next = envFor(missing);
    await startServer({ env: next.env });
    await waitForChecks();
    const html = await $fetch<string>('/admin', { responseType: 'text' });
    expect(html).toContain('Waiting for the first event.');
    expect(html).toContain(`GDACS could not be reached: no samples found in ${missing}. Last success: never.`);
    expect(html).toContain(`Twelve Data could not be reached: no samples found in ${missing}. Last success: never.`);
    expect(html).toContain(`Event Registry could not be reached: no samples found in ${missing}. Last success: never.`);
    await expectNoSecretsAnywhere(next.db);
  });

  it('AC-15 the built server refuses to start on a bad SOURCE_MODE', () => {
    const out = useTestContext().nuxt!.options.nitro.output!.dir!;
    const r = spawnSync('node', [join(out, 'server/index.mjs')], {
      env: { ...process.env, SOURCE_MODE: 'foo', PORT: '0', HOST: '127.0.0.1', DB_PATH: join(tmpDir(), 'x.db') },
      encoding: 'utf8',
      timeout: 20_000,
    });
    expect(r.status).not.toBe(0);
    expect(r.signal).toBeNull();
    expect(`${r.stdout}${r.stderr}`).toMatch(/SOURCE_MODE.*"samples".*"live"/);
  });
});
