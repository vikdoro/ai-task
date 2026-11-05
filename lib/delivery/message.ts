// The alert message, as approved (M5 AC-11, AC-12, OQ-07). Plain text, built from the event's stored fields.

export interface MessageEvent {
  kind: string;
  what: string;
  place: string;
  /** ISO 8601 UTC for disasters and markets, YYYY-MM-DD for news. */
  source_time: string | null;
  measure?: string;
  raw_json?: string;
}

export interface Message {
  subject: string;
  /** The email body. */
  emailText: string;
  /** The subject, a blank line, then the body. */
  slackText: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function systemTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `5 Nov 2026, 14:03 CET (13:03 UTC)`: the given zone, with UTC alongside. A value that is not a time is kept as it is. */
export function formatLocalTime(iso: string, timeZone: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const d = new Date(t);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(d);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  // The month name is fixed: en-GB gives "Sept" in some ICU versions.
  const local = `${Number(part('day'))} ${MONTHS[Number(part('month')) - 1]} ${part('year')}, ${part('hour')}:${part('minute')} ${part('timeZoneName')}`;
  return `${local} (${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC)`;
}

/** `3 Nov 2026` from `2026-11-03`. A value of another shape is kept as it is. */
export function formatDay(day: string): string {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(day);
  if (!m) return day;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** The day's move in percent: Twelve Data's percent_change from the raw quote, else the stored measure. */
function percentMove(e: MessageEvent): number | null {
  try {
    const raw = JSON.parse(e.raw_json ?? '{}') as { percent_change?: unknown };
    const n = Number(raw?.percent_change);
    if (raw?.percent_change !== undefined && raw?.percent_change !== null && Number.isFinite(n)) return n;
  } catch {
    // fall through to the measure
  }
  const n = Number.parseFloat((e.measure ?? '').replace('%', ''));
  return Number.isFinite(n) ? n : null;
}

const SUBJECT_PREFIX: Record<string, string> = {
  disaster: 'Natural disaster',
  market: 'Market movement',
  news: 'Breaking news',
};

export function buildMessage(e: MessageEvent, timeZone: string = systemTimeZone()): Message {
  const subject = `${SUBJECT_PREFIX[e.kind] ?? e.kind}: ${e.what}`;
  const lines: string[] = [];
  if (e.kind === 'market') {
    const move = percentMove(e);
    lines.push(move === null ? e.what : `${e.what} ${move < 0 ? 'fell' : 'rose'} ${Math.abs(move).toFixed(1)}% today`);
  } else {
    lines.push(e.what);
  }
  if (e.place) lines.push(`Where: ${e.place}`);
  if (e.source_time) lines.push(`When: ${e.kind === 'news' ? formatDay(e.source_time) : formatLocalTime(e.source_time, timeZone)}`);
  if (e.kind === 'disaster') lines.push('', 'Source: GDACS');
  const body = lines.join('\n');
  return { subject, emailText: body, slackText: `${subject}\n\n${body}` };
}
