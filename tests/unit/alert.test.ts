import { afterEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { PICK_ONE, deleteAlert, getAlertState, parseTicked, saveAlert, type Env } from '../../lib/alert.ts';
import { resolveConfig } from '../../lib/config.ts';
import { openDb, type Db } from '../../lib/storage/db.ts';
import { SCHEMA } from '../../lib/storage/schema.ts';
import { countEvents, latestCheck, recordPoll } from '../../lib/storage/store.ts';
import { cleanupTmp, tmpDb, tmpDir } from '../helpers.ts';

afterEach(cleanupTmp);

const FAKE_EMAIL = 'fake-user@example.invalid';
const FAKE_HOOK = 'https://hooks.example.invalid/fake-hook-1';
const BOTH: Env = { DEMO_USER_EMAIL: FAKE_EMAIL, SLACK_WEBHOOK_URL: FAKE_HOOK };
const T1 = new Date('2026-11-05T10:00:00.000Z');
const T2 = new Date('2026-11-05T11:00:00.000Z');
const T3 = new Date('2026-11-05T12:00:00.000Z');

type Row = { email: number; slack: number; email_address: string; slack_webhook_url: string; created_at: string; updated_at: string };

async function rows(db: Db): Promise<Row[]> {
  return (await db.prepare('SELECT email, slack, email_address, slack_webhook_url, created_at, updated_at FROM alert').all()) as Row[];
}

async function seedPoll(db: Db) {
  await recordPoll(db, {
    source: 'eventregistry',
    checkedAt: '2026-11-04T10:00:00.000Z',
    outcome: 'ok',
    detail: '1 items',
    events: [{ kind: 'news', sourceId: 'eng-1', what: 'Story', where: 'Place', sourceTime: '2026-11-02', measure: '1 articles', current: null, madeCut: true, raw: {} }],
  });
}

async function snapshot(db: Db) {
  return JSON.stringify([await db.prepare('SELECT * FROM events ORDER BY kind, source_id').all(), await db.prepare('SELECT * FROM source_checks ORDER BY id').all()]);
}

describe('AC-1 alert table', () => {
  it('AC-1 the schema has a CREATE TABLE IF NOT EXISTS alert statement', () => {
    expect(SCHEMA.some((s) => /^CREATE TABLE IF NOT EXISTS alert\s*\(/.test(s.trim()))).toBe(true);
  });

  it('AC-1 the table holds the listed columns and refuses a second row', async () => {
    const { db } = await tmpDb();
    const cols = ((await db.prepare("SELECT name FROM pragma_table_info('alert')").all()) as { name: string }[]).map((c) => c.name);
    for (const c of ['email', 'slack', 'email_address', 'slack_webhook_url', 'created_at', 'updated_at']) expect(cols).toContain(c);
    const insert = "INSERT INTO alert (email, slack, email_address, slack_webhook_url, created_at, updated_at) VALUES (1, 0, '', '', 'x', 'x')";
    await db.exec(insert);
    await expect(async () => db.exec(insert)).rejects.toThrow();
    expect(await rows(db)).toHaveLength(1);
  });

  it('AC-1 email and slack accept only 0 or 1', async () => {
    const { db } = await tmpDb();
    await expect(async () => db.exec("INSERT INTO alert (email, slack, email_address, slack_webhook_url, created_at, updated_at) VALUES (2, 0, '', '', 'x', 'x')")).rejects.toThrow();
  });

  it('AC-1 opening an M3 database with rows twice adds the table and loses no row', async () => {
    const path = join(tmpDir(), 'm3.db');
    const m3 = await openDb(path);
    await m3.exec('DROP TABLE alert');
    await seedPoll(m3);
    const once = await openDb(path);
    const twice = await openDb(path);
    expect(await countEvents(twice)).toBe(1);
    expect((await latestCheck(twice, 'eventregistry'))?.outcome).toBe('ok');
    expect(await rows(once)).toEqual([]);
    expect((await getAlertState(twice, {})).exists).toBe(false);
  });
});

describe('AC-2 the alert lives in the database of the mode in use', () => {
  it('AC-2 an alert saved in one database file is not found in another', async () => {
    const dir = tmpDir();
    const a = await openDb(join(dir, 'samples.db'));
    const b = await openDb(join(dir, 'app.db'));
    expect((await saveAlert(a, BOTH, { email: true, slack: false }, T1)).ok).toBe(true);
    expect((await getAlertState(a, BOTH)).exists).toBe(true);
    expect((await getAlertState(b, BOTH)).exists).toBe(false);
  });

  it('AC-2 the database path follows the mode, or DB_PATH', () => {
    expect(resolveConfig({}, '/r').dbPath).toBe('/r/data/samples.db');
    expect(resolveConfig({ SOURCE_MODE: 'live' }, '/r').dbPath).toBe('/r/data/app.db');
    expect(resolveConfig({ DB_PATH: 'x.db' }, '/r').dbPath).toBe('/r/x.db');
  });
});

describe('AC-3 contact values are copied from the environment', () => {
  it('AC-3 set keys are written on a new alert, whether or not the channel is ticked', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, BOTH, { email: true, slack: false }, T1);
    const [r] = await rows(db);
    expect(r.email_address).toBe(FAKE_EMAIL);
    expect(r.slack_webhook_url).toBe(FAKE_HOOK);
  });

  it('AC-3 a key that is not set stays empty on a new alert', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, { DEMO_USER_EMAIL: FAKE_EMAIL }, { email: true, slack: false }, T1);
    const [r] = await rows(db);
    expect(r.email_address).toBe(FAKE_EMAIL);
    expect(r.slack_webhook_url).toBe('');
  });

  it('AC-3 a key that is not set keeps the stored value on a change', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, BOTH, { email: true, slack: true }, T1);
    await saveAlert(db, {}, { email: false, slack: true }, T2);
    const [r] = await rows(db);
    expect(r.email_address).toBe(FAKE_EMAIL);
    expect(r.slack_webhook_url).toBe(FAKE_HOOK);
    expect([r.email, r.slack]).toEqual([0, 1]);
  });

  it('AC-3 a set key overwrites the stored value on every save', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, BOTH, { email: true, slack: false }, T1);
    await saveAlert(db, { DEMO_USER_EMAIL: 'other@example.invalid', SLACK_WEBHOOK_URL: 'https://hooks.example.invalid/other' }, { email: true, slack: false }, T2);
    const [r] = await rows(db);
    expect(r.email_address).toBe('other@example.invalid');
    expect(r.slack_webhook_url).toBe('https://hooks.example.invalid/other');
  });

  it('AC-3 an empty key counts as not set', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, BOTH, { email: true, slack: false }, T1);
    await saveAlert(db, { DEMO_USER_EMAIL: '', SLACK_WEBHOOK_URL: '' }, { email: true, slack: false }, T2);
    const [r] = await rows(db);
    expect(r.email_address).toBe(FAKE_EMAIL);
    expect(r.slack_webhook_url).toBe(FAKE_HOOK);
  });
});

