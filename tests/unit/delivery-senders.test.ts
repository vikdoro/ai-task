import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendEmail } from '../../lib/delivery/email.ts';
import { sendSlack } from '../../lib/delivery/slack.ts';
import { jsonResponse } from '../helpers.ts';

afterEach(() => {
  vi.useRealTimers();
});

type Call = { url: string; init: RequestInit };

function fakeFetch(respond: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const f = (async (url: string, init: RequestInit) => {
    const call = { url: String(url), init };
    calls.push(call);
    return respond(call);
  }) as unknown as typeof fetch;
  return { fetch: f, calls };
}

/** A fetch that only ends when its signal aborts. */
function hangingFetch() {
  const calls: Call[] = [];
  const f = ((url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Promise((_, reject) => init.signal!.addEventListener('abort', () => reject(init.signal!.reason)));
  }) as unknown as typeof fetch;
  return { fetch: f, calls };
}

const KEY = 're_test_key_123';
const TO = 'someone@example.invalid';
const HOOK = 'https://hooks.example.invalid/workflow/abc';

const email = (f: typeof fetch, env: Record<string, string | undefined> = { RESEND_API_KEY: KEY }, to = TO) =>
  sendEmail({ fetch: f, env, to, subject: 'Natural disaster: Flood', text: 'Flood\nWhen: x' });

