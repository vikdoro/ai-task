// Event Registry (newsapi.ai): breaking news as events (clusters of articles about one story).
// The article count per event is the importance signal. Key in EVENT_REGISTRY_API_KEY. One search per call.
//
// Request shape checked against the Python SDK (read for reference, never installed):
//   github.com/EventRegistry/event-registry-python  eventregistry/QueryEvents.py (action "getEvents",
//   path /api/v1/event, lang, dateStart, dateEnd; RequestEventsInfo: eventsPage, eventsCount <= 50,
//   eventsSortBy "size"), eventregistry/ReturnInfo.py (includeEvent* flags), eventregistry/EventRegistry.py
//   (host https://eventregistry.org, JSON POST, apiKey in the body, forceMaxDataTimeWindow 31).

const NAME = 'eventregistry';
const URL = 'https://eventregistry.org/api/v1/event';
const COUNT = 50; // the API maximum per page; one page = one search

const day = (d) => d.toISOString().slice(0, 10);

// Event dates are whole days (YYYY-MM-DD), so the window is the previous UTC day (the date 24 hours ago)
// through today. Nothing older is requested.
export function buildBody(key, now = new Date()) {
  return {
    action: 'getEvents',
    lang: 'eng',
    dateStart: day(new Date(now.getTime() - 24 * 3600 * 1000)),
    dateEnd: day(now),
    resultType: ['events'],
    eventsPage: 1,
    eventsCount: COUNT,
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

const label = (x) => (x && typeof x === 'object' ? x.eng ?? Object.values(x)[0] : x);

function toEvent(e, i) {
  const loc = e.location;
  const place = loc ? [label(loc.label), loc.type !== 'country' ? label(loc.country?.label) : null].filter(Boolean).join(', ') : undefined;
  return {
    rank: i + 1,
    uri: e.uri,
    title: label(e.title),
    eventDate: e.eventDate,
    location: place || undefined,
    categories: Array.isArray(e.categories) ? e.categories.map((c) => c.label ?? c.uri).filter(Boolean) : undefined,
    totalArticleCount: e.totalArticleCount,
    engArticleCount: e.articleCounts?.eng,
  };
}

export async function fetchEventRegistry(ctx) {
  const key = ctx.env.EVENT_REGISTRY_API_KEY;
  if (!key) return { source: NAME, state: 'skipped', detail: 'EVENT_REGISTRY_API_KEY not set' };

  const body = buildBody(key);
  ctx.countEventRegistryRequest();
  const r = await ctx.get(NAME, URL, {
    file: `${NAME}-events.json`,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    requestFile: `${NAME}-request.json`,
    timeoutMs: 60000,
  });
  if (!r.ok) return { source: NAME, state: 'failed', detail: r.detail };

  let res;
  try {
    res = JSON.parse(r.text);
  } catch (e) {
    return { source: NAME, state: 'failed', detail: `status ${r.status}, body is not JSON: ${e.message}` };
  }
  // Errors (bad key, no tokens left) can come back as HTTP 200 with an "error" field.
  if (res?.error) return { source: NAME, state: 'failed', detail: `status ${r.status}, error: ${JSON.stringify(res.error).slice(0, 200)}` };
  const results = res?.events?.results;
  if (!Array.isArray(results)) return { source: NAME, state: 'failed', detail: `status ${r.status}, no "events.results" array in body` };

  const events = results.map(toEvent).sort((a, b) => (Number(b.totalArticleCount) || 0) - (Number(a.totalArticleCount) || 0)).map((e, i) => ({ ...e, rank: i + 1 }));
  const dates = events.map((e) => Date.parse(`${e.eventDate}T00:00:00Z`)).filter((t) => !Number.isNaN(t));
  return {
    source: NAME,
    state: 'ok',
    count: events.length,
    newest: dates.length ? new Date(Math.max(...dates)) : null,
    detail: `event dates are whole days; ${res.events.totalResults ?? '?'} events match in total`,
    data: { events, window: { dateStart: body.dateStart, dateEnd: body.dateEnd }, totalResults: res.events.totalResults },
  };
}

const show = (v) => (v === undefined || v === null || v === '' ? 'missing' : String(v));

export function printEvents(report, log) {
  const { events, window, totalResults } = report.data;
  log(`Event Registry events ${window.dateStart} to ${window.dateEnd} (English), by article count, top ${events.length} of ${show(totalResults)}:`);
  for (const e of events) {
    log(
      `  #${String(e.rank).padStart(2)} | ${show(e.totalArticleCount)} articles (eng ${show(e.engArticleCount)}) | ${show(e.title)} | ` +
        `date ${show(e.eventDate)} | location ${show(e.location)} | id ${show(e.uri)}`,
    );
  }
}

export function diffEvents(prev, cur) {
  const before = new Map(prev.data.events.map((e) => [e.uri, e]));
  const after = new Set(cur.data.events.map((e) => e.uri));
  const lines = [];
  for (const e of cur.data.events) {
    const p = before.get(e.uri);
    if (!p) lines.push(`new event: #${e.rank} ${show(e.totalArticleCount)} articles | ${show(e.title)} | id ${show(e.uri)}`);
    else if (p.totalArticleCount !== e.totalArticleCount) lines.push(`article count ${show(e.uri)}: ${show(p.totalArticleCount)} -> ${show(e.totalArticleCount)} (${show(e.title)})`);
  }
  for (const [uri, p] of before) if (!after.has(uri)) lines.push(`no longer in the top ${COUNT}: ${uri} (${show(p.title)})`);
  return lines;
}
