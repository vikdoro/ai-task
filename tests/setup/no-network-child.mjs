// Loaded with `node --import` into child processes the tests spawn, so they cannot reach the network either.
globalThis.fetch = function blockedFetch() {
  throw new Error('network blocked in tests');
};
