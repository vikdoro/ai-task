import { disasterMadeCut } from '../bars.ts';
import type { ParsedEvent, ParseResult } from './types.ts';

export const GDACS_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=Orange;Red';

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));

/** GDACS dates come without a zone and are UTC. */
function utc(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
  return Number.isNaN(t) ? s : new Date(t).toISOString();
}

export function parseGdacs(body: unknown): ParseResult {
  const features = (body as { features?: unknown } | null)?.features;
  if (!Array.isArray(features)) return { ok: false, reason: 'no "features" list in body' };
  const events: ParsedEvent[] = features.map((f) => {
    const p = ((f as { properties?: Record<string, unknown> })?.properties ?? {}) as Record<string, unknown>;
    const alertlevel = str(p.alertlevel);
    const eventtype = str(p.eventtype);
    const severity = str((p.severitydata as { severitytext?: unknown } | undefined)?.severitytext).trim();
    const current = p.iscurrent === 'true';
    return {
      kind: 'disaster',
      sourceId: `${eventtype}-${str(p.eventid)}`,
      what: str(p.name),
      where: str(p.country),
      sourceTime: utc(p.fromdate),
      measure: severity ? `${alertlevel} (${severity})` : alertlevel,
      current,
      madeCut: disasterMadeCut({ current, alertlevel, eventtype }),
      raw: f,
    };
  });
  return { ok: true, events };
}
