import { afterEach, describe, expect, it } from 'vitest';
import { marketMadeCut } from '../../lib/bars.ts';
import { TWELVE_DATA_SYMBOLS, parseTwelveData, twelveDataUrl } from '../../lib/sources/twelvedata.ts';
import { pollSource } from '../../lib/poll.ts';
import { latestCheck, listEvents } from '../../lib/storage/store.ts';
import { cleanupTmp, jsonResponse, liveCtx } from '../helpers.ts';

afterEach(cleanupTmp);

const q = (symbol: string, percent_change: string, datetime = '2026-11-04', extra: Record<string, unknown> = {}) => ({
  symbol,
  name: `${symbol} name`,
  exchange: 'NYSE',
  datetime,
  last_quote_at: 1793817300,
  percent_change,
  ...extra,
});

describe('AC-6 Twelve Data parsing', () => {
  it('AC-6 the batch request asks for the six symbols', () => {
    expect(TWELVE_DATA_SYMBOLS.join(',')).toBe('SPY,QQQ,EUR/USD,BTC/USD,GLD,USO');
    expect(twelveDataUrl('k')).toBe('https://api.twelvedata.com/quote?symbol=SPY,QQQ,EUR/USD,BTC/USD,GLD,USO&apikey=k');
  });

  it('AC-6 each symbol is one instrument-day with its fields', () => {
    const r = parseTwelveData({ SPY: q('SPY', '3.71234'), USO: q('USO', '-0.5') });
    if (!r.ok) throw new Error(r.reason);
    const spy = r.events.find((e) => e.sourceId === 'SPY 2026-11-04');
    expect(spy).toMatchObject({
      kind: 'market',
      what: 'SPY name (SPY)',
      where: 'NYSE',
      sourceTime: new Date(1793817300 * 1000).toISOString(),
      measure: '+3.71%',
      current: null,
      madeCut: true,
    });
    const uso = r.events.find((e) => e.sourceId === 'USO 2026-11-04');
    expect(uso).toMatchObject({ measure: '-0.50%', madeCut: false });
  });

  it('AC-6 a symbol with status error or missing creates no row and is listed as a symbol error', () => {
    const r = parseTwelveData({ SPY: q('SPY', '1.0'), GLD: { status: 'error', code: 404, message: 'symbol not found' } });
    if (!r.ok) throw new Error(r.reason);
    expect(r.events.map((e) => e.sourceId)).toEqual(['SPY 2026-11-04']);
    expect(r.symbolErrors).toEqual([
      { symbol: 'QQQ', error: 'not in response' },
      { symbol: 'EUR/USD', error: 'not in response' },
      { symbol: 'BTC/USD', error: 'not in response' },
      { symbol: 'GLD', error: 'code 404: symbol not found' },
      { symbol: 'USO', error: 'not in response' },
    ]);
  });

  it('AC-6 a top-level status error is a failure', () => {
    const r = parseTwelveData({ status: 'error', code: 401, message: 'bad key' });
    expect(r.ok).toBe(false);
  });

  it('AC-6 a later poll on the same day updates the row, a new trading day adds a row; symbol errors still count as ok', async () => {
    const bodies = [
      { SPY: q('SPY', '1.0', '2026-11-04'), GLD: { status: 'error', code: 404, message: 'symbol not found' } },
      { SPY: q('SPY', '2.0', '2026-11-04') },
      { SPY: q('SPY', '0.5', '2026-11-05') },
    ];
    let i = 0;
    const calls: string[] = [];
    const ctx = await liveCtx({
      fetch: (async (url: string) => {
        calls.push(String(url));
        return jsonResponse(bodies[i++]);
      }) as unknown as typeof fetch,
    });
    const first = await pollSource('twelvedata', ctx);
    expect(first.outcome).toBe('ok');
    expect(first.detail).toContain('GLD: code 404: symbol not found');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('symbol=SPY,QQQ,EUR/USD,BTC/USD,GLD,USO');
    await pollSource('twelvedata', ctx);
    let rows = await listEvents(ctx.db, 200);
    expect(rows).toHaveLength(1);
    expect(rows[0].measure).toBe('+2.00%');
    await pollSource('twelvedata', ctx);
    rows = await listEvents(ctx.db, 200);
    expect(rows.map((r) => r.source_id).sort()).toEqual(['SPY 2026-11-04', 'SPY 2026-11-05']);
    expect((await latestCheck(ctx.db, 'twelvedata'))?.outcome).toBe('ok');
  });
});

describe('AC-7 market bar', () => {
  const cases: [string, number, boolean][] = [
    ['SPY', 3.0, false],
    ['SPY', -3.01, true],
    ['SPY', 3.01, true],
    ['QQQ', 3.0, false],
    ['QQQ', -3.01, true],
    ['EUR/USD', 1.2, false],
    ['EUR/USD', -1.21, true],
    ['BTC/USD', 8.0, false],
    ['BTC/USD', 8.01, true],
    ['GLD', -3.0, false],
    ['GLD', 3.01, true],
    ['USO', 6.0, false],
    ['USO', -6.01, true],
  ];
  it.each(cases)('AC-7 %s %d', (symbol, move, expected) => {
    expect(marketMadeCut(symbol, move)).toBe(expected);
  });

  it('AC-7 the bar reads the string percent_change exactly ("3.00" is not over 3)', () => {
    const r = parseTwelveData({ SPY: q('SPY', '3.00'), 'EUR/USD': q('EUR/USD', '1.20'), 'BTC/USD': q('BTC/USD', '8.01') });
    if (!r.ok) throw new Error(r.reason);
    const cut = Object.fromEntries(r.events.map((e) => [e.sourceId.split(' ')[0], e.madeCut]));
    expect(cut).toEqual({ SPY: false, 'EUR/USD': false, 'BTC/USD': true });
  });
});
