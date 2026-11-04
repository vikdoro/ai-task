import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INTERVAL_MINUTES } from '../../lib/config.ts';
import { pollSource, sourcesDueAtStartup } from '../../lib/poll.ts';
import { countEvents, listEvents, recordPoll } from '../../lib/storage/store.ts';
import { ROOT, cleanupTmp, jsonResponse, liveCtx } from '../helpers.ts';

afterEach(() => {
  vi.useRealTimers();
  cleanupTmp();
});

type Responder = (url: string, init?: RequestInit) => Response | Promise<Response>;
function seq(...responders: Responder[]) {
  const calls: string[] = [];
  let i = 0;
  const fn = (async (url: string, init?: RequestInit) => {
    calls.push(String(url));
    const r = responders[Math.min(i++, responders.length - 1)];
    return r(String(url), init);
  }) as unknown as typeof fetch;
  return { fn, calls };
}
const ok = (body: unknown, headers?: Record<string, string>): Responder => () => jsonResponse(body, { headers });
const status = (s: number): Responder => () => jsonResponse('x', { status: s });
const netError: Responder = () => {
  throw new TypeError('fetch failed');
};
const hang: Responder = (_url, init) =>
  new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason ?? new Error('aborted'))));

const gdacsBody = (alertlevel: string, iscurrent: string) => ({
  features: [{ type: 'Feature', properties: { eventtype: 'FL', eventid: 1, name: 'F', country: 'X', fromdate: '2026-11-01T00:00:00', alertlevel, iscurrent } }],
});
const tdBody = (pc: string) => ({ SPY: { symbol: 'SPY', name: 'S', exchange: 'NYSE', datetime: '2026-11-04', last_quote_at: 1793817300, percent_change: pc } });
const erBody = (n: number) => ({ events: { results: [{ uri: 'eng-1', title: { eng: 'T' }, eventDate: '2026-11-04', totalArticleCount: n, location: null }] } });

describe('AC-10 making the cut is permanent, per kind', () => {
  async function run(source: 'gdacs' | 'twelvedata' | 'eventregistry', bodies: unknown[]) {
    const { fn } = seq(...bodies.map((b) => ok(b)));
    let t = 0;
    const times = ['2026-11-04T10:00:00.000Z', '2026-11-04T10:10:00.000Z', '2026-11-04T10:20:00.000Z'];
    const ctx = await liveCtx({ fetch: fn, now: () => new Date(times[t]) });
    const rows = [];
    for (let k = 0; k < bodies.length; k++) {
      t = k;
      expect((await pollSource(source, ctx)).outcome).toBe('ok');
      rows.push((await listEvents(ctx.db, 200))[0]);
    }
    return rows;
  }

  it('AC-10 a market move falling back under its threshold stays cleared', async () => {
    const rows = await run('twelvedata', [tdBody('1.0'), tdBody('3.5'), tdBody('1.0')]);
    expect(rows.map((r) => [r.made_cut, r.cleared_at])).toEqual([
      [0, null],
      [1, '2026-11-04T10:10:00.000Z'],
      [1, '2026-11-04T10:10:00.000Z'],
    ]);
  });

  it('AC-10 a news count dropping below 1,000 stays cleared', async () => {
    const rows = await run('eventregistry', [erBody(1500), erBody(800)]);
    expect(rows.map((r) => [r.made_cut, r.cleared_at])).toEqual([
      [1, '2026-11-04T10:00:00.000Z'],
      [1, '2026-11-04T10:00:00.000Z'],
    ]);
  });

  it('AC-10 a GDACS item no longer current or at a lower level stays cleared', async () => {
    const rows = await run('gdacs', [gdacsBody('Red', 'true'), gdacsBody('Orange', 'true'), gdacsBody('Red', 'false')]);
    expect(rows.map((r) => [r.made_cut, r.cleared_at, r.current])).toEqual([
      [1, '2026-11-04T10:00:00.000Z', 1],
      [1, '2026-11-04T10:00:00.000Z', 1],
      [1, '2026-11-04T10:00:00.000Z', 0],
    ]);
  });
});

