import { defineConfig } from 'vitest/config';
import { defineVitestProject } from '@nuxt/test-utils/config';

// Shared by both projects. The network-blocking setup file applies to every test.
const shared = {
  setupFiles: ['tests/setup/no-network.ts'],
  testTimeout: 30_000,
  hookTimeout: 300_000,
};

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      // Unit and end-to-end tests: plain Node, as in M3.
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: ['**/node_modules/**', 'tests/component/**'],
          ...shared,
        },
      },
      // Component tests (M4 AC-17): the Nuxt environment, with happy-dom as the DOM.
      await defineVitestProject({
        test: {
          name: 'component',
          environment: 'nuxt',
          include: ['tests/component/**/*.test.ts'],
          environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } },
          ...shared,
        },
      }),
    ],
  },
});
