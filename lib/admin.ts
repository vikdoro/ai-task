// The read-only data behind /admin. Only display fields leave here; raw JSON stays in the database.
import { SOURCES } from './config.ts';
import { listFired, countFired } from './delivery/store.ts';
import { KIND_LABELS, alertLabel, deliveryLabel, formatUtc, statusLine } from './format.ts';
import type { Db } from './storage/db.ts';
import { countEvents, lastSuccessAt, latestCheck, listEvents } from './storage/store.ts';

export const ADMIN_ROW_LIMIT = 200;

export interface AdminRow {
  received: string;
  kind: string;
  what: string;
  where: string;
  sourceTime: string;
  measure: string;
  current: string;
  clearedBar: string;
  sourceId: string;
}

export interface AdminEvents {
  total: number;
  shown: number;
  countLine: string;
  rows: AdminRow[];
}

/** One row of Alerts fired (M5 AC-18). No message text and no contact value. */
export interface AdminAlertRow {
  clearedAt: string;
  kind: string;
  what: string;
  alert: string;
  email: string;
  slack: string;
  sourceId: string;
}

export interface AdminAlerts {
  total: number;
  shown: number;
  countLine: string;
  rows: AdminAlertRow[];
}

export interface AdminSources {
  lines: string[];
  /** How many sources have been checked at least once. */
  checked: number;
}

export async function getAdminSources(db: Db): Promise<AdminSources> {
  const lines: string[] = [];
  let checked = 0;
  for (const source of SOURCES) {
    const latest = await latestCheck(db, source);
    if (latest) checked++;
    lines.push(statusLine(source, latest, latest ? await lastSuccessAt(db, source) : null));
  }
  return { lines, checked };
}

export async function getAdminEvents(db: Db): Promise<AdminEvents> {
  const [total, rows] = [await countEvents(db), await listEvents(db, ADMIN_ROW_LIMIT)];
  return {
    total,
    shown: rows.length,
    countLine: `Showing ${rows.length} of ${total} events, newest first.`,
    rows: rows.map((r) => ({
      received: formatUtc(r.first_seen_at),
      kind: KIND_LABELS[r.kind] ?? r.kind,
      what: r.what,
      where: r.place,
      sourceTime: formatUtc(r.source_time),
      measure: r.measure,
      current: r.current === null ? '' : r.current ? 'Yes' : 'No',
      clearedBar: r.made_cut ? 'Yes' : 'No',
      sourceId: r.source_id,
    })),
  };
}

export async function getAdminAlerts(db: Db): Promise<AdminAlerts> {
  const [total, rows] = [await countFired(db), await listFired(db, ADMIN_ROW_LIMIT)];
  const delivery = (outcome: string | null, detail: string | null) => (outcome ? { outcome: outcome as 'sending' | 'delivered' | 'failed', detail: detail ?? '' } : null);
  return {
    total,
    shown: rows.length,
    countLine: total === 0 ? 'No alerts fired yet.' : `Showing ${rows.length} of ${total} alerts fired, newest first.`,
    rows: rows.map((r) => ({
      clearedAt: formatUtc(r.cleared_at),
      kind: KIND_LABELS[r.kind] ?? r.kind,
      what: r.what,
      alert: alertLabel(r.sent === 1, r.reason),
      email: deliveryLabel('email', r.sent === 1, delivery(r.email_outcome, r.email_detail)),
      slack: deliveryLabel('slack', r.sent === 1, delivery(r.slack_outcome, r.slack_detail)),
      sourceId: r.source_id,
    })),
  };
}
