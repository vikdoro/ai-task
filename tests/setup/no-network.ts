// AC-26: the test suite runs with outbound network blocked. Only localhost and 127.0.0.1 are allowed,
// so the @nuxt/test-utils $fetch calls to the test server still work.
const realFetch = globalThis.fetch;
const ALLOWED = new Set(['localhost', '127.0.0.1']);

function hostOf(input: unknown): string | null {
  try {
    const url = input instanceof Request ? input.url : input instanceof URL ? input.href : String(input);
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

globalThis.fetch = function guardedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const host = hostOf(input);
  if (host === null || !ALLOWED.has(host)) throw new Error('network blocked in tests');
  return realFetch(input, init);
} as typeof fetch;