describe('AC-11 polling schedule', () => {
  it('AC-11 nuxt.config.ts defines the three schedules with tasks on', () => {
    const cfg = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8');
    expect(cfg).toMatch(/tasks:\s*true/);
    expect(cfg).toMatch(/'\*\/10 \* \* \* \*':\s*\['poll:gdacs'\]/);
    expect(cfg).toMatch(/'\*\/15 \* \* \* \*':\s*\['poll:twelvedata'\]/);
    expect(cfg).toMatch(/'0 \* \* \* \*':\s*\['poll:eventregistry'\]/);
    expect(INTERVAL_MINUTES).toEqual({ gdacs: 10, twelvedata: 15, eventregistry: 60 });
  });

  it('AC-11 each Nitro task calls pollSource for its source', () => {
    for (const s of ['gdacs', 'twelvedata', 'eventregistry']) {
      const src = readFileSync(join(ROOT, `server/tasks/poll/${s}.ts`), 'utf8');
      expect(src).toContain(`pollSource('${s}'`);
    }
  });

  it('AC-11 at start, a source is due if never checked or its last check is older than its interval', async () => {
    const ctx = await liveCtx({ fetch: seq(ok({})).fn });
    const now = new Date('2026-11-04T12:00:00.000Z');
    expect(await sourcesDueAtStartup(ctx.db, now)).toEqual(['gdacs', 'twelvedata', 'eventregistry']);
    await recordPoll(ctx.db, { source: 'gdacs', checkedAt: '2026-11-04T11:55:00.000Z', outcome: 'failed', detail: 'x' });
    await recordPoll(ctx.db, { source: 'twelvedata', checkedAt: '2026-11-04T11:44:59.000Z', outcome: 'ok', detail: 'x' });
    await recordPoll(ctx.db, { source: 'eventregistry', checkedAt: '2026-11-04T11:30:00.000Z', outcome: 'ok', detail: 'x' });
    expect(await sourcesDueAtStartup(ctx.db, now)).toEqual(['twelvedata']);
  });

  it('AC-11 a poll of a source never overlaps another poll of the same source', async () => {
    let active = 0;
    let maxActive = 0;
    const fn = (async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 20));
      active--;
      return jsonResponse(gdacsBody('Red', 'true'));
    }) as unknown as typeof fetch;
    const ctx = await liveCtx({ fetch: fn });
    const results = await Promise.all([pollSource('gdacs', ctx), pollSource('gdacs', ctx), pollSource('gdacs', ctx)]);
    expect(results.map((r) => r.outcome)).toEqual(['ok', 'ok', 'ok']);
    expect(maxActive).toBe(1);
    const checks = await ctx.db.prepare('SELECT COUNT(*) AS n FROM source_checks').get();
    expect((checks as { n: number }).n).toBe(3);
  });
});

describe('AC-12 one check row per call', () => {
  async function checksOf(ctx: Awaited<ReturnType<typeof liveCtx>>) {
    return (await ctx.db.prepare('SELECT source, outcome, detail FROM source_checks ORDER BY id').all()) as { source: string; outcome: string; detail: string }[];
  }

  it('AC-12 ok records the item count', async () => {
    const ctx = await liveCtx({ fetch: seq(ok(gdacsBody('Red', 'true'))).fn });
    const r = await pollSource('gdacs', ctx);
    expect(r).toMatchObject({ source: 'gdacs', outcome: 'ok', detail: '1 items, 1 made the cut' });
    expect(await checksOf(ctx)).toEqual([{ source: 'gdacs', outcome: 'ok', detail: '1 items, 1 made the cut' }]);
  });

  const failures: [string, 'gdacs' | 'twelvedata' | 'eventregistry', Responder, RegExp][] = [
    ['non-2xx status', 'gdacs', status(404), /HTTP 404/],
    ['body not JSON', 'gdacs', () => new Response('<html>', { status: 200 }), /not JSON/],
    ['body without the list', 'gdacs', ok({ type: 'FeatureCollection' }), /features/],
    ['Twelve Data status error with HTTP 200', 'twelvedata', ok({ status: 'error', code: 401, message: 'bad key' }), /code 401: bad key/],
    ['Event Registry error field', 'eventregistry', ok({ error: 'invalid key' }), /invalid key/],
    ['Event Registry without results', 'eventregistry', ok({ events: {} }), /events\.results/],
    ['Event Registry network error', 'eventregistry', netError, /network error/],
  ];
  it.each(failures)('AC-12 failed: %s', async (_name, source, responder, reason) => {
    const ctx = await liveCtx({ fetch: seq(responder).fn });
    await recordPoll(ctx.db, { source, checkedAt: '2026-11-04T09:00:00.000Z', outcome: 'ok', detail: 'seed' });
    const before = await countEvents(ctx.db);
    const r = await pollSource(source, ctx);
    expect(r.outcome).toBe('failed');
    expect(r.detail).toMatch(reason);
    const rows = await checksOf(ctx);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ source, outcome: 'failed' });
    expect(await countEvents(ctx.db)).toBe(before);
  });

  it('AC-12 a failed poll changes no event row', async () => {
    const ctx = await liveCtx({ fetch: seq(ok(erBody(500)), ok({ error: 'x' })).fn });
    await pollSource('eventregistry', ctx);
    const before = await listEvents(ctx.db, 200);
    await pollSource('eventregistry', ctx);
    expect(await listEvents(ctx.db, 200)).toEqual(before);
  });

  it('AC-12 not configured in live mode when the key is missing, with no request', async () => {
    const { fn, calls } = seq(ok({}));
    const ctx = await liveCtx({ fetch: fn, env: {} });
    expect((await pollSource('twelvedata', ctx)).outcome).toBe('not configured');
    expect((await pollSource('eventregistry', ctx)).outcome).toBe('not configured');
    expect(calls).toHaveLength(0);
    expect((await checksOf(ctx)).map((c) => c.outcome)).toEqual(['not configured', 'not configured']);
  });

  it('AC-12 a failure reason never contains the API key', async () => {
    const fn = (async (url: string) => {
      throw new TypeError(`fetch failed for ${url}`);
    }) as unknown as typeof fetch;
    vi.useFakeTimers();
    const ctx = await liveCtx({ fetch: fn });
    const p = pollSource('twelvedata', ctx);
    await vi.advanceTimersByTimeAsync(10_000);
    const r = await p;
    expect(r.outcome).toBe('failed');
    expect(r.detail).not.toContain('td-fake-key');
  });
});

