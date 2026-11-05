import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteAlert, saveAlert } from '../../lib/alert.ts';
import { matchAlerts, type MatchOptions } from '../../lib/delivery/match.ts';
import { sweepInterrupted } from '../../lib/delivery/store.ts';
import { pollSource } from '../../lib/poll.ts';
import { openDb, type Db } from '../../lib/storage/db.ts';
import { recordPoll } from '../../lib/storage/store.ts';
import type { ParsedEvent } from '../../lib/sources/types.ts';
import { EMPTY_SAMPLES, FULL_SAMPLES, cleanupTmp, jsonResponse, samplesCtx, throwingFetch, tmpDb, tmpDir } from '../helpers.ts';

afterEach(() => {
  vi.useRealTimers();
  cleanupTmp();
});

const ADDRESS = 'match-user@example.invalid';
const HOOK = 'https://hooks.example.invalid/match-hook-1';
const KEY = 're_match_key_1';
const CONTACTS = { DEMO_USER_EMAIL: ADDRESS, SLACK_WEBHOOK_URL: HOOK };

const ev = (over: Partial<ParsedEvent> = {}): ParsedEvent => ({
  kind: 'disaster',
  sourceId: 'd-1',
  what: 'Flood',
  where: 'Chad',
  sourceTime: '2026-11-04T10:00:00.000Z',
  measure: 'Red',
  current: true,
  madeCut: true,
  raw: {},
  ...over,
});

/** Records the events as one ok poll, so their cleared_at is `at`. */
async function addEvents(db: Db, at: string, ...events: ParsedEvent[]) {
  await recordPoll(db, { source: 'gdacs', checkedAt: at, outcome: 'ok', detail: '', events });
}

async function setAlert(db: Db, email: boolean, slack: boolean, at: string) {
  const r = await saveAlert(db, CONTACTS, { email, slack }, new Date(at));
  expect(r.ok).toBe(true);
}

const fake = (db: Db, over: Partial<MatchOptions> = {}) => matchAlerts({ db, mode: 'fake', env: {}, fetch: throwingFetch(), now: () => new Date('2026-11-05T00:00:00.000Z'), ...over });

async function fired(db: Db) {
  return db.prepare('SELECT kind, source_id, sent, reason FROM alerts_fired ORDER BY kind, source_id').all();
}
async function deliveries(db: Db) {
  return (await db.prepare('SELECT kind, source_id, channel, outcome, detail, email_id FROM deliveries ORDER BY kind, source_id, channel').all()) as Record<string, unknown>[];
}

type Call = { url: string; body: string; at: number };
/** Resend answers with an id, Slack with ok. Records every call. */
function okFetch() {
  const calls: Call[] = [];
  let n = 0;
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), body: String(init.body), at: Date.now() });
    return String(url).startsWith('https://api.resend.com') ? jsonResponse({ id: `em_${++n}` }) : new Response('ok', { status: 200 });
  }) as unknown as typeof fetch;
  return { fetch: f, calls };
}

/** Runs a promise to the end while advancing fake timers. */
async function drive<T>(p: Promise<T>): Promise<T> {
  let done = false;
  p.then(
    () => (done = true),
    () => (done = true),
  );
  while (!done) await vi.advanceTimersByTimeAsync(250);
  return p;
}

const live = (db: Db, f: typeof fetch, over: Partial<MatchOptions> = {}) =>
  drive(matchAlerts({ db, mode: 'live', env: { RESEND_API_KEY: KEY }, fetch: f, timeZone: 'Europe/Budapest', ...over }));

