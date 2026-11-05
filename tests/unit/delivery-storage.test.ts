import { afterEach, describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { createDatabase } from 'db0';
import nodeSqlite from 'db0/connectors/node-sqlite';
import { openDb, type Db } from '../../lib/storage/db.ts';
import { SCHEMA } from '../../lib/storage/schema.ts';
import { cleanupTmp, tmpDb, tmpDir } from '../helpers.ts';

afterEach(cleanupTmp);

async function columns(db: Db, table: string): Promise<string[]> {
  return ((await db.prepare(`PRAGMA table_info(${table})`).all()) as { name: string }[]).map((c) => c.name);
}

const FIRED = "INSERT INTO alerts_fired (kind, source_id, matched_at, sent, reason) VALUES ('disaster', 'd-1', '2026-11-04T00:00:00.000Z', 1, '')";
/** db0's exec throws synchronously on node:sqlite; this catches either way. */
async function failure(db: Db, sql: string): Promise<string> {
  try {
    await db.exec(sql);
  } catch (err) {
    return String(err);
  }
  return '';
}

const DELIVERY = "INSERT INTO deliveries (kind, source_id, channel, outcome, detail, started_at) VALUES ('disaster', 'd-1', 'email', 'sending', '', '2026-11-04T00:00:00.000Z')";

describe('M5 AC-4 the two new tables', () => {
  it('AC-4 two more CREATE TABLE IF NOT EXISTS statements; the first three are the M4 ones', () => {
    expect(SCHEMA).toHaveLength(5);
    expect(SCHEMA[3]).toMatch(/^CREATE TABLE IF NOT EXISTS alerts_fired \(/);
    expect(SCHEMA[4]).toMatch(/^CREATE TABLE IF NOT EXISTS deliveries \(/);
    expect(SCHEMA.slice(0, 3).map((s) => s.match(/EXISTS (\w+)/)![1])).toEqual(['events', 'source_checks', 'alert']);
  });

  it('AC-4 alerts_fired holds the matching time, sent and the reason; deliveries the channel, outcome, detail, email id and times', async () => {
    const { db } = await tmpDb();
    expect(await columns(db, 'alerts_fired')).toEqual(['kind', 'source_id', 'matched_at', 'sent', 'reason']);
    expect(await columns(db, 'deliveries')).toEqual(['kind', 'source_id', 'channel', 'outcome', 'detail', 'email_id', 'started_at', 'finished_at']);
  });

  it('AC-4 neither table can hold the message text, the email address or the webhook URL', async () => {
    const { db } = await tmpDb();
    for (const t of ['alerts_fired', 'deliveries']) for (const c of await columns(db, t)) expect(c).not.toMatch(/text|subject|body|address|webhook|url|to$/i);
  });

  it('AC-4 the keys refuse a second row for the same event, or event and channel', async () => {
    const { db } = await tmpDb();
    await db.exec(FIRED);
    expect(await failure(db, FIRED)).toMatch(/UNIQUE|PRIMARY/);
    await db.exec(DELIVERY);
    expect(await failure(db, DELIVERY)).toMatch(/UNIQUE|PRIMARY/);
    await db.exec(DELIVERY.replace("'email'", "'slack'"));
    expect(((await db.prepare('SELECT COUNT(*) AS n FROM deliveries').get()) as { n: number }).n).toBe(2);
  });

  it('AC-4 only the allowed values are accepted', async () => {
    const { db } = await tmpDb();
    expect(await failure(db, FIRED.replace("1, ''", "0, 'some other reason'"))).toMatch(/CHECK/);
    for (const reason of ['no alert set up', 'made the cut before the alert was set up', 'no channels picked'])
      await db.exec(FIRED.replace("'d-1'", `'${reason}'`).replace("1, ''", `0, '${reason}'`));
    expect(await failure(db, DELIVERY.replace("'email'", "'sms'"))).toMatch(/CHECK/);
    expect(await failure(db, DELIVERY.replace("'sending'", "'queued'"))).toMatch(/CHECK/);
  });

  it('AC-4 opening an M4 database twice adds the tables, raises no error and loses no row', async () => {
    const path = join(tmpDir(), 'm4.db');
    const m4 = createDatabase(nodeSqlite({ path }));
    for (const s of SCHEMA.slice(0, 3)) await m4.exec(s);
    await m4.exec("INSERT INTO events (kind, source_id, what, place, source_time, measure, current, made_cut, cleared_at, first_seen_at, last_seen_at, raw_json) VALUES ('news', 'n-1', 'w', 'p', '2026-11-02', 'm', NULL, 1, '2026-11-02T00:00:00.000Z', '2026-11-02T00:00:00.000Z', '2026-11-02T00:00:00.000Z', '{}')");
    await m4.exec("INSERT INTO source_checks (source, checked_at, outcome, detail) VALUES ('gdacs', '2026-11-02T00:00:00.000Z', 'ok', '1 items, 1 made the cut')");
    await m4.exec("INSERT INTO alert (id, email, slack, email_address, slack_webhook_url, created_at, updated_at) VALUES (1, 1, 0, 'a@example.invalid', '', '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z')");
    await m4.dispose();
    for (let i = 0; i < 2; i++) {
      const db = await openDb(path);
      const counts = await db.prepare('SELECT (SELECT COUNT(*) FROM events) AS e, (SELECT COUNT(*) FROM source_checks) AS c, (SELECT COUNT(*) FROM alert) AS a, (SELECT COUNT(*) FROM alerts_fired) AS f, (SELECT COUNT(*) FROM deliveries) AS d').get();
      expect(counts).toEqual({ e: 1, c: 1, a: 1, f: 0, d: 0 });
      await db.dispose();
    }
  });
});
