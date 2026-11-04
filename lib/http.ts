// One HTTP attempt with a timeout, and the retry rule of AC-13.
// Timers are plain setTimeout so tests can drive them with fake timers.

export type Attempt =
  | { kind: 'response'; status: number; text: string; headers: Headers }
  | { kind: 'network'; message: string }
  | { kind: 'timeout'; seconds: number };

export const RETRY_DELAY_MS = 5000;

export async function attempt(fetchImpl: typeof fetch, url: string, init: RequestInit, timeoutSeconds: number): Promise<Attempt> {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Attempt>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error('timeout'));
      resolve({ kind: 'timeout', seconds: timeoutSeconds });
    }, timeoutSeconds * 1000);
  });
  const request = (async (): Promise<Attempt> => {
    try {
      const res = await fetchImpl(url, { ...init, signal: controller.signal });
      const text = await res.text();
      return { kind: 'response', status: res.status, text, headers: res.headers };
    } catch (err) {
      if (timedOut) return { kind: 'timeout', seconds: timeoutSeconds };
      const e = err as Error & { cause?: { code?: string; message?: string } };
      const cause = e.cause?.code ?? e.cause?.message;
      return { kind: 'network', message: cause ? `${e.message} (${cause})` : String(e.message ?? err) };
    }
  })();
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const retryable = (a: Attempt) => a.kind !== 'response' || a.status >= 500;

/** Makes the request, and with `retry` one more attempt 5 s later after a network error, a timeout or a 5xx. */
export async function request(fetchImpl: typeof fetch, url: string, init: RequestInit, timeoutSeconds: number, retry: boolean): Promise<Attempt> {
  const first = await attempt(fetchImpl, url, init, timeoutSeconds);
  if (!retry || !retryable(first)) return first;
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  return attempt(fetchImpl, url, init, timeoutSeconds);
}

/** The failure reason for an attempt that did not yield a usable 2xx, or null if it did. */
export function transportFailure(a: Attempt): string | null {
  if (a.kind === 'network') return `network error: ${a.message}`;
  if (a.kind === 'timeout') return `timeout after ${a.seconds} s`;
  if (a.status < 200 || a.status > 299) return `HTTP ${a.status}`;
  return null;
}