describe('M5 AC-1 matching runs after every poll', () => {
  it('AC-1 pollSource matches every made-cut event with no alerts_fired row, one row each', async () => {
    const ctx = await samplesCtx(FULL_SAMPLES);
    await pollSource('gdacs', ctx);
    const afterGdacs = (await fired(ctx.db)) as { kind: string }[];
    expect(afterGdacs).toHaveLength(2);
    expect(afterGdacs.every((r) => r.kind === 'disaster')).toBe(true);
    await pollSource('twelvedata', ctx);
    await pollSource('eventregistry', ctx);
    const all = (await fired(ctx.db)) as { kind: string; source_id: string }[];
    const cut = (await ctx.db.prepare('SELECT kind, source_id FROM events WHERE made_cut = 1 ORDER BY kind, source_id').all()) as { kind: string; source_id: string }[];
    expect(all.map((r) => `${r.kind} ${r.source_id}`)).toEqual(cut.map((r) => `${r.kind} ${r.source_id}`));
    expect(all).toHaveLength(5);
  });

  it('AC-1 a failed poll still matches events left unmatched, whatever their source', async () => {
    const ctx = await samplesCtx(EMPTY_SAMPLES);
    await addEvents(ctx.db, '2026-11-04T00:00:00.000Z', ev({ kind: 'news', sourceId: 'n-1', sourceTime: '2026-11-03' }));
    const missing = await samplesCtx(tmpDir(), { db: ctx.db });
    const r = await pollSource('twelvedata', missing);
    expect(r.outcome).toBe('failed');
    expect(await fired(ctx.db)).toEqual([{ kind: 'news', source_id: 'n-1', sent: 0, reason: 'no alert set up' }]);
    expect(r.alerts?.fired).toHaveLength(1);
  });

  it('AC-1 events that did not make the cut get no row', async () => {
    const { db } = await tmpDb();
    await addEvents(db, '2026-11-04T00:00:00.000Z', ev({ sourceId: 'below', madeCut: false }));
    await fake(db);
    expect(await fired(db)).toEqual([]);
  });
});

describe('M5 AC-2 the row is decided from the alert at matching time', () => {
  const created = '2026-11-04T12:00:00.000Z';
  const cases: { name: string; alert: { email: boolean; slack: boolean } | 'none'; clearedAt: string; sent: 0 | 1; reason: string; channels: string[] }[] = [
    { name: 'no alert', alert: 'none', clearedAt: '2026-11-04T13:00:00.000Z', sent: 0, reason: 'no alert set up', channels: [] },
    { name: 'no alert, event old', alert: 'none', clearedAt: '2020-01-01T00:00:00.000Z', sent: 0, reason: 'no alert set up', channels: [] },
    { name: 'cleared before the alert was created', alert: { email: true, slack: true }, clearedAt: '2026-11-04T11:59:59.999Z', sent: 0, reason: 'made the cut before the alert was set up', channels: [] },
    { name: 'cleared before the alert, zero channels', alert: { email: false, slack: false }, clearedAt: '2026-11-04T11:00:00.000Z', sent: 0, reason: 'made the cut before the alert was set up', channels: [] },
    { name: 'zero channels ticked', alert: { email: false, slack: false }, clearedAt: '2026-11-04T13:00:00.000Z', sent: 0, reason: 'no channels picked', channels: [] },
    { name: 'cleared exactly at created_at counts as sent', alert: { email: true, slack: false }, clearedAt: created, sent: 1, reason: '', channels: ['email'] },
    { name: 'Slack only', alert: { email: false, slack: true }, clearedAt: '2026-11-04T13:00:00.000Z', sent: 1, reason: '', channels: ['slack'] },
    { name: 'both channels', alert: { email: true, slack: true }, clearedAt: '2026-11-04T13:00:00.000Z', sent: 1, reason: '', channels: ['email', 'slack'] },
    { name: 'no age limit: an event long after the alert is sent', alert: { email: true, slack: true }, clearedAt: '2030-01-01T00:00:00.000Z', sent: 1, reason: '', channels: ['email', 'slack'] },
  ];
  for (const c of cases) {
    it(`AC-2 ${c.name}`, async () => {
      const { db } = await tmpDb();
      if (c.alert !== 'none') {
        await setAlert(db, true, true, created);
        await setAlert(db, c.alert.email, c.alert.slack, '2026-11-04T12:30:00.000Z');
      }
      await addEvents(db, c.clearedAt, ev());
      const result = await fake(db);
      expect(await fired(db)).toEqual([{ kind: 'disaster', source_id: 'd-1', sent: c.sent, reason: c.reason }]);
      expect((await deliveries(db)).map((d) => d.channel)).toEqual(c.channels);
      expect(result.fired).toHaveLength(1);
      expect(result.fired[0].sent).toBe(c.sent === 1);
    });
  }
});

