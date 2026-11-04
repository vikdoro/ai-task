import { marketMadeCut } from '../bars.ts';
import type { ParsedEvent, ParseResult, SymbolError } from './types.ts';

export const TWELVE_DATA_SYMBOLS = ['SPY', 'QQQ', 'EUR/USD', 'BTC/USD', 'GLD', 'USO'];

export function twelveDataUrl(key: string): string {
  return `https://api.twelvedata.com/quote?symbol=${TWELVE_DATA_SYMBOLS.join(',')}&apikey=${key}`;
}

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));

export function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : '-'}${Math.abs(n).toFixed(2)}%`;
}

function quoteTime(q: Record<string, unknown>): string | null {
  const ts = Number(q.last_quote_at ?? q.timestamp);
  return Number.isFinite(ts) && ts > 0 ? new Date(ts * 1000).toISOString() : null;
}

export function parseTwelveData(body: unknown): ParseResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, reason: 'no quote object in body' };
  const b = body as Record<string, unknown>;
  if (b.status === 'error') return { ok: false, reason: `code ${str(b.code)}: ${str(b.message)}` };

  const events: ParsedEvent[] = [];
  const symbolErrors: SymbolError[] = [];
  for (const symbol of TWELVE_DATA_SYMBOLS) {
    const q = b[symbol] as Record<string, unknown> | undefined;
    if (!q || typeof q !== 'object') {
      symbolErrors.push({ symbol, error: 'not in response' });
      continue;
    }
    if (q.status === 'error') {
      symbolErrors.push({ symbol, error: `code ${str(q.code)}: ${str(q.message)}` });
      continue;
    }
    const pct = Number(q.percent_change);
    const day = str(q.datetime).slice(0, 10);
    if (q.percent_change === undefined || q.percent_change === null || !Number.isFinite(pct) || !day) {
      symbolErrors.push({ symbol, error: 'no percent_change or datetime in quote' });
      continue;
    }
    events.push({
      kind: 'market',
      sourceId: `${symbol} ${day}`,
      what: `${str(q.name)} (${symbol})`,
      where: str(q.exchange),
      sourceTime: quoteTime(q),
      measure: formatPercent(pct),
      current: null,
      madeCut: marketMadeCut(symbol, pct),
      raw: q,
    });
  }
  return { ok: true, events, symbolErrors };
}