describe('AC-13 retries', () => {
  beforeEach(() => vi.useFakeTimers());

  it.each(['gdacs', 'twelvedata'] as const)('AC-13 %s retries once 5 s after a network error, then succeeds', async (source) => {
    const body = source === 'gdacs' ? gdacsBody('Red', 'true') : tdBody('1.0');
    const { fn, calls } = seq(netError, ok(body));
    const ctx = await liveCtx({ fetch: fn });
    const p = pollSource(source, ctx);
    await vi.advanceTimersByTimeAsync(4_999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    const r = await p;
    expect(calls).toHaveLength(2);
    expect(r.outcome).toBe('ok');
  });

  it.each(['gdacs', 'twelvedata'] as const)('AC-13 %s retries once after a 5xx, then records failed', async (source) => {
    const { fn, calls } = seq(status(502));
    const ctx = await liveCtx({ fetch: fn });
    const p = pollSource(source, ctx);
    await vi.advanceTimersByTimeAsync(10_000);
    const r = await p;
    expect(calls).toHaveLength(2);
    expect(r).toMatchObject({ outcome: 'failed' });
    expect(r.detail).toMatch(/HTTP 502/);
  });

  it.each(['gdacs', 'twelvedata'] as const)('AC-13 %s times out after 30 s and retries once', async (source) => {
    const { fn, calls } = seq(hang);
    const ctx = await liveCtx({ fetch: fn });
    const p = pollSource(source, ctx);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1 + 5_000);
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(30_000);
    const r = await p;
    expect(r.outcome).toBe('failed');
    expect(r.detail).toMatch(/timeout after 30 s/);
  });

  it.each(['gdacs', 'twelvedata'] as const)('AC-13 %s does not retry a 4xx or a bad body', async (source) => {
    const { fn, calls } = seq(status(429));
    const ctx = await liveCtx({ fetch: fn });
    const p = pollSource(source, ctx);
    await vi.advanceTimersByTimeAsync(10_000);
    expect((await p).outcome).toBe('failed');
    expect(calls).toHaveLength(1);
    const b = seq(() => new Response('nope', { status: 200 }));
    const ctx2 = await liveCtx({ fetch: b.fn });
    const p2 = pollSource(source, ctx2);
    await vi.advanceTimersByTimeAsync(10_000);
    expect((await p2).outcome).toBe('failed');
    expect(b.calls).toHaveLength(1);
  });

  it('AC-13 Event Registry times out after 60 s and never retries', async () => {
    const { fn, calls } = seq(hang);
    const ctx = await liveCtx({ fetch: fn });
    const p = pollSource('eventregistry', ctx);
    await vi.advanceTimersByTimeAsync(59_999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(10_000);
    const r = await p;
    expect(r.outcome).toBe('failed');
    expect(r.detail).toMatch(/timeout after 60 s/);
    expect(calls).toHaveLength(1);
  });
});