describe('M5 AC-3 matching happens once per event', () => {
  it('AC-3 a later poll that updates the event sends nothing new', async () => {
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    await fake(db);
    const before = await deliveries(db);
    expect(before).toHaveLength(2);
    await addEvents(db, '2026-11-04T02:00:00.000Z', ev({ what: 'Flood, updated', measure: 'Red (2)' }));
    expect((await fake(db)).fired).toEqual([]);
    expect(await deliveries(db)).toEqual(before);
  });

  it('AC-3 ticking a channel after the event was sent to the other one sends nothing new', async () => {
    const { db } = await tmpDb();
    await setAlert(db, true, false, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    await fake(db);
    await setAlert(db, true, true, '2026-11-04T02:00:00.000Z');
    expect((await fake(db)).fired).toEqual([]);
    expect((await deliveries(db)).map((d) => d.channel)).toEqual(['email']);
  });

  it('AC-3 ticking a channel after "no channels picked" sends nothing', async () => {
    const { db } = await tmpDb();
    await setAlert(db, true, false, '2026-11-04T00:00:00.000Z');
    await setAlert(db, false, false, '2026-11-04T00:10:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    await fake(db);
    await setAlert(db, true, true, '2026-11-04T02:00:00.000Z');
    await fake(db);
    expect(await fired(db)).toEqual([{ kind: 'disaster', source_id: 'd-1', sent: 0, reason: 'no channels picked' }]);
    expect(await deliveries(db)).toEqual([]);
  });

  it('AC-3 deleting the alert and setting it up again sends nothing new', async () => {
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    await fake(db);
    await deleteAlert(db, CONTACTS);
    await setAlert(db, true, true, '2026-11-04T00:30:00.000Z');
    expect((await fake(db)).fired).toEqual([]);
    expect(await deliveries(db)).toHaveLength(2);
  });
});

describe('M5 AC-5 at most once', () => {
  it('AC-5 the deliveries row is "sending" when the send call is made, then updated', async () => {
    vi.useFakeTimers();
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    const seen: unknown[] = [];
    const f = (async (url: string) => {
      const channel = String(url).startsWith('https://api.resend.com') ? 'email' : 'slack';
      seen.push(await db.prepare('SELECT channel, outcome FROM deliveries WHERE channel = ?').get(channel));
      return channel === 'email' ? jsonResponse({ id: 'em_x' }) : new Response('ok');
    }) as unknown as typeof fetch;
    await live(db, f);
    expect(seen).toEqual([
      { channel: 'email', outcome: 'sending' },
      { channel: 'slack', outcome: 'sending' },
    ]);
    const rows = (await db.prepare('SELECT channel, outcome, detail, email_id, started_at, finished_at FROM deliveries ORDER BY channel').all()) as Record<string, string | null>[];
    expect(rows.map((r) => [r.channel, r.outcome, r.detail, r.email_id])).toEqual([
      ['email', 'delivered', '', 'em_x'],
      ['slack', 'delivered', '', null],
    ]);
    for (const r of rows) {
      expect(r.started_at).toMatch(/^\d{4}-\d\d-\d\dT/);
      expect(r.finished_at).toMatch(/^\d{4}-\d\d-\d\dT/);
    }
  });

  it('AC-5 two matchings at once on the same database send once per channel', async () => {
    vi.useFakeTimers();
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev({ sourceId: 'a' }), ev({ sourceId: 'b' }), ev({ sourceId: 'c' }));
    const { fetch, calls } = okFetch();
    const [r1, r2] = await drive(Promise.all([
      matchAlerts({ db, mode: 'live', env: { RESEND_API_KEY: KEY }, fetch }),
      matchAlerts({ db, mode: 'live', env: { RESEND_API_KEY: KEY }, fetch }),
    ]));
    expect(r1.fired.length + r2.fired.length).toBe(3);
    expect(calls.filter((c) => c.url.startsWith('https://api.resend.com'))).toHaveLength(3);
    expect(calls.filter((c) => c.url === HOOK)).toHaveLength(3);
  });

  it('AC-5 two matchings at once on two connections to one file send once per channel', async () => {
    vi.useFakeTimers();
    const { db, path } = await tmpDb();
    const other = await openDb(path);
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev({ sourceId: 'a' }), ev({ sourceId: 'b' }));
    const { fetch, calls } = okFetch();
    const [r1, r2] = await drive(Promise.all([
      matchAlerts({ db, mode: 'live', env: { RESEND_API_KEY: KEY }, fetch }),
      matchAlerts({ db: other, mode: 'live', env: { RESEND_API_KEY: KEY }, fetch }),
    ]));
    expect(r1.fired.length + r2.fired.length).toBe(2);
    expect(calls).toHaveLength(4);
    expect(await deliveries(db)).toHaveLength(4);
    await other.dispose();
  });
});

