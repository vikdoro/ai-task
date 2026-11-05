// pollSource: one check of one source, from the samples or live, written as exactly one source_checks row.
import { INTERVAL_MINUTES, SOURCES, TIMEOUT_SECONDS, type DeliveryMode, type Mode, type Source } from './config.ts';
import { withDbLock } from './delivery/lock.ts';
import { matchAlerts, type MatchResult } from './delivery/match.ts';
import { request, transportFailure, type Attempt } from './http.ts';
import { parseRatelimit, readReplay } from './replay.ts';
import { GDACS_URL, parseGdacs } from './sources/gdacs.ts';
import { parseTwelveData, twelveDataUrl } from './sources/twelvedata.ts';
import { EVENT_REGISTRY_URL, buildEventRegistryBody, parseEventRegistry } from './sources/eventregistry.ts';
import type { ParseResult, ParsedEvent } from './sources/types.ts';
import type { Db } from './storage/db.ts';
import { countOkChecks, latestCheck, latestRatelimitRemaining, recordPoll, type Outcome } from './storage/store.ts';

export interface PollContext {
  db: Db;
  mode: Mode;
  samplesDir: string;
  env: Record<string, string | undefined>;
  /** How alerts are sent after the poll (M5 AC-14). Fake when not given. */
  deliveryMode?: DeliveryMode;
  fetch?: typeof fetch;
  now?: () => Date;
}

export interface PollResult {
  source: Source;
  outcome: Outcome;
  detail: string;
  /** The events matched after this poll (M5 AC-1). */
  alerts?: MatchResult;
}

/** Below this many Event Registry tokens, no live request is made (AC-14). */
export const TOKEN_FLOOR = 200;

const KEY_NAME: Partial<Record<Source, string>> = {
  twelvedata: 'TWELVE_DATA_API_KEY',
  eventregistry: 'EVENT_REGISTRY_API_KEY',
};

const PARSERS: Record<Source, (body: unknown) => ParseResult> = {
  gdacs: parseGdacs,
  twelvedata: parseTwelveData,
  eventregistry: parseEventRegistry,
};

// Polls of the same source on the same database run one after another, never at the same time.
const queues = new WeakMap<Db, Map<Source, Promise<unknown>>>();

export function pollSource(source: Source, ctx: PollContext): Promise<PollResult> {
  let perDb = queues.get(ctx.db);
  if (!perDb) queues.set(ctx.db, (perDb = new Map()));
  const prev = perDb.get(source) ?? Promise.resolve();
  const next = prev.catch(() => {}).then(() => pollNow(source, ctx));
  perDb.set(source, next);
  return next;
}

type Fetched = { ok: true; body: unknown; ratelimitRemaining: number | null } | { ok: false; outcome: Outcome; detail: string; ratelimitRemaining: number | null };

async function pollNow(source: Source, ctx: PollContext): Promise<PollResult> {
  const checkedAt = (ctx.now?.() ?? new Date()).toISOString();
  const fetched = ctx.mode === 'live' ? await fetchLive(source, ctx, new Date(checkedAt)) : await fetchSamples(source, ctx);

  let outcome: Outcome;
  let detail: string;
  let events: ParsedEvent[] | undefined;
  if (!fetched.ok) {
    outcome = fetched.outcome;
    detail = fetched.detail;
  } else {
    const parsed = PARSERS[source](fetched.body);
    if (!parsed.ok) {
      outcome = 'failed';
      detail = parsed.reason;
    } else {
      outcome = 'ok';
      events = parsed.events;
      const cut = parsed.events.filter((e) => e.madeCut).length;
      detail = `${parsed.events.length} items, ${cut} made the cut`;
      for (const s of parsed.symbolErrors ?? []) detail += `. ${s.symbol}: ${s.error}`;
    }
  }
  detail = redact(detail, ctx.env);
  await withDbLock(ctx.db, () => recordPoll(ctx.db, { source, checkedAt, outcome, detail, ratelimitRemaining: fetched.ratelimitRemaining, events }));
  return { source, outcome, detail, alerts: await matchAfterPoll(ctx) };
}