describe('AC-4 times', () => {
  it('AC-4 setup writes created_at and updated_at; a change updates updated_at only', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, BOTH, { email: true, slack: false }, T1);
    expect(await rows(db)).toMatchObject([{ created_at: T1.toISOString(), updated_at: T1.toISOString() }]);
    await saveAlert(db, BOTH, { email: true, slack: true }, T2);
    expect(await rows(db)).toMatchObject([{ created_at: T1.toISOString(), updated_at: T2.toISOString() }]);
  });
});

describe('AC-5 delete', () => {
  it('AC-5 deleting removes the row and leaves events and source_checks unchanged', async () => {
    const { db } = await tmpDb();
    await seedPoll(db);
    const before = await snapshot(db);
    await saveAlert(db, BOTH, { email: true, slack: true }, T1);
    const state = await deleteAlert(db, BOTH);
    expect(state.exists).toBe(false);
    expect(await rows(db)).toEqual([]);
    expect(await snapshot(db)).toBe(before);
  });

  it('AC-5 a new setup after a delete gets a new created_at', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, BOTH, { email: true, slack: false }, T1);
    await deleteAlert(db, BOTH);
    await saveAlert(db, BOTH, { email: true, slack: false }, T3);
    expect(await rows(db)).toMatchObject([{ created_at: T3.toISOString(), updated_at: T3.toISOString() }]);
  });

  it('AC-5 deleting when there is no alert succeeds and changes nothing', async () => {
    const { db } = await tmpDb();
    await seedPoll(db);
    const before = await snapshot(db);
    await expect(deleteAlert(db, BOTH)).resolves.toMatchObject({ exists: false });
    expect(await rows(db)).toEqual([]);
    expect(await snapshot(db)).toBe(before);
  });
});

