// Storage of the alerts_fired and deliveries tables (M5 AC-4, AC-5, AC-7).
// Neither table holds the message text or a contact value.
import type { Db } from '../storage/db.ts';
import type { EventRow } from '../storage/store.ts';
import { withDbLock } from './lock.ts';

export type Channel = 'email' | 'slack';
export const CHANNELS: readonly Channel[] = ['email', 'slack'];

export type NotSentReason = 'no alert set up' | 'made the cut before the alert was set up' | 'no channels picked';
export type DeliveryOutcome = 'sending' | 'delivered' | 'failed';

export const FAKE_DETAIL = 'fake: not sent';
export const INTERRUPTED_DETAIL = 'interrupted, outcome unknown';

export interface Decision {
  sent: boolean;
  /** Empty when sent. */
  reason: NotSentReason | '';
  channels: Channel[];
}

export interface Claim extends Decision {
  event: EventRow;
}

// The node:sqlite handle behind db0, used for the one transaction that must not yield (see claimUnmatched).
interface SyncDb {
  exec(sql: string): void;
  prepare(sql: string): { all(...params: unknown[]): unknown[]; run(...params: unknown[]): unknown };
}

const UNMATCHED = `SELECT * FROM events e
  WHERE e.made_cut = 1 AND NOT EXISTS (SELECT 1 FROM alerts_fired f WHERE f.kind = e.kind AND f.source_id = e.source_id)
  ORDER BY e.cleared_at, e.source_time, e.kind, e.source_id`;

/**
 * In one write transaction, gives every made-cut event with no alerts_fired row its row, and each channel of a
 * sent event a 'sending' deliveries row. Only the caller that wrote a row sends it (AC-5).
 * The transaction runs synchronously: BEGIN IMMEDIATE takes SQLite's write lock, so another process (or another
 * connection) waits and then finds nothing left; and nothing else in this process can run in between.
 */
export function claimUnmatched(db: Db, decide: (event: EventRow) => Decision, at: string): Promise<Claim[]> {
  return withDbLock(db, () => {
    const sql = db.getInstance() as unknown as SyncDb;
    sql.exec('BEGIN IMMEDIATE');
    try {
      const claims: Claim[] = [];
      const fire = sql.prepare('INSERT INTO alerts_fired (kind, source_id, matched_at, sent, reason) VALUES (?, ?, ?, ?, ?)');
      const deliver = sql.prepare("INSERT INTO deliveries (kind, source_id, channel, outcome, detail, started_at) VALUES (?, ?, ?, 'sending', '', ?)");
      for (const event of sql.prepare(UNMATCHED).all() as EventRow[]) {
        const d = decide(event);
        fire.run(event.kind, event.source_id, at, d.sent ? 1 : 0, d.reason);
        for (const channel of d.channels) deliver.run(event.kind, event.source_id, channel, at);
        claims.push({ event, ...d });
      }
      sql.exec('COMMIT');
      return claims;
    } catch (err) {
      sql.exec('ROLLBACK');
      throw err;
    }
  });
}

/** The final outcome of one send. It overwrites whatever is there, including an interrupted sweep (AC-7). */
export function finishDelivery(db: Db, kind: string, sourceId: string, channel: Channel, outcome: 'delivered' | 'failed', detail: string, emailId: string | null, at: string): Promise<void> {
  return withDbLock(db, async () => {
    await db
      .prepare('UPDATE deliveries SET outcome = ?, detail = ?, email_id = ?, finished_at = ? WHERE kind = ? AND source_id = ? AND channel = ?')
      .run(outcome, detail, emailId, at, kind, sourceId, channel);
  });
}

/** Every delivery still 'sending' becomes failed: interrupted, outcome unknown (AC-7). It is never sent again. */
export function sweepInterrupted(db: Db, now: Date = new Date()): Promise<void> {
  return withDbLock(db, async () => {
    await db
      .prepare("UPDATE deliveries SET outcome = 'failed', detail = ?, finished_at = ? WHERE outcome = 'sending'")
      .run(INTERRUPTED_DETAIL, now.toISOString());
  });
}

export interface FiredRow {
  kind: string;
  source_id: string;
  what: string;
  cleared_at: string | null;
  source_time: string | null;
  sent: 0 | 1;
  reason: string;
  email_outcome: DeliveryOutcome | null;
  email_detail: string | null;
  slack_outcome: DeliveryOutcome | null;
  slack_detail: string | null;
}

/** Newest first by cleared_at, then by source time (AC-18). */
export async function listFired(db: Db, limit: number): Promise<FiredRow[]> {
  return (await db
    .prepare(
      `SELECT f.kind, f.source_id, e.what, e.cleared_at, e.source_time, f.sent, f.reason,
        de.outcome AS email_outcome, de.detail AS email_detail, ds.outcome AS slack_outcome, ds.detail AS slack_detail
      FROM alerts_fired f
      JOIN events e ON e.kind = f.kind AND e.source_id = f.source_id
      LEFT JOIN deliveries de ON de.kind = f.kind AND de.source_id = f.source_id AND de.channel = 'email'
      LEFT JOIN deliveries ds ON ds.kind = f.kind AND ds.source_id = f.source_id AND ds.channel = 'slack'
      ORDER BY e.cleared_at DESC, e.source_time DESC, f.kind, f.source_id
      LIMIT ?`,
    )
    .all(limit)) as FiredRow[];
}

export async function countFired(db: Db): Promise<number> {
  const row = (await db.prepare('SELECT COUNT(*) AS n FROM alerts_fired').get()) as { n: number };
  return row.n;
}
