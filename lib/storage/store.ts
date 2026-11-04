import type { Db } from './db.ts';
import type { Source } from '../config.ts';
import type { ParsedEvent } from '../sources/types.ts';

export type Outcome = 'ok' | 'failed' | 'not configured' | 'paused';

export interface EventRow {
  kind: string;
  source_id: string;
  what: string;
  place: string;
  source_time: string | null;
  measure: string;
  current: 0 | 1 | null;
  made_cut: 0 | 1;
  cleared_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  raw_json: string;
}

export interface CheckRow {
  id: number;
  source: Source;
  checked_at: string;
  outcome: Outcome;
  detail: string;
  ratelimit_remaining: number | null;
}

export interface PollRecord {
  source: Source;
  checkedAt: string;
  outcome: Outcome;
  detail: string;
  ratelimitRemaining?: number | null;
  /** Stored only when the outcome is ok. */
  events?: ParsedEvent[];
}

// One write transaction at a time per database: db0 calls are async, so two polls could otherwise interleave.
const writeLocks = new WeakMap<Db, Promise<unknown>>();

async function withWriteLock<T>(db: Db, fn: () => Promise<T>): Promise<T> {
  const prev = writeLocks.get(db) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  writeLocks.set(db, next);
  return next;
}

const UPSERT = `INSERT INTO events
  (kind, source_id, what, place, source_time, measure, current, made_cut, cleared_at, first_seen_at, last_seen_at, raw_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (kind, source_id) DO UPDATE SET
    what = excluded.what,
    place = excluded.place,
    source_time = excluded.source_time,
    measure = excluded.measure,
    current = excluded.current,
    made_cut = MAX(events.made_cut, excluded.made_cut),
    cleared_at = COALESCE(events.cleared_at, excluded.cleared_at),
    last_seen_at = excluded.last_seen_at,
    raw_json = excluded.raw_json`;

const bool = (b: boolean | null) => (b === null ? null : b ? 1 : 0);

/** Writes one source_checks row and, for an ok poll, upserts its events, in one transaction. */
export function recordPoll(db: Db, rec: PollRecord): Promise<void> {
  return withWriteLock(db, async () => {
    await db.exec('BEGIN IMMEDIATE');
    try {
      if (rec.outcome === 'ok') {
        const upsert = db.prepare(UPSERT);
        for (const e of rec.events ?? []) {
          await upsert.run(
            e.kind,
            e.sourceId,
            e.what,
            e.where,
            e.sourceTime,
            e.measure,
            bool(e.current),
            e.madeCut ? 1 : 0,
            e.madeCut ? rec.checkedAt : null,
            rec.checkedAt,
            rec.checkedAt,
            JSON.stringify(e.raw),
          );
        }
      }
      await db
        .prepare('INSERT INTO source_checks (source, checked_at, outcome, detail, ratelimit_remaining) VALUES (?, ?, ?, ?, ?)')
        .run(rec.source, rec.checkedAt, rec.outcome, rec.detail, rec.ratelimitRemaining ?? null);
      await db.exec('COMMIT');
    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }
  });
}

/** Newest first by first_seen_at, ties by source time, newest first (AC-19). */
export async function listEvents(db: Db, limit: number): Promise<EventRow[]> {
  return (await db
    .prepare('SELECT * FROM events ORDER BY first_seen_at DESC, source_time DESC, kind, source_id LIMIT ?')
    .all(limit)) as EventRow[];
}

export async function countEvents(db: Db): Promise<number> {
  const row = (await db.prepare('SELECT COUNT(*) AS n FROM events').get()) as { n: number };
  return row.n;
}

export async function latestCheck(db: Db, source: Source): Promise<CheckRow | undefined> {
  return (await db.prepare('SELECT * FROM source_checks WHERE source = ? ORDER BY id DESC LIMIT 1').get(source)) as CheckRow | undefined;
}

export async function lastSuccessAt(db: Db, source: Source): Promise<string | null> {
  const row = (await db
    .prepare("SELECT checked_at FROM source_checks WHERE source = ? AND outcome = 'ok' ORDER BY id DESC LIMIT 1")
    .get(source)) as { checked_at: string } | undefined;
  return row?.checked_at ?? null;
}

export async function countOkChecks(db: Db, source: Source): Promise<number> {
  const row = (await db.prepare("SELECT COUNT(*) AS n FROM source_checks WHERE source = ? AND outcome = 'ok'").get(source)) as { n: number };
  return row.n;
}

/** The most recently recorded Event Registry x-ratelimit-remaining, or null if none was ever recorded (AC-14). */
export async function latestRatelimitRemaining(db: Db): Promise<number | null> {
  const row = (await db
    .prepare("SELECT ratelimit_remaining FROM source_checks WHERE source = 'eventregistry' AND ratelimit_remaining IS NOT NULL ORDER BY id DESC LIMIT 1")
    .get()) as { ratelimit_remaining: number } | undefined;
  return row?.ratelimit_remaining ?? null;
}
