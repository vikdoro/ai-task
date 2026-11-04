import { afterEach, describe, expect, it } from 'vitest';
import { newsMadeCut } from '../../lib/bars.ts';
import { EVENT_REGISTRY_URL, buildEventRegistryBody, parseEventRegistry } from '../../lib/sources/eventregistry.ts';
import { pollSource } from '../../lib/poll.ts';
import { latestCheck, recordPoll } from '../../lib/storage/store.ts';
import { cleanupTmp, jsonResponse, liveCtx } from '../helpers.ts';

afterEach(cleanupTmp);

const result = (over: Record<string, unknown> = {}) => ({
  uri: 'eng-1',
  title: { eng: 'Big story', deu: 'Grosse Geschichte' },
  eventDate: '2026-11-03',
  totalArticleCount: 1234,
  location: { type: 'place', label: { eng: 'Tenerife' }, country: { type: 'country', label: { eng: 'Spain' } } },
  ...over,
});

describe('AC-8 Event Registry request and parsing', () => {
  it('AC-8 the body matches the M1 request', () => {
    expect(EVENT_REGISTRY_URL).toBe('https://eventregistry.org/api/v1/event');
    expect(buildEventRegistryBody('k', new Date('2026-11-04T00:30:00Z'))).toEqual({
      action: 'getEvents',
      lang: 'eng',
      dateStart: '2026-11-03',
      dateEnd: '2026-11-04',
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
      apiKey: 'k',
    });
  });

  it('AC-8 each result is one event with its fields', () => {
    const r = parseEventRegistry({
      events: {
        results: [
          result(),
          result({ uri: 'eng-2', title: { deu: 'Nur Deutsch', fra: 'X' }, location: null, totalArticleCount: 999 }),
          result({ uri: 'eng-3', location: { type: 'country', label: { eng: 'France' } }, totalArticleCount: 12 }),
        ],
      },
    });
    if (!r.ok) throw new Error(r.reason);
    expect(r.events[0]).toMatchObject({ kind: 'news', sourceId: 'eng-1', what: 'Big story', where: 'Tenerife, Spain', sourceTime: '2026-11-03', measure: '1,234 articles', current: null, madeCut: true });
    expect(r.events[1]).toMatchObject({ sourceId: 'eng-2', what: 'Nur Deutsch', where: '', measure: '999 articles', madeCut: false });
    expect(r.events[2]).toMatchObject({ where: 'France', measure: '12 articles' });
  });

  it('AC-8 an error field or a missing results list is a failure', () => {
    expect(parseEventRegistry({ error: 'invalid api key' }).ok).toBe(false);
    expect(parseEventRegistry({ events: {} }).ok).toBe(false);
  });

  it('AC-8 a live poll makes exactly one POST and records the rate-limit header', async () => {
    const calls: { url: string; method?: string; body: unknown }[] = [];
    const ctx = await liveCtx({
      fetch: (async (url: string, init?: RequestInit) => {
        calls.push({ url: String(url), method: init?.method, body: JSON.parse(String(init?.body)) });
        return jsonResponse({ events: { results: [result()] } }, { headers: { 'x-ratelimit-remaining': '1990' } });
      }) as unknown as typeof fetch,
    });
    const res = await pollSource('eventregistry', ctx);
    expect(res.outcome).toBe('ok');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(EVENT_REGISTRY_URL);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].body).toEqual(buildEventRegistryBody('er-fake-key', new Date('2026-11-04T12:00:00.000Z')));
    expect((await latestCheck(ctx.db, 'eventregistry'))?.ratelimit_remaining).toBe(1990);
  });

  it('AC-8 Event Registry is never retried, even after a 5xx', async () => {
    let n = 0;
    const ctx = await liveCtx({
      fetch: (async () => {
        n++;
        return jsonResponse('oops', { status: 503 });
      }) as unknown as typeof fetch,
    });
    const res = await pollSource('eventregistry', ctx);
    expect(res.outcome).toBe('failed');
    expect(n).toBe(1);
  });
});

describe('AC-9 news bar', () => {
  it('AC-9 999 does not make the cut, 1,000 does', () => {
    expect(newsMadeCut(999)).toBe(false);
    expect(newsMadeCut(1000)).toBe(true);
    expect(newsMadeCut(5000)).toBe(true);
  });
});

describe('AC-14 token floor', () => {
  it('AC-14 below 200 remaining, no request is made and the check is paused', async () => {
    let n = 0;
    const ctx = await liveCtx({
      fetch: (async () => {
        n++;
        return jsonResponse({ events: { results: [] } });
      }) as unknown as typeof fetch,
    });
    await recordPoll(ctx.db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', ratelimitRemaining: 199 });
    const res = await pollSource('eventregistry', ctx);
    expect(n).toBe(0);
    expect(res.outcome).toBe('paused');
    expect(res.detail).toBe('token floor reached');
    expect(await latestCheck(ctx.db, 'eventregistry')).toMatchObject({ outcome: 'paused', detail: 'token floor reached' });
  });

  it('AC-14 at 200 the request goes ahead, and with no recorded value it goes ahead', async () => {
    let n = 0;
    const ctx = await liveCtx({
      fetch: (async () => {
        n++;
        return jsonResponse({ events: { results: [] } });
      }) as unknown as typeof fetch,
    });
    expect((await pollSource('eventregistry', ctx)).outcome).toBe('ok');
    await recordPoll(ctx.db, { source: 'eventregistry', checkedAt: '2026-11-04T10:00:00.000Z', outcome: 'ok', detail: '', ratelimitRemaining: 200 });
    expect((await pollSource('eventregistry', ctx)).outcome).toBe('ok');
    expect(n).toBe(2);
  });

  it('AC-14 the most recently recorded value is used, also from a failed response that carried it', async () => {
    let n = 0;
    const ctx = await liveCtx({
      fetch: (async () => {
        n++;
        return jsonResponse({ error: 'bad' }, { headers: { 'x-ratelimit-remaining': '150' } });
      }) as unknown as typeof fetch,
    });
    await recordPoll(ctx.db, { source: 'eventregistry', checkedAt: '2026-11-04T09:00:00.000Z', outcome: 'ok', detail: '', ratelimitRemaining: 1500 });
    expect((await pollSource('eventregistry', ctx)).outcome).toBe('failed');
    expect((await latestCheck(ctx.db, 'eventregistry'))?.ratelimit_remaining).toBe(150);
    expect((await pollSource('eventregistry', ctx)).outcome).toBe('paused');
    expect(n).toBe(1);
  });
});