describe('M5 AC-8 email through Resend', () => {
  it('AC-8 the request: POST api.resend.com/emails, bearer key, from, to, subject, text', async () => {
    const { fetch, calls } = fakeFetch(() => jsonResponse({ id: 'em_1' }));
    const r = await email(fetch);
    expect(r).toEqual({ outcome: 'delivered', emailId: 'em_1' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    expect(calls[0].init.method).toBe('POST');
    const headers = new Headers(calls[0].init.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${KEY}`);
    expect(headers.get('content-type')).toBe('application/json');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      from: 'World event alerts <onboarding@resend.dev>',
      to: TO,
      subject: 'Natural disaster: Flood',
      text: 'Flood\nWhen: x',
    });
    expect(calls[0].init.signal).toBeInstanceOf(AbortSignal);
  });

  const failures: { name: string; respond: () => Response | Promise<Response>; reason: string }[] = [
    { name: 'non-2xx with JSON name and message', respond: () => jsonResponse({ statusCode: 422, name: 'validation_error', message: 'Invalid `to` field.' }, { status: 422 }), reason: 'HTTP 422 validation_error: Invalid `to` field.' },
    { name: 'a 429 is failed, not retried', respond: () => jsonResponse({ name: 'rate_limit_exceeded', message: 'Too many requests' }, { status: 429 }), reason: 'HTTP 429 rate_limit_exceeded: Too many requests' },
    { name: 'non-2xx without them', respond: () => new Response('Bad gateway', { status: 502 }), reason: 'HTTP 502' },
    { name: 'non-2xx with JSON but no name', respond: () => jsonResponse({ message: 'x' }, { status: 500 }), reason: 'HTTP 500' },
    { name: '2xx without an id', respond: () => jsonResponse({ ok: true }), reason: 'HTTP 200 unexpected body' },
    { name: '2xx that is not JSON', respond: () => new Response('hello', { status: 200 }), reason: 'HTTP 200 unexpected body' },
    { name: 'network error with a code', respond: () => Promise.reject(new TypeError('fetch failed', { cause: Object.assign(new Error('connect'), { code: 'ECONNREFUSED' }) })), reason: 'network error ECONNREFUSED' },
    { name: 'network error without a code', respond: () => Promise.reject(new Error('socket hang up')), reason: 'network error socket hang up' },
  ];
  for (const c of failures) {
    it(`AC-8 failed: ${c.name}`, async () => {
      const { fetch, calls } = fakeFetch(c.respond);
      expect(await email(fetch)).toEqual({ outcome: 'failed', reason: c.reason });
      expect(calls).toHaveLength(1);
    });
  }

  it('AC-8 failed: timeout after 10s', async () => {
    vi.useFakeTimers();
    const { fetch, calls } = hangingFetch();
    const p = email(fetch);
    await vi.advanceTimersByTimeAsync(9_999);
    let settled = false;
    void p.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await p).toEqual({ outcome: 'failed', reason: 'timeout after 10s' });
    expect(calls).toHaveLength(1);
  });

  it('AC-8 failed without a request: RESEND_API_KEY not set', async () => {
    const { fetch, calls } = fakeFetch(() => jsonResponse({ id: 'x' }));
    expect(await email(fetch, {})).toEqual({ outcome: 'failed', reason: 'not configured (RESEND_API_KEY missing)' });
    expect(await email(fetch, { RESEND_API_KEY: '' })).toEqual({ outcome: 'failed', reason: 'not configured (RESEND_API_KEY missing)' });
    expect(calls).toHaveLength(0);
  });

  it('AC-8 failed without a request: no stored address', async () => {
    const { fetch, calls } = fakeFetch(() => jsonResponse({ id: 'x' }));
    expect(await email(fetch, { RESEND_API_KEY: KEY }, '')).toEqual({ outcome: 'failed', reason: 'no email address stored' });
    expect(calls).toHaveLength(0);
  });
});

const slack = (f: typeof fetch, url = HOOK) => sendSlack({ fetch: f, url, text: 'Natural disaster: Flood\n\nFlood' });

describe('M5 AC-9 Slack through the stored webhook', () => {
  it('AC-9 the request: POST to the webhook, JSON content type, {"text": ...}', async () => {
    const { fetch, calls } = fakeFetch(() => jsonResponse({ ok: true }));
    expect(await slack(fetch)).toEqual({ outcome: 'delivered' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(HOOK);
    expect(calls[0].init.method).toBe('POST');
    expect(new Headers(calls[0].init.headers).get('content-type')).toBe('application/json');
    expect(calls[0].init.body).toBe(JSON.stringify({ text: 'Natural disaster: Flood\n\nFlood' }));
    expect(calls[0].init.signal).toBeInstanceOf(AbortSignal);
  });

  it('AC-9 the plain body ok on HTTP 200 is delivered', async () => {
    const { fetch } = fakeFetch(() => new Response('ok', { status: 200, headers: { 'content-type': 'text/html' } }));
    expect(await slack(fetch)).toEqual({ outcome: 'delivered' });
  });

  const failures: { name: string; respond: () => Response | Promise<Response>; reason: string }[] = [
    { name: 'JSON ok false with an error', respond: () => jsonResponse({ ok: false, error: 'workflow_not_published' }, { status: 400 }), reason: 'HTTP 400 workflow_not_published' },
    { name: 'JSON ok false on a 200', respond: () => jsonResponse({ ok: false, error: 'invalid_token' }), reason: 'HTTP 200 invalid_token' },
    { name: 'non-2xx with a plain-text body', respond: () => new Response('no_service', { status: 404 }), reason: 'HTTP 404 no_service' },
    { name: 'a 429 with a plain body is failed, not retried', respond: () => new Response('rate_limited', { status: 429 }), reason: 'HTTP 429 rate_limited' },
    { name: 'non-2xx with an empty body', respond: () => new Response('', { status: 500 }), reason: 'HTTP 500 unexpected body' },
    { name: '200 with other JSON', respond: () => jsonResponse({ foo: 1 }), reason: 'HTTP 200 unexpected body' },
    { name: '200 with other text', respond: () => new Response('hello', { status: 200 }), reason: 'HTTP 200 unexpected body' },
    { name: '201 with ok', respond: () => new Response('ok', { status: 201 }), reason: 'HTTP 201 unexpected body' },
    { name: 'network error with a code', respond: () => Promise.reject(new TypeError('fetch failed', { cause: Object.assign(new Error('getaddrinfo'), { code: 'ENOTFOUND' }) })), reason: 'network error ENOTFOUND' },
  ];
  for (const c of failures) {
    it(`AC-9 failed: ${c.name}`, async () => {
      const { fetch, calls } = fakeFetch(c.respond);
      expect(await slack(fetch)).toEqual({ outcome: 'failed', reason: c.reason });
      expect(calls).toHaveLength(1);
    });
  }

  it('AC-9 failed: timeout after 10s', async () => {
    vi.useFakeTimers();
    const { fetch } = hangingFetch();
    const p = slack(fetch);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await p).toEqual({ outcome: 'failed', reason: 'timeout after 10s' });
  });

  it('AC-9 failed without a request: no stored webhook', async () => {
    const { fetch, calls } = fakeFetch(() => jsonResponse({ ok: true }));
    expect(await slack(fetch, '')).toEqual({ outcome: 'failed', reason: 'no Slack webhook stored' });
    expect(calls).toHaveLength(0);
  });
});
