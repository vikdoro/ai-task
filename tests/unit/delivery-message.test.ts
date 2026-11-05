import { describe, expect, it } from 'vitest';
import { buildMessage, formatDay, formatLocalTime } from '../../lib/delivery/message.ts';

const TZ = 'Europe/Budapest';

type Ev = { kind: string; what: string; place: string; source_time: string | null; raw_json: string };
const ev = (over: Partial<Ev>): Ev => ({ kind: 'disaster', what: 'w', place: '', source_time: null, raw_json: '{}', ...over });

describe('M5 AC-12 times in messages', () => {
  it('AC-12 a time is local with UTC alongside, no leading zero, short month, 24-hour clock', () => {
    expect(formatLocalTime('2026-11-05T13:03:00.000Z', TZ)).toBe('5 Nov 2026, 14:03 CET (13:03 UTC)');
    expect(formatLocalTime('2026-07-01T21:05:00.000Z', TZ)).toBe('1 Jul 2026, 23:05 CEST (21:05 UTC)');
    expect(formatLocalTime('2026-09-30T23:30:00.000Z', TZ)).toBe('1 Oct 2026, 01:30 CEST (23:30 UTC)');
  });

  it('AC-12 the month is the short English name, never "Sept"', () => {
    expect(formatLocalTime('2026-09-10T08:00:00.000Z', TZ)).toBe('10 Sep 2026, 10:00 CEST (08:00 UTC)');
  });

  it('AC-12 the zone label is what Intl en-GB short gives, for another zone too', () => {
    const label = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', timeZoneName: 'short' })
      .formatToParts(new Date('2026-11-05T13:03:00.000Z'))
      .find((p) => p.type === 'timeZoneName')!.value;
    expect(formatLocalTime('2026-11-05T13:03:00.000Z', 'America/New_York')).toBe(`5 Nov 2026, 08:03 ${label} (13:03 UTC)`);
  });

  it('AC-12 a news day has no time and no UTC', () => {
    expect(formatDay('2026-11-03')).toBe('3 Nov 2026');
    expect(formatDay('2026-12-25')).toBe('25 Dec 2026');
  });

  it('AC-12 the time zone defaults to the system zone', () => {
    const system = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const e = ev({ what: 'Quake', source_time: '2026-11-05T13:03:00.000Z' });
    expect(buildMessage(e)).toEqual(buildMessage(e, system));
  });
});

const both = (subject: string, body: string[]) => ({ subject, emailText: body.join('\n'), slackText: `${subject}\n\n${body.join('\n')}` });

describe('M5 AC-11 AC-13 message text, table-driven, Europe/Budapest', () => {
  const cases: { name: string; event: Ev; expected: ReturnType<typeof both> }[] = [
    {
      name: 'a disaster with a country',
      event: ev({ kind: 'disaster', what: 'Tropical Cyclone A', place: 'Philippines', source_time: '2026-11-05T13:03:00.000Z', raw_json: '{"alertlevel":"Red"}' }),
      expected: both('Natural disaster: Tropical Cyclone A', ['Tropical Cyclone A', 'Where: Philippines', 'When: 5 Nov 2026, 14:03 CET (13:03 UTC)', '', 'Source: GDACS']),
    },
    {
      name: 'a disaster without a country',
      event: ev({ kind: 'disaster', what: 'Earthquake M 7.1', place: '', source_time: '2026-11-04T02:15:00.000Z' }),
      expected: both('Natural disaster: Earthquake M 7.1', ['Earthquake M 7.1', 'When: 4 Nov 2026, 03:15 CET (02:15 UTC)', '', 'Source: GDACS']),
    },
    {
      name: 'a market rise',
      event: ev({ kind: 'market', what: 'SPDR S&P 500 ETF Trust (SPY)', place: 'NYSE', source_time: '2026-11-04T21:00:00.000Z', raw_json: '{"percent_change":"3.456"}' }),
      expected: both('Market movement: SPDR S&P 500 ETF Trust (SPY)', ['SPDR S&P 500 ETF Trust (SPY) rose 3.5% today', 'Where: NYSE', 'When: 4 Nov 2026, 22:00 CET (21:00 UTC)']),
    },
    {
      name: 'a market fall',
      event: ev({ kind: 'market', what: 'Bitcoin US Dollar (BTC/USD)', place: 'Coinbase Pro', source_time: '2026-11-04T23:59:00.000Z', raw_json: '{"percent_change":"-3.44"}' }),
      expected: both('Market movement: Bitcoin US Dollar (BTC/USD)', ['Bitcoin US Dollar (BTC/USD) fell 3.4% today', 'Where: Coinbase Pro', 'When: 5 Nov 2026, 00:59 CET (23:59 UTC)']),
    },
    {
      name: 'a market move with no percent_change in the raw JSON falls back to the stored measure',
      event: ev({ kind: 'market', what: 'Gold (GLD)', place: '', source_time: null, raw_json: '{}', ...{ measure: '-2.50%' } } as Partial<Ev>),
      expected: both('Market movement: Gold (GLD)', ['Gold (GLD) fell 2.5% today']),
    },
    {
      name: 'a news event with a place',
      event: ev({ kind: 'news', what: 'Volcano erupts on Tenerife', place: 'Tenerife, Spain', source_time: '2026-11-03', raw_json: '{"totalArticleCount":1234}' }),
      expected: both('Breaking news: Volcano erupts on Tenerife', ['Volcano erupts on Tenerife', 'Where: Tenerife, Spain', 'When: 3 Nov 2026']),
    },
    {
      name: 'a news event without a place',
      event: ev({ kind: 'news', what: 'Central bank cuts rates', place: '', source_time: '2026-11-02' }),
      expected: both('Breaking news: Central bank cuts rates', ['Central bank cuts rates', 'When: 2 Nov 2026']),
    },
    {
      name: 'a news event with no day leaves out When',
      event: ev({ kind: 'news', what: 'Story', place: '', source_time: null }),
      expected: both('Breaking news: Story', ['Story']),
    },
  ];

  for (const c of cases) {
    it(`AC-13 ${c.name}`, () => {
      expect(buildMessage(c.event, TZ)).toEqual(c.expected);
    });
  }

  it('AC-11 nothing else is added: no measure, alert level, article count, link or footer', () => {
    const d = buildMessage(ev({ kind: 'disaster', what: 'Flood', place: 'Chad', source_time: '2026-11-05T13:03:00.000Z', ...{ measure: 'Red (5.2)' } } as Partial<Ev>), TZ);
    expect(d.emailText).not.toMatch(/Red|5\.2|http|articles/);
    const n = buildMessage(ev({ kind: 'news', what: 'Story', place: '', source_time: '2026-11-02', ...{ measure: '1,234 articles' } } as Partial<Ev>), TZ);
    expect(n.emailText).not.toContain('1,234');
  });
});
