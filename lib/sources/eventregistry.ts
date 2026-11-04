import { newsMadeCut } from '../bars.ts';
import type { ParsedEvent, ParseResult } from './types.ts';

export const EVENT_REGISTRY_URL = 'https://eventregistry.org/api/v1/event';

const day = (d: Date) => d.toISOString().slice(0, 10);

/** The same body as the M1 spike: English events from the previous UTC day to today, top 50 by size. */
export function buildEventRegistryBody(key: string, now: Date) {
  return {
    action: 'getEvents',
    lang: 'eng',
    dateStart: day(new Date(now.getTime() - 24 * 3600 * 1000)),
    dateEnd: day(now),
    resultType: ['events'],
    eventsPage: 1,
    eventsCount: 50,
    eventsSortBy: 'size',
    eventsSortByAsc: false,
    includeEventTitle: true,
    includeEventDate: true,
    includeEventLocation: true,
    includeEventCategories: true,
    includeEventArticleCounts: true,
    includeEventSummary: false,
    includeEventConcepts: false,
    forceMaxDataTimeWindow: 31,
    apiKey: key,
  };
}

/** A multilingual label: English if there is one, otherwise the first. */
function label(x: unknown): string {
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    const v = o.eng ?? Object.values(o)[0];
    return v === undefined || v === null ? '' : String(v);
  }
  return x === undefined || x === null ? '' : String(x);
}

function place(loc: unknown): string {
  if (!loc || typeof loc !== 'object') return '';
  const l = loc as { type?: string; label?: unknown; country?: { label?: unknown } };
  const parts = [label(l.label)];
  if (l.type !== 'country') parts.push(label(l.country?.label));
  return parts.filter(Boolean).join(', ');
}

export function parseEventRegistry(body: unknown): ParseResult {
  const b = body as { error?: unknown; events?: { results?: unknown } } | null;
  if (b && typeof b === 'object' && b.error !== undefined && b.error !== null) {
    return { ok: false, reason: `error: ${typeof b.error === 'string' ? b.error : JSON.stringify(b.error)}`.slice(0, 300) };
  }
  const results = b?.events?.results;
  if (!Array.isArray(results)) return { ok: false, reason: 'no "events.results" list in body' };
  const events: ParsedEvent[] = results.map((r) => {
    const e = r as Record<string, unknown>;
    const count = Number(e.totalArticleCount) || 0;
    return {
      kind: 'news',
      sourceId: String(e.uri ?? ''),
      what: label(e.title),
      where: place(e.location),
      sourceTime: e.eventDate ? String(e.eventDate) : null,
      measure: `${count.toLocaleString('en-US')} articles`,
      current: null,
      madeCut: newsMadeCut(count),
      raw: r,
    };
  });
  return { ok: true, events };
}
