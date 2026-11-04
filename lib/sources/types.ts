export type EventKind = 'disaster' | 'market' | 'news';

/** One event as a source reports it, before storage. */
export interface ParsedEvent {
  kind: EventKind;
  sourceId: string;
  what: string;
  where: string;
  /** ISO 8601 UTC for disasters and markets, YYYY-MM-DD for news. */
  sourceTime: string | null;
  measure: string;
  /** Disasters only; null for the other kinds. */
  current: boolean | null;
  madeCut: boolean;
  raw: unknown;
}

export interface SymbolError {
  symbol: string;
  error: string;
}

export type ParseResult = { ok: true; events: ParsedEvent[]; symbolErrors?: SymbolError[] } | { ok: false; reason: string };