describe('M5 AC-6 sending', () => {
  it('AC-6 each ticked channel once, to the stored values, oldest cleared_at first then source time, 1 s apart per channel', async () => {
    vi.useFakeTimers();
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T03:00:00.000Z', ev({ sourceId: 'late', what: 'Late' }));
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev({ sourceId: 'first-b', what: 'Second', sourceTime: '2026-11-04T00:30:00.000Z' }), ev({ sourceId: 'first-a', what: 'First', sourceTime: '2026-11-04T00:10:00.000Z' }));
    const { fetch, calls } = okFetch();
    // The env holds other contact values; the stored ones are used.
    await live(db, fetch, { env: { RESEND_API_KEY: KEY, DEMO_USER_EMAIL: 'other@example.invalid', SLACK_WEBHOOK_URL: 'https://hooks.example.invalid/other' } });
    const emails = calls.filter((c) => c.url === 'https://api.resend.com/emails');
    const slacks = calls.filter((c) => c.url === HOOK);
    expect(emails.map((c) => JSON.parse(c.body).subject)).toEqual(['Natural disaster: First', 'Natural disaster: Second', 'Natural disaster: Late']);
    expect(emails.every((c) => JSON.parse(c.body).to === ADDRESS)).toBe(true);
    expect(slacks.map((c) => JSON.parse(c.body).text.split('\n')[0])).toEqual(['Natural disaster: First', 'Natural disaster: Second', 'Natural disaster: Late']);
    expect(calls).toHaveLength(6);
    for (const list of [emails, slacks]) for (let i = 1; i < list.length; i++) expect(list[i].at - list[i - 1].at).toBeGreaterThanOrEqual(1000);
  });

  it('AC-6 the same event gives the same text on both channels', async () => {
    vi.useFakeTimers();
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    const { fetch, calls } = okFetch();
    await live(db, fetch);
    const email = JSON.parse(calls.find((c) => c.url.startsWith('https://api.resend.com'))!.body);
    const slack = JSON.parse(calls.find((c) => c.url === HOOK)!.body);
    expect(slack.text).toBe(`${email.subject}\n\n${email.text}`);
  });

  it('AC-6 nothing is retried: every attempt ends delivered or failed', async () => {
    vi.useFakeTimers();
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    const calls: string[] = [];
    const f = (async (url: string) => {
      calls.push(String(url));
      return new Response('', { status: 503 });
    }) as unknown as typeof fetch;
    const result = await live(db, f);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toHaveLength(2);
    expect((await deliveries(db)).map((d) => [d.channel, d.outcome, d.detail])).toEqual([
      ['email', 'failed', 'HTTP 503'],
      ['slack', 'failed', 'HTTP 503 unexpected body'],
    ]);
    expect(result.fired[0].email).toEqual({ outcome: 'failed', detail: 'HTTP 503' });
  });

  it('AC-6 missing contact values or key give failed deliveries, not a not-sent alert', async () => {
    vi.useFakeTimers();
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await db.exec("UPDATE alert SET slack_webhook_url = ''");
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    const { fetch, calls } = okFetch();
    await live(db, fetch, { env: {} });
    expect(calls).toHaveLength(0);
    expect(await fired(db)).toEqual([{ kind: 'disaster', source_id: 'd-1', sent: 1, reason: '' }]);
    expect((await deliveries(db)).map((d) => [d.channel, d.outcome, d.detail])).toEqual([
      ['email', 'failed', 'not configured (RESEND_API_KEY missing)'],
      ['slack', 'failed', 'no Slack webhook stored'],
    ]);
  });
});

