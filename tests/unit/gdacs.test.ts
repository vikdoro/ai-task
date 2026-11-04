import { afterEach, describe, expect, it } from 'vitest';
import { disasterMadeCut } from '../../lib/bars.ts';
import { GDACS_URL, parseGdacs } from '../../lib/sources/gdacs.ts';
import { pollSource } from '../../lib/poll.ts';
import { listEvents } from '../../lib/storage/store.ts';
import { cleanupTmp, jsonResponse, liveCtx } from '../helpers.ts';

afterEach(cleanupTmp);

const feature = (p: Record<string, unknown>) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: p });
const body = {
  type: 'FeatureCollection',
  features: [
    feature({ eventtype: 'TC', eventid: 1001, name: 'Cyclone A', country: 'India', fromdate: '2026-11-01T00:00:00', alertlevel: 'Red', episodealertlevel: 'Red', iscurrent: 'true', severitydata: { severitytext: 'Hurricane > 74 mph' } }),
    feature({ eventtype: 'EQ', eventid: 2002, name: 'Quake B', country: 'Chile', fromdate: '2026-10-20T06:30:00', alertlevel: 'Orange', episodealertlevel: 'Orange', iscurrent: 'false', severitydata: { severitytext: '' } }),
    feature({ eventtype: 'FL', eventid: 3003, name: 'Flood C', country: 'Brazil', fromdate: '2026-10-30T00:00:00', alertlevel: 'Orange', iscurrent: 'true' }),
  ],
};

describe('AC-4 GDACS parsing', () => {
  it('AC-4 the request URL is the Orange;Red alert-level search', () => {
    expect(GDACS_URL).toBe('https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=Orange;Red');
  });

  it('AC-4 stores every feature, current or not, with its fields', () => {
    const r = parseGdacs(body);
    if (!r.ok) throw new Error(r.reason);
    expect(r.events).toHaveLength(3);
    const [a, b, c] = r.events;
    expect(a).toMatchObject({ kind: 'disaster', sourceId: 'TC-1001', what: 'Cyclone A', where: 'India', sourceTime: '2026-11-01T00:00:00.000Z', measure: 'Red (Hurricane > 74 mph)', current: true, madeCut: true });
    expect(a.raw).toEqual(body.features[0]);
    expect(b).toMatchObject({ sourceId: 'EQ-2002', sourceTime: '2026-10-20T06:30:00.000Z', measure: 'Orange', current: false, madeCut: false });
    expect(c).toMatchObject({ sourceId: 'FL-3003', measure: 'Orange', current: true, madeCut: false });
  });

  it('AC-4 a body without a features list is a failure', () => {
    expect(parseGdacs({ type: 'FeatureCollection' }).ok).toBe(false);
    expect(parseGdacs(null).ok).toBe(false);
  });

  it('AC-4 a live poll makes exactly one GET to the URL', async () => {
    const calls: { url: string; method?: string }[] = [];
    const ctx = await liveCtx({
      fetch: (async (url: string, init?: RequestInit) => {
        calls.push({ url: String(url), method: init?.method });
        return jsonResponse(body);
      }) as unknown as typeof fetch,
    });
    const res = await pollSource('gdacs', ctx);
    expect(res.outcome).toBe('ok');
    expect(calls).toEqual([{ url: GDACS_URL, method: 'GET' }]);
    expect(await listEvents(ctx.db, 200)).toHaveLength(3);
  });
});

describe('AC-5 GDACS bar', () => {
  const cases: [string, { current: boolean; alertlevel: string; eventtype: string; episodealertlevel?: string }, boolean][] = [
    ['current Red FL', { current: true, alertlevel: 'Red', eventtype: 'FL' }, true],
    ['not current Red TC', { current: false, alertlevel: 'Red', eventtype: 'TC' }, false],
    ['current Orange EQ', { current: true, alertlevel: 'Orange', eventtype: 'EQ' }, true],
    ['current Orange TC', { current: true, alertlevel: 'Orange', eventtype: 'TC' }, true],
    ['current Orange FL', { current: true, alertlevel: 'Orange', eventtype: 'FL' }, false],
    ['current Orange DR', { current: true, alertlevel: 'Orange', eventtype: 'DR' }, false],
    ['current Green EQ', { current: true, alertlevel: 'Green', eventtype: 'EQ' }, false],
  ];
  it.each(cases)('AC-5 %s', (_name, item, expected) => {
    expect(disasterMadeCut(item)).toBe(expected);
  });

  it('AC-5 current, alertlevel Orange, episodealertlevel Red, FL does not make the cut', () => {
    const r = parseGdacs({
      features: [feature({ eventtype: 'FL', eventid: 1, name: 'F', country: 'X', fromdate: '2026-11-01T00:00:00', alertlevel: 'Orange', episodealertlevel: 'Red', iscurrent: 'true' })],
    });
    if (!r.ok) throw new Error(r.reason);
    expect(r.events[0].madeCut).toBe(false);
  });
});
