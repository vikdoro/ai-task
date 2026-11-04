import { afterEach, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { openDb } from '../../lib/storage/db.ts';
import { SCHEMA } from '../../lib/storage/schema.ts';
import { countEvents, latestCheck, listEvents, recordPoll } from '../../lib/storage/store.ts';
import type { ParsedEvent } from '../../lib/sources/types.ts';
import { cleanupTmp, tmpDb, tmpDir } from '../helpers.ts';

afterEach(cleanupTmp);

const ev = (over: Partial<ParsedEvent> = {}): ParsedEvent => ({
  kind: 'news',
  sourceId: 'eng-1',
  what: 'Story',
  where: 'Tenerife, Spain',
  sourceTime: '2026-11-02',
  measure: '1,234 articles',
  current: null,
  madeCut: true,
  raw: { uri: 'eng-1' },
  ...over,
});

describe('AC-1 schema', () => {
  it('AC-1 creates the SQLite file with events and source_checks', async () => {
    const path = join(tmpDir(), 'nested', 'app.db');
    const db = await openDb(path);
    expect(existsSync(path)).toBe(true);
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    const names = (tables as { name: string }[]).map((t) => t.name);
    expect(names).toContain('events');
    expect(names).toContain('source_checks');
  });

  it('AC-1 schema is only CREATE TABLE IF NOT EXISTS statements', () => {
    expect(SCHEMA.length).toBeGreaterThan(0);
    for (const s of SCHEMA) expect(s.trim()).toMatch(/^CREATE (TABLE|INDEX) IF NOT EXISTS /);
  });

  it('AC-1 running the schema twice on a database with rows raises no error and loses no row', async () => {
    const path = join(tmpDir(), 'app.db');
    const db = await openDb(path);
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '1 items', events: [ev()] });
    for (const s of SCHEMA) await db.exec(s);
    const again = await openDb(path);
    expect(await countEvents(again)).toBe(1);
    expect((await latestCheck(again, 'eventregistry'))?.outcome).toBe('ok');
  });
});

describe('AC-2 identity', () => {
  it('AC-2 a repeated event updates the row, keeps first_seen_at and never adds a second row', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ measure: '1,234 articles' })] });
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T11:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ measure: '2,000 articles', what: 'Story v2' })] });
    const rows = await listEvents(db, 200);
    expect(rows).toHaveLength(1);
    expect(rows[0].first_seen_at).toBe('2026-11-04T10:00:00.000Z');
    expect(rows[0].last_seen_at).toBe('2026-11-04T11:00:00.000Z');
    expect(rows[0].measure).toBe('2,000 articles');
    expect(rows[0].what).toBe('Story v2');
  });

  it('AC-2 two items with different source IDs but the same title are two rows', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ sourceId: 'a' }), ev({ sourceId: 'b' })] });
    expect(await countEvents(db)).toBe(2);
  });

  it('AC-2 the same source ID under different kinds is two rows', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ sourceId: 'x' }), ev({ sourceId: 'x', kind: 'market' })] });
    expect(await countEvents(db)).toBe(2);
  });
});

describe('AC-3 row shape', () => {
  it('AC-3 events and source_checks rows hold the listed fields', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, {
      source: 'gdacs',
      checkedAt: '2026-11-04T10:00:00.000Z',
      outcome: 'ok',
      detail: '1 items, 1 made the cut',
      events: [ev({ kind: 'disaster', sourceId: 'TC-1', current: true, raw: { properties: { name: 'A' } } })],
    });
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:01:00.000Z', outcome: 'failed', detail: 'HTTP 503', ratelimitRemaining: 1500 });
    const [row] = await listEvents(db, 200);
    expect(row).toMatchObject({
      kind: 'disaster',
      source_id: 'TC-1',
      what: 'Story',
      place: 'Tenerife, Spain',
      source_time: '2026-11-02',
      measure: '1,234 articles',
      current: 1,
      made_cut: 1,
      cleared_at: '2026-11-04T10:00:00.000Z',
      first_seen_at: '2026-11-04T10:00:00.000Z',
      last_seen_at: '2026-11-04T10:00:00.000Z',
    });
    expect(JSON.parse(row.raw_json)).toEqual({ properties: { name: 'A' } });
    const check = await latestCheck(db, 'eventregistry');
    expect(check).toMatchObject({ source: 'eventregistry', checked_at: '2026-11-04T10:01:00.000Z', outcome: 'failed', detail: 'HTTP 503', ratelimit_remaining: 1500 });
  });

  it('AC-3 current is empty for kinds other than disasters, and cleared_at is empty until the cut is made', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ madeCut: false })] });
    const [row] = await listEvents(db, 200);
    expect(row.current).toBeNull();
    expect(row.made_cut).toBe(0);
    expect(row.cleared_at).toBeNull();
  });

  it('AC-3 source_checks rejects an unknown outcome', async () => {
    const { db } = await tmpDb();
    await expect(recordPoll(db, { source: 'gdacs', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'bogus' as never, detail: '' })).rejects.toThrow();
  });
});

describe('AC-10 making the cut is permanent (storage)', () => {
  it('AC-10 a row that made the cut keeps made_cut and cleared_at when a later poll says no', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ madeCut: true })] });
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T11:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ madeCut: false })] });
    const [row] = await listEvents(db, 200);
    expect(row.made_cut).toBe(1);
    expect(row.cleared_at).toBe('2026-11-04T10:00:00.000Z');
  });

  it('AC-10 a row that makes the cut later gets cleared_at set to that poll time', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ madeCut: false })] });
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T11:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ madeCut: true })] });
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T12:00:00.000Z', outcome: 'ok', detail: '', events: [ev({ madeCut: true })] });
    const [row] = await listEvents(db, 200);
    expect(row.made_cut).toBe(1);
    expect(row.cleared_at).toBe('2026-11-04T11:00:00.000Z');
  });
});