describe('M5 AC-7 interrupted deliveries', () => {
  async function sendingRow(db: Db) {
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    await db.exec("INSERT INTO alerts_fired (kind, source_id, matched_at, sent, reason) VALUES ('disaster', 'd-1', '2026-11-04T01:00:00.000Z', 1, '')");
    await db.exec("INSERT INTO deliveries (kind, source_id, channel, outcome, detail, started_at) VALUES ('disaster', 'd-1', 'email', 'sending', '', '2026-11-04T01:00:00.000Z')");
  }

  it('AC-7 a row still sending becomes failed: interrupted, outcome unknown, and is never sent again', async () => {
    const { db } = await tmpDb();
    await sendingRow(db);
    await sweepInterrupted(db, new Date('2026-11-04T02:00:00.000Z'));
    const row = (await db.prepare('SELECT outcome, detail, finished_at FROM deliveries').get()) as Record<string, string>;
    expect(row).toEqual({ outcome: 'failed', detail: 'interrupted, outcome unknown', finished_at: '2026-11-04T02:00:00.000Z' });
    await setAlert(db, true, true, '2026-11-01T00:00:00.000Z');
    expect((await fake(db)).fired).toEqual([]);
    expect(await deliveries(db)).toHaveLength(1);
  });

  it('AC-7 if the sender finishes after the sweep, its final outcome overwrites the sweep', async () => {
    vi.useFakeTimers();
    const { db, path } = await tmpDb();
    const other = await openDb(path);
    await setAlert(db, true, false, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    const f = (async () => {
      await sweepInterrupted(other);
      expect(((await other.prepare('SELECT outcome FROM deliveries').get()) as { outcome: string }).outcome).toBe('failed');
      return jsonResponse({ id: 'em_late' });
    }) as unknown as typeof fetch;
    await live(db, f);
    expect((await deliveries(db)).map((d) => [d.outcome, d.detail, d.email_id])).toEqual([['delivered', '', 'em_late']]);
    await other.dispose();
  });
});

describe('M5 AC-10 redaction and length', () => {
  it('AC-10 the address, webhook and key fed back in error bodies are never stored', async () => {
    vi.useFakeTimers();
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    const f = (async (url: string) => {
      if (String(url).startsWith('https://api.resend.com'))
        return jsonResponse({ name: 'validation_error', message: `bad ${ADDRESS} with ${KEY} and ${HOOK}` }, { status: 422 });
      return new Response(`no_service for ${HOOK} ${ADDRESS} ${KEY}`, { status: 404 });
    }) as unknown as typeof fetch;
    const result = await live(db, f);
    const rows = await deliveries(db);
    expect(rows.map((d) => d.detail)).toEqual([
      'HTTP 422 validation_error: bad <email> with <RESEND_API_KEY> and <webhook>',
      'HTTP 404 no_service for <webhook> <email> <RESEND_API_KEY>',
    ]);
    const stored = JSON.stringify([rows, await fired(db), result]);
    for (const v of [ADDRESS, HOOK, KEY]) expect(stored).not.toContain(v);
  });

  it('AC-10 a reason longer than 300 characters is cut to 300', async () => {
    vi.useFakeTimers();
    const { db } = await tmpDb();
    await setAlert(db, false, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev());
    const f = (async () => new Response('x'.repeat(1000), { status: 400 })) as unknown as typeof fetch;
    await live(db, f);
    const [row] = await deliveries(db);
    expect(String(row.detail)).toHaveLength(300);
    expect(String(row.detail).startsWith('HTTP 400 xxx')).toBe(true);
  });
});

describe('M5 AC-14 fake delivery by default', () => {
  it('AC-14 fake mode makes no request; each ticked channel is delivered with fake: not sent', async () => {
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2026-11-04T00:00:00.000Z');
    await addEvents(db, '2026-11-04T01:00:00.000Z', ev(), ev({ sourceId: 'd-2' }));
    const result = await matchAlerts({ db, mode: 'fake', env: { RESEND_API_KEY: KEY }, fetch: throwingFetch() });
    expect((await deliveries(db)).map((d) => [d.source_id, d.channel, d.outcome, d.detail, d.email_id])).toEqual([
      ['d-1', 'email', 'delivered', 'fake: not sent', null],
      ['d-1', 'slack', 'delivered', 'fake: not sent', null],
      ['d-2', 'email', 'delivered', 'fake: not sent', null],
      ['d-2', 'slack', 'delivered', 'fake: not sent', null],
    ]);
    expect(result.fired[0].email).toEqual({ outcome: 'delivered', detail: 'fake: not sent' });
  });

  it('AC-14 pollSource uses fake delivery when the context has no delivery mode', async () => {
    const { db } = await tmpDb();
    await setAlert(db, true, true, '2000-01-01T00:00:00.000Z');
    const ctx = await samplesCtx(FULL_SAMPLES, { db, env: { RESEND_API_KEY: KEY } });
    await pollSource('gdacs', ctx);
    const rows = await deliveries(db);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.detail === 'fake: not sent')).toBe(true);
  });
});
