// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  telemetry: false,
  // Local only: `nuxt dev` binds to localhost. The built server gets HOST=127.0.0.1 PORT=3000 from `npm start`.
  devServer: { host: '127.0.0.1', port: 3000 },
  nitro: {
    experimental: { tasks: true },
    // Polling schedules (AC-11). Intervals match INTERVAL_MINUTES in lib/config.ts.
    scheduledTasks: {
      '*/10 * * * *': ['poll:gdacs'],
      '*/15 * * * *': ['poll:twelvedata'],
      '0 * * * *': ['poll:eventregistry'],
    },
  },
});