describe('AC-6 to AC-9 rules', () => {
  type Case = {
    exists: boolean;
    emailKey: boolean;
    slackKey: boolean;
    stored: 'none' | 'email' | 'both';
    ticked: { email: boolean; slack: boolean };
    result: 'saved' | 'pick' | 'unavailable';
  };
  const cases: Case[] = [
    { exists: false, emailKey: true, slackKey: true, stored: 'none', ticked: { email: true, slack: false }, result: 'saved' },
    { exists: false, emailKey: true, slackKey: true, stored: 'none', ticked: { email: true, slack: true }, result: 'saved' },
    { exists: false, emailKey: true, slackKey: true, stored: 'none', ticked: { email: false, slack: false }, result: 'pick' },
    { exists: false, emailKey: true, slackKey: false, stored: 'none', ticked: { email: false, slack: true }, result: 'unavailable' },
    { exists: false, emailKey: false, slackKey: false, stored: 'none', ticked: { email: true, slack: false }, result: 'unavailable' },
    { exists: false, emailKey: false, slackKey: false, stored: 'none', ticked: { email: false, slack: false }, result: 'pick' },
    { exists: true, emailKey: true, slackKey: true, stored: 'both', ticked: { email: false, slack: false }, result: 'saved' },
    { exists: true, emailKey: false, slackKey: true, stored: 'email', ticked: { email: true, slack: false }, result: 'saved' },
    { exists: true, emailKey: false, slackKey: true, stored: 'none', ticked: { email: true, slack: false }, result: 'unavailable' },
  ];

  async function seed(db: Db, c: Case) {
    if (!c.exists) return;
    const email = c.stored === 'email' || c.stored === 'both' ? FAKE_EMAIL : '';
    const hook = c.stored === 'both' ? FAKE_HOOK : '';
    await db
      .prepare('INSERT INTO alert (email, slack, email_address, slack_webhook_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(email ? 1 : 0, hook ? 1 : 0, email, hook, T1.toISOString(), T1.toISOString());
  }

  it.each(cases)('AC-6 AC-7 AC-8 AC-9 exists=$exists email key=$emailKey slack key=$slackKey stored=$stored ticked=$ticked -> $result', async (c) => {
    const { db } = await tmpDb();
    await seed(db, c);
    const env: Env = {};
    if (c.emailKey) env.DEMO_USER_EMAIL = FAKE_EMAIL;
    if (c.slackKey) env.SLACK_WEBHOOK_URL = FAKE_HOOK;
    const before = await rows(db);
    const res = await saveAlert(db, env, c.ticked, T2);
    if (c.result === 'saved') {
      expect(res.ok).toBe(true);
      const after = await rows(db);
      expect(after).toHaveLength(1);
      expect([after[0].email, after[0].slack]).toEqual([c.ticked.email ? 1 : 0, c.ticked.slack ? 1 : 0]);
      if (res.ok) {
        expect(res.state.exists).toBe(true);
        expect(res.state.email.ticked).toBe(c.ticked.email);
        expect(res.state.slack.ticked).toBe(c.ticked.slack);
      }
      if (c.stored === 'email' && !c.emailKey) expect(after[0].email_address).toBe(FAKE_EMAIL);
    } else {
      expect(res.ok).toBe(false);
      if (!res.ok) {
        if (c.result === 'pick') expect(res.reason).toBe(PICK_ONE);
        else expect(res.reason).not.toBe(PICK_ONE);
        expect(res.reason.length).toBeGreaterThan(0);
      }
      expect(await rows(db)).toEqual(before);
    }
  });

  it('AC-6 availability: set key, or a stored value on the existing alert', async () => {
    const { db } = await tmpDb();
    let s = await getAlertState(db, { DEMO_USER_EMAIL: FAKE_EMAIL });
    expect(s).toEqual({ exists: false, email: { ticked: false, available: true, address: FAKE_EMAIL }, slack: { ticked: false, available: false } });
    s = await getAlertState(db, {});
    expect(s.email).toEqual({ ticked: false, available: false, address: null });
    await saveAlert(db, BOTH, { email: true, slack: false }, T1);
    s = await getAlertState(db, {});
    expect(s).toEqual({ exists: true, email: { ticked: true, available: true, address: FAKE_EMAIL }, slack: { ticked: false, available: true } });
  });

  it('AC-10 the shown address is the stored value, or else the environment value', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, { SLACK_WEBHOOK_URL: FAKE_HOOK }, { email: false, slack: true }, T1);
    expect((await getAlertState(db, { DEMO_USER_EMAIL: 'env@example.invalid' })).email.address).toBe('env@example.invalid');
    await saveAlert(db, BOTH, { email: true, slack: true }, T2);
    expect((await getAlertState(db, {})).email.address).toBe(FAKE_EMAIL);
  });

  it('AC-8 a change to zero channels keeps the alert', async () => {
    const { db } = await tmpDb();
    await saveAlert(db, BOTH, { email: true, slack: true }, T1);
    const res = await saveAlert(db, BOTH, { email: false, slack: false }, T2);
    expect(res.ok).toBe(true);
    expect(await rows(db)).toMatchObject([{ email: 0, slack: 0 }]);
    expect((await getAlertState(db, BOTH)).exists).toBe(true);
  });
});

describe('AC-10 AC-13 state shape', () => {
  it('AC-10 AC-13 the state never carries the webhook URL or the times', async () => {
    const { db } = await tmpDb();
    const res = await saveAlert(db, BOTH, { email: true, slack: true }, T1);
    for (const s of [res.ok ? res.state : null, await getAlertState(db, BOTH), await deleteAlert(db, BOTH)]) {
      const text = JSON.stringify(s);
      expect(text).not.toContain(FAKE_HOOK);
      expect(text).not.toMatch(/created_at|updated_at|createdAt|updatedAt|2026-11-05/);
    }
  });
});

describe('AC-11 body', () => {
  it('AC-11 parseTicked accepts exactly two booleans', () => {
    expect(parseTicked({ email: true, slack: false })).toEqual({ email: true, slack: false });
    for (const bad of [undefined, null, 'x', [], {}, { email: true }, { slack: true }, { email: 'true', slack: false }, { email: 1, slack: 0 }, { email: true, slack: null }, { email: true, slack: false, extra: 1 }]) {
      expect(parseTicked(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});