/** M5 AC-1: after every recorded check, whatever its outcome. A matching error is logged and never changes the poll's result. */
async function matchAfterPoll(ctx: PollContext): Promise<MatchResult> {
  try {
    return await matchAlerts({ db: ctx.db, mode: ctx.deliveryMode ?? 'fake', env: ctx.env, fetch: ctx.fetch, now: ctx.now });
  } catch (err) {
    console.error('[alerts] matching failed:', err instanceof Error ? err.message : err);
    return { fired: [] };
  }
}

function redact(text: string, env: Record<string, string | undefined>): string {
  let out = text;
  for (const name of Object.values(KEY_NAME)) {
    const v = name ? env[name] : undefined;
    if (v) out = out.split(v).join(`<${name}>`);
  }
  return out;
}

function parseJson(text: string): { ok: true; body: unknown } | { ok: false } {
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

async function fetchSamples(source: Source, ctx: PollContext): Promise<Fetched> {
  const n = (await countOkChecks(ctx.db, source)) + 1;
  const read = readReplay(ctx.samplesDir, source, n);
  if (!read.ok) return { ok: false, outcome: 'failed', detail: read.reason, ratelimitRemaining: null };
  const json = parseJson(read.text);
  if (!json.ok) return { ok: false, outcome: 'failed', detail: 'body is not JSON', ratelimitRemaining: read.ratelimitRemaining };
  return { ok: true, body: json.body, ratelimitRemaining: read.ratelimitRemaining };
}

const USER_AGENT = 'ai-task/0.1 (local demo)';

async function fetchLive(source: Source, ctx: PollContext, now: Date): Promise<Fetched> {
  const fetchImpl = ctx.fetch ?? globalThis.fetch;
  const keyName = KEY_NAME[source];
  const key = keyName ? ctx.env[keyName] : undefined;
  if (keyName && !key) return { ok: false, outcome: 'not configured', detail: `${keyName} not set`, ratelimitRemaining: null };

  let a: Attempt;
  if (source === 'gdacs') {
    a = await request(fetchImpl, GDACS_URL, { method: 'GET', headers: { 'user-agent': USER_AGENT } }, TIMEOUT_SECONDS.gdacs, true);
  } else if (source === 'twelvedata') {
    a = await request(fetchImpl, twelveDataUrl(key!), { method: 'GET', headers: { 'user-agent': USER_AGENT } }, TIMEOUT_SECONDS.twelvedata, true);
  } else {
    const remaining = await latestRatelimitRemaining(ctx.db);
    if (remaining !== null && remaining < TOKEN_FLOOR) return { ok: false, outcome: 'paused', detail: 'token floor reached', ratelimitRemaining: null };
    a = await request(
      fetchImpl,
      EVENT_REGISTRY_URL,
      { method: 'POST', headers: { 'user-agent': USER_AGENT, 'content-type': 'application/json' }, body: JSON.stringify(buildEventRegistryBody(key!, now)) },
      TIMEOUT_SECONDS.eventregistry,
      false,
    );
  }

  const ratelimitRemaining = source === 'eventregistry' && a.kind === 'response' ? parseRatelimit(a.headers.get('x-ratelimit-remaining')) : null;
  const failure = transportFailure(a);
  if (failure || a.kind !== 'response') return { ok: false, outcome: 'failed', detail: failure ?? 'no response', ratelimitRemaining };
  const json = parseJson(a.text);
  if (!json.ok) return { ok: false, outcome: 'failed', detail: `HTTP ${a.status}, body is not JSON`, ratelimitRemaining };
  return { ok: true, body: json.body, ratelimitRemaining };
}

/** The sources to poll at server start: never checked, or last checked at least one interval ago (AC-11). */
export async function sourcesDueAtStartup(db: Db, now: Date): Promise<Source[]> {
  const due: Source[] = [];
  for (const source of SOURCES) {
    const last = await latestCheck(db, source);
    if (!last || now.getTime() - Date.parse(last.checked_at) >= INTERVAL_MINUTES[source] * 60_000) due.push(source);
  }
  return due;
}

export function formatPollLine(r: PollResult): string {
  return `${r.source} ${r.outcome} ${r.detail}`;
}
