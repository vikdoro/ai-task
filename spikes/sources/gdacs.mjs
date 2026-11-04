// GDACS: natural disasters. No key. Two calls per round: Orange/Red only, and unfiltered.

const BASE = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';

export const CALLS = [
  { name: 'gdacs-filtered', url: `${BASE}?alertlevel=Orange;Red` },
  { name: 'gdacs-all', url: BASE },
];

// GDACS dates carry no zone ("2026-11-04T06:01:20"). GDACS publishes in UTC, so read them as UTC.
export function parseUtc(s) {
  if (!s || typeof s !== 'string') return null;
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t);
}

function toEvent(p) {
  return {
    key: `${p.eventtype}-${p.eventid}`,
    eventtype: p.eventtype,
    eventid: p.eventid,
    name: p.name,
    country: p.country,
    alertlevel: p.alertlevel,
    episodealertlevel: p.episodealertlevel,
    episodeid: p.episodeid,
    severitytext: p.severitydata?.severitytext,
    fromdate: p.fromdate,
    todate: p.todate,
    datemodified: p.datemodified,
    report: p.url?.report,
  };
}

async function one(ctx, { name, url }) {
  const r = await ctx.get(name, url, { file: `${name}.json` });
  if (!r.ok) return { source: name, state: 'failed', detail: r.detail };
  let body;
  try {
    body = JSON.parse(r.text);
  } catch (e) {
    return { source: name, state: 'failed', detail: `status ${r.status}, body is not JSON: ${e.message}` };
  }
  if (!Array.isArray(body?.features)) {
    return { source: name, state: 'failed', detail: `status ${r.status}, no "features" array in body` };
  }
  const events = body.features.map((f) => toEvent(f?.properties ?? {}));
  const times = events.map((e) => parseUtc(e.datemodified)).filter(Boolean);
  const newest = times.length ? new Date(Math.max(...times)) : null;
  return { source: name, state: 'ok', count: events.length, newest, data: { events } };
}

export function fetchGdacs(ctx) {
  return Promise.all(CALLS.map((c) => one(ctx, c)));
}

const show = (v) => (v === undefined || v === null || v === '' ? 'missing' : String(v));

export function eventLine(e, tags) {
  return [
    `${show(e.eventtype)} ${show(e.eventid)}`,
    `country ${show(e.country)}`,
    `alert ${show(e.alertlevel)}`,
    `episode alert ${show(e.episodealertlevel)}`,
    `episode ${show(e.episodeid)}`,
    `severity "${show(e.severitytext)}"`,
    `from ${show(e.fromdate)}`,
    `modified ${show(e.datemodified)}`,
    `report ${show(e.report)}`,
  ].join(' | ') + (tags ? `  [${tags}]` : '');
}

// Every event once, from both calls, tagged with the calls it came from.
export function printEvents(reports, log) {
  const byKey = new Map();
  for (const r of reports) {
    if (r.state !== 'ok') continue;
    for (const e of r.data.events) {
      const entry = byKey.get(e.key) ?? { e, tags: [] };
      entry.tags.push(r.source === 'gdacs-filtered' ? 'filtered' : 'all');
      byKey.set(e.key, entry);
    }
  }
  log(`GDACS events (${byKey.size} distinct across both calls):`);
  for (const { e, tags } of byKey.values()) log(`  ${eventLine(e, tags.join(', '))}`);
}

export function diffEvents(prev, cur) {
  const before = new Map(prev.data.events.map((e) => [e.key, e]));
  const after = new Map(cur.data.events.map((e) => [e.key, e]));
  const lines = [];
  for (const [k, e] of after) {
    const p = before.get(k);
    if (!p) lines.push(`new event: ${eventLine(e)}`);
    else {
      if (p.episodeid !== e.episodeid) lines.push(`new episode ${k}: ${p.episodeid} -> ${e.episodeid}: ${eventLine(e)}`);
      if (p.datemodified !== e.datemodified) lines.push(`datemodified changed ${k}: ${p.datemodified} -> ${e.datemodified}`);
      if (p.alertlevel !== e.alertlevel) lines.push(`alertlevel changed ${k}: ${p.alertlevel} -> ${e.alertlevel}`);
    }
  }
  for (const k of before.keys()) if (!after.has(k)) lines.push(`no longer listed: ${k}`);
  return lines;
}
