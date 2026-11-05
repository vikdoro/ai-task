import { afterAll, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { $fetch, fetch, setup, startServer } from '@nuxt/test-utils/e2e';
import { openDb } from '../../lib/storage/db.ts';
import { FULL_SAMPLES, ROOT, cleanupTmp, tmpDir } from '../helpers.ts';

const FAKE_EMAIL = 'fake-alert-user@example.invalid';
const FAKE_HOOK = 'https://hooks.example.invalid/fake-alert-webhook-xyz';

const dbPath = join(tmpDir(), 'alert-e2e.db');
const env = { SOURCE_MODE: 'samples', SAMPLES_DIR: FULL_SAMPLES, DB_PATH: dbPath, DEMO_USER_EMAIL: FAKE_EMAIL, SLACK_WEBHOOK_URL: FAKE_HOOK };

await setup({ rootDir: ROOT, server: true, build: true, env });

afterAll(cleanupTmp);

type State = { exists: boolean; email: { ticked: boolean; available: boolean; address: string | null }; slack: { ticked: boolean; available: boolean } };

async function put(body: unknown) {
  const r = await fetch('/api/alert', { method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'content-type': 'application/json' } });
  return { status: r.status, text: await r.text() };
}

async function alertRows() {
  const db = await openDb(dbPath);
  return db.prepare('SELECT * FROM alert').all();
}

const html = (path: string) => $fetch<string>(path, { responseType: 'text' });

async function waitForChecks() {
  for (let i = 0; i < 100; i++) {
    const s = await $fetch<{ checked: number }>('/api/admin/sources');
    if (s.checked === 3) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('startup polls did not finish');
}

describe('user screen and alert API, end to end', () => {
  it('AC-14 AC-15 GET / is server-rendered with title Your alert and the no-alert view', async () => {
    const page = await html('/');
    expect(page).toContain('<title>Your alert</title>');
    expect(page).toContain('You have no alert set up. Choose where to hear about important breaking news, market movements and natural disasters.');
    expect(page).toContain(`Email (${FAKE_EMAIL})`);
    expect(page).toContain('Slack (demo channel)');
    expect(page).toContain('Save alert');
    expect(page).not.toContain('Delete alert');
    expect(page).not.toMatch(/href="\/admin"/);
    expect(await html('/admin')).not.toMatch(/href="\/"/);
  });

  it('AC-10 GET /api/alert reports no alert, with availability and the email address', async () => {
    const s = await $fetch<State>('/api/alert');
    expect(s).toEqual({ exists: false, email: { ticked: false, available: true, address: FAKE_EMAIL }, slack: { ticked: false, available: true } });
  });

  it('AC-11 a setup with nothing ticked is refused with the reason and writes nothing', async () => {
    const r = await put({ email: false, slack: false });
    expect(r.status).toBe(400);
    expect(JSON.parse(r.text).reason).toBe('Pick at least one channel.');
    expect(await alertRows()).toEqual([]);
  });

  it('AC-11 any other body returns 400 and changes nothing', async () => {
    for (const body of ['not json', '{}', { email: true }, { email: 'yes', slack: false }, { email: true, slack: 1 }, [true, false], null]) {
      const r = await put(body);
      expect(r.status, JSON.stringify(body)).toBe(400);
    }
    expect(await alertRows()).toEqual([]);
  });

  it('AC-11 AC-16 a save returns the state; the page then shows the set-up view', async () => {
    const r = await put({ email: true, slack: true });
    expect(r.status).toBeGreaterThanOrEqual(200);
    expect(r.status).toBeLessThan(300);
    const s = JSON.parse(r.text) as State;
    expect(s).toEqual({ exists: true, email: { ticked: true, available: true, address: FAKE_EMAIL }, slack: { ticked: true, available: true } });
    expect(await $fetch<State>('/api/alert')).toEqual(s);
    const page = await html('/');
    expect(page).toContain('Your alert is set up.');
    expect(page).toContain('Covers: Breaking news, Market movements, Natural disasters');
    expect(page).toContain('Delete alert');
  });

  it('AC-18 AC-13 contact details stay where they belong', async () => {
    await waitForChecks();
    // The webhook URL reaches no user response.
    const userTexts = [await html('/'), JSON.stringify(await $fetch('/api/alert')), (await put({ email: true, slack: true })).text];
    for (const t of userTexts) {
      expect(t).not.toContain(FAKE_HOOK);
      expect(t).not.toMatch(/created_at|updated_at|createdAt|updatedAt|source_checks|raw_json/);
    }
    // Neither value reaches the admin.
    const adminTexts = [await html('/admin'), JSON.stringify(await $fetch('/api/admin/sources')), JSON.stringify(await $fetch('/api/admin/events'))];
    for (const t of adminTexts) {
      expect(t).not.toContain(FAKE_HOOK);
      expect(t).not.toContain(FAKE_EMAIL);
    }
    // In the database, only the alert table holds them.
    const db = await openDb(dbPath);
    const tables = ((await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()) as { name: string }[]).map((t) => t.name);
    expect(tables).toContain('alert');
    for (const t of tables) {
      const dump = JSON.stringify(await db.prepare(`SELECT * FROM "${t}"`).all());
      if (t === 'alert') {
        expect(dump).toContain(FAKE_HOOK);
        expect(dump).toContain(FAKE_EMAIL);
      } else {
        expect(dump, t).not.toContain(FAKE_HOOK);
        expect(dump, t).not.toContain(FAKE_EMAIL);
      }
    }
  });

  it('AC-8 a change to zero channels keeps the alert', async () => {
    const r = await put({ email: false, slack: false });
    expect(r.status).toBe(200);
    expect(JSON.parse(r.text)).toMatchObject({ exists: true, email: { ticked: false }, slack: { ticked: false } });
    expect(await alertRows()).toHaveLength(1);
  });

  it('AC-12 DELETE removes the alert and returns 2xx, also when there is none', async () => {
    const db = await openDb(dbPath);
    const counts = async () => JSON.stringify(await db.prepare('SELECT (SELECT COUNT(*) FROM events) AS e, (SELECT COUNT(*) FROM source_checks) AS c').get());
    const before = await counts();
    for (let i = 0; i < 2; i++) {
      const r = await fetch('/api/alert', { method: 'DELETE' });
      expect(r.status).toBeGreaterThanOrEqual(200);
      expect(r.status).toBeLessThan(300);
      expect(await r.text()).not.toMatch(/created_at|updated_at/);
    }
    expect(await alertRows()).toEqual([]);
    expect(await counts()).toBe(before);
    expect((await $fetch<State>('/api/alert')).exists).toBe(false);
  });

  it('AC-15 AC-6 with the keys not set, both channels show (not set up) and cannot be ticked', async () => {
    await startServer({ env: { ...env, DEMO_USER_EMAIL: '', SLACK_WEBHOOK_URL: '' } });
    const s = await $fetch<State>('/api/alert');
    expect(s).toEqual({ exists: false, email: { ticked: false, available: false, address: null }, slack: { ticked: false, available: false } });
    const page = await html('/');
    expect(page).toContain('Email (not set up)');
    expect(page).toContain('Slack (not set up)');
    expect((await put({ email: true, slack: false })).status).toBe(400);
    expect(await alertRows()).toEqual([]);
  });
});
