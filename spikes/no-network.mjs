// Offline guard for verifying spikes: node --import ./spikes/no-network.mjs spikes/send-test.mjs
// Replaces fetch with one that throws, so no request can leave the machine.
globalThis.fetch = function blockedFetch() {
  throw new Error('network blocked by no-network.mjs');
};
