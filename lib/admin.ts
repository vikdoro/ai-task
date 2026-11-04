// The read-only data behind /admin. Only display fields leave here; raw JSON stays in the database.
import { SOURCES } from './config.ts';
import { KIND_LABELS, formatUtc, statusLine } from './format.ts';
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
