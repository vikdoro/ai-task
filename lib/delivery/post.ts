// One POST with a 10-second timeout, for the senders. No retry (DEC-20).
// Timers are plain setTimeout so tests can drive them with fake timers.

export const SEND_TIMEOUT_SECONDS = 10;

export type PostResult = { kind: 'response'; status: number; text: string } | { kind: 'failed'; reason: string };

export async function post(fetchImpl: typeof fetch, url: string, headers: Record<string, string>, body: string): Promise<PostResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<PostResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort(new Error('timeout'));
      resolve({ kind: 'failed', reason: `timeout after ${SEND_TIMEOUT_SECONDS}s` });
    }, SEND_TIMEOUT_SECONDS * 1000);
  });
  const request = (async (): Promise<PostResult> => {
    try {
      const res = await fetchImpl(url, { method: 'POST', headers, body, signal: controller.signal });
      return { kind: 'response', status: res.status, text: await res.text() };
    } catch (err) {
      if (controller.signal.aborted) return { kind: 'failed', reason: `timeout after ${SEND_TIMEOUT_SECONDS}s` };
      return { kind: 'failed', reason: `network error ${networkCause(err)}` };
    }
  })();
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** The error code when there is one, else the message. */
function networkCause(err: unknown): string {
  const e = err as { code?: unknown; message?: unknown; cause?: { code?: unknown; message?: unknown } } | null;
  const code = e?.cause?.code ?? e?.code;
  if (typeof code === 'string' && code) return code;
  return String(e?.message ?? err);
}

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
