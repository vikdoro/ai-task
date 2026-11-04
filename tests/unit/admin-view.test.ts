import { afterEach, describe, expect, it } from 'vitest';
import { getAdminEvents, getAdminSources } from '../../lib/admin.ts';
import { formatUtc } from '../../lib/format.ts';
import { recordPoll } from '../../lib/storage/store.ts';
import type { ParsedEvent } from '../../lib/sources/types.ts';
import { cleanupTmp, tmpDb } from '../helpers.ts';

afterEach(cleanupTmp);

const ev = (over: Partial<ParsedEvent>): ParsedEvent => ({
  kind: 'news',
  sourceId: 'id',
  what: 'w',
  where: 'p',
  sourceTime: '2026-11-02',
  measure: 'm',
  current: null,
  madeCut: false,
  raw: {},
  ...over,
});

describe('AC-19 events table', () => {
  it('AC-19 times are UTC as YYYY-MM-DD HH:MM:SS UTC', () => {
    expect(formatUtc('2026-11-04T07:05:09.123Z')).toBe('2026-11-04 07:05:09 UTC');
  });

  it('AC-19 rows carry the labels, values and order', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, {
      source: 'gdacs',
      checkedAt: '2026-11-04T10:00:00.000Z',
      outcome: 'ok',
      detail: '',
      events: [
        ev({ kind: 'disaster', sourceId: 'TC-1', sourceTime: '2026-11-01T00:00:00.000Z', current: true, madeCut: true, what: 'Cyclone', where: 'India', measure: 'Red' }),
        ev({ kind: 'disaster', sourceId: 'EQ-2', sourceTime: '2026-11-02T00:00:00.000Z', current: false }),
      ],
    });
    await recordPoll(db, {
      source: 'twelvedata',
      checkedAt: '2026-11-04T11:00:00.000Z',
      outcome: 'ok',
      detail: '',
      events: [ev({ kind: 'market', sourceId: 'SPY 2026-11-04', sourceTime: '2026-11-04T09:00:00.000Z' })],
    });
    await recordPoll(db, {
      source: 'eventregistry',
      checkedAt: '2026-11-04T11:00:00.000Z',
      outcome: 'ok',
      detail: '',
      events: [ev({ kind: 'news', sourceId: 'eng-1', sourceTime: '2026-11-03', madeCut: true })],
    });
    const view = await getAdminEvents(db);
    expect(view.total).toBe(4);
    expect(view.shown).toBe(4);
    expect(view.countLine).toBe('Showing 4 of 4 events, newest first.');
    expect(view.rows.map((r) => r.sourceId)).toEqual(['SPY 2026-11-04', 'eng-1', 'EQ-2', 'TC-1']);
    expect(view.rows[0]).toEqual({
      received: '2026-11-04 11:00:00 UTC',
      kind: 'Market movement',
      what: 'w',
      where: 'p',
      sourceTime: '2026-11-04 09:00:00 UTC',
      measure: 'm',
      current: '',
      clearedBar: 'No',
      sourceId: 'SPY 2026-11-04',
    });
    expect(view.rows[1]).toMatchObject({ kind: 'Breaking news', sourceTime: '2026-11-03', current: '', clearedBar: 'Yes' });
    expect(view.rows[2]).toMatchObject({ kind: 'Natural disaster', current: 'No', clearedBar: 'No' });
    expect(view.rows[3]).toMatchObject({ kind: 'Natural disaster', current: 'Yes', clearedBar: 'Yes', sourceTime: '2026-11-01 00:00:00 UTC', what: 'Cyclone', where: 'India', measure: 'Red' });
  });

  it('AC-19 at most 200 rows are shown, with the total', async () => {
    const { db } = await tmpDb();
    const events = Array.from({ length: 205 }, (_, i) => ev({ sourceId: `eng-${i}` }));
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', events });
    const view = await getAdminEvents(db);
    expect(view.rows).toHaveLength(200);
    expect(view.countLine).toBe('Showing 200 of 205 events, newest first.');
  });
});

describe('AC-20 empty state', () => {
  it('AC-20 with no events and no checks, every source is not checked yet', async () => {
    const { db } = await tmpDb();
    expect((await getAdminEvents(db)).total).toBe(0);
    expect((await getAdminSources(db)).lines).toEqual(['GDACS: not checked yet', 'Twelve Data: not checked yet', 'Event Registry: not checked yet']);
  });
});

describe('AC-21 status lines', () => {
  it('AC-21 each line follows the latest check', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'gdacs', checkedAt: '2026-11-04T09:00:00.000Z', outcome: 'ok', detail: '0 items, 0 made the cut' });
    await recordPoll(db, { source: 'gdacs', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'failed', detail: 'HTTP 503' });
    await recordPoll(db, { source: 'twelvedata', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'not configured', detail: 'TWELVE_DATA_API_KEY not set' });
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'paused', detail: 'token floor reached' });
    expect((await getAdminSources(db)).lines).toEqual([
      'GDACS could not be reached: HTTP 503. Last success: 2026-11-04 09:00:00 UTC.',
      'Twelve Data: not configured (API key missing).',
      'Event Registry: paused: token floor reached.',
    ]);
  });

  it('AC-21 ok lines, with Twelve Data symbol errors appended, and failed with no success ever', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'gdacs', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '3 items, 1 made the cut' });
    await recordPoll(db, { source: 'twelvedata', checkedAt: '2026-11-04T10:01:02.000Z', outcome: 'ok', detail: '4 items, 0 made the cut. GLD: code 404: symbol not found. USO: not in response' });
    await recordPoll(db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'failed', detail: 'timeout after 60 s' });
    expect((await getAdminSources(db)).lines).toEqual([
      'GDACS: last checked 2026-11-04 10:00:00 UTC',
      'Twelve Data: last checked 2026-11-04 10:01:02 UTC. GLD: code 404: symbol not found. USO: not in response',
      'Event Registry could not be reached: timeout after 60 s. Last success: never.',
    ]);
  });
});
