// What counts as important enough (DEC-27, DEC-29, DEC-30).

/** A disaster makes the cut if current and, on its overall alertlevel, Red, or Orange for EQ and TC (AC-5). */
export function disasterMadeCut(item: { current: boolean; alertlevel: string; eventtype: string }): boolean {
  if (!item.current) return false;
  if (item.alertlevel === 'Red') return true;
  return item.alertlevel === 'Orange' && (item.eventtype === 'EQ' || item.eventtype === 'TC');
}

/** Absolute daily move, in percent, that an instrument must be strictly over (AC-7). */
export const MARKET_THRESHOLDS: Record<string, number> = {
  SPY: 3,
  QQQ: 3,
  'EUR/USD': 1.2,
  'BTC/USD': 8,
  GLD: 3,
  USO: 6,
};

export function marketMadeCut(symbol: string, percentChange: number): boolean {
  const threshold = MARKET_THRESHOLDS[symbol];
  if (threshold === undefined || !Number.isFinite(percentChange)) return false;
  return Math.abs(percentChange) > threshold;
}

/** A news event makes the cut at 1,000 articles or more (AC-9). */
export const NEWS_MIN_ARTICLES = 1000;

export function newsMadeCut(totalArticleCount: number): boolean {
  return totalArticleCount >= NEWS_MIN_ARTICLES;
}
