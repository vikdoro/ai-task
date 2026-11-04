import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/no-network.ts'],
    testTimeout: 30_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
});
