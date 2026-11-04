// Twelve Data: market quotes. Key in TWELVE_DATA_API_KEY. One batch call, one credit per symbol.

export const SYMBOLS = ['SPY', 'QQQ', 'EUR/USD', 'BTC/USD', 'GLD', 'USO'];
const NAME = 'twelvedata';

export async function fetchTwelveData(ctx) {
  const key = ctx.env.TWELVE_DATA_API_KEY;
  if (!key) return { source: NAME, state: 'skipped', detail: 'TWELVE_DATA_API_KEY not set' };

  await ctx.twelveDataGate();
  const url = `https://api.twelvedata.com/quote?symbol=${SYMBOLS.join(',')}&apikey=${key}`;
  const r = await ctx.get(NAME, url, { file: `${NAME}-quote.json` });
  if (!r.ok) return { source: NAME, state: 'failed', detail: r.detail };

  let body;
  try {
    body = JSON.parse(r.text);
  } catch (e) {
    return { source: NAME, state: 'failed', detail: `status ${r.status}, body is not JSON: ${e.message}` };
  }
  // Twelve Data reports request-level errors (bad key, rate limit) with HTTP 200 and status "error".
  if (body?.status === 'error') {
    return { source: NAME, state: 'failed', detail: `status ${r.status}, code ${body.code}: ${body.message}` };
  }

  const quotes = SYMBOLS.map((symbol) => {
    const q = body?.[symbol];
    if (!q) return { symbol, error: 'not in response' };
    if (q.status === 'error') return { symbol, error: `code ${q.code}: ${q.message}` };
    return {
      symbol,
      close: q.close,
      previous_close: q.previous_close,
      change: q.change,
      percent_change: q.percent_change,
      datetime: q.datetime,
      timestamp: q.timestamp,
      last_quote_at: q.last_quote_at,
      is_market_open: q.is_market_open,
    };
  });
  const okQuotes = quotes.filter((q) => !q.error);
  const times = okQuotes.map((q) => Number(q.last_quote_at ?? q.timestamp) * 1000).filter((t) => t > 0);
  return {
    source: NAME,
    state: 'ok',
    count: okQuotes.length,
    newest: times.length ? new Date(Math.max(...times)) : null,
    detail: okQuotes.length < SYMBOLS.length ? `${SYMBOLS.length - okQuotes.length} symbol(s) returned an error` : null,
    credits: { used: r.headers['api-credits-used'], left: r.headers['api-credits-left'] },
    data: { quotes },
  };
}

const show = (v) => (v === undefined || v === null || v === '' ? 'missing' : String(v));
const iso = (ts) => (ts ? new Date(Number(ts) * 1000).toISOString() : 'missing');

export function printQuotes(report, log) {
  const c = report.credits;
  log(`Twelve Data quotes (credits used this minute: ${show(c?.used)}, left: ${show(c?.left)}):`);
  for (const q of report.data.quotes) {
    if (q.error) {
      log(`  ${q.symbol.padEnd(8)} error: ${q.error}`);
      continue;
    }
    log(
      `  ${q.symbol.padEnd(8)} close ${show(q.close)} | previous_close ${show(q.previous_close)} | change ${show(q.change)} | ` +
        `percent_change ${show(q.percent_change)} | quote time ${show(q.datetime)} (timestamp ${iso(q.timestamp)}, ` +
        `last_quote_at ${iso(q.last_quote_at)}) | is_market_open ${show(q.is_market_open)}`,
    );
  }
}

export function diffQuotes(prev, cur) {
  const before = new Map(prev.data.quotes.map((q) => [q.symbol, q]));
  const lines = [];
  for (const q of cur.data.quotes) {
    const p = before.get(q.symbol);
    const fields = ['close', 'percent_change', 'timestamp', 'last_quote_at', 'is_market_open', 'error'];
    const changed = fields.filter((f) => p?.[f] !== q[f]).map((f) => `${f} ${show(p?.[f])} -> ${show(q[f])}`);
    if (changed.length) lines.push(`${q.symbol}: ${changed.join(', ')}`);
  }
  return lines;
}
