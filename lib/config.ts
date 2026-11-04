import { resolve } from 'node:path';

export const SOURCES = ['gdacs', 'twelvedata', 'eventregistry'] as const;
export type Source = (typeof SOURCES)[number];

/** Polling interval per source, in minutes (AC-11). The cron schedules in nuxt.config.ts match these. */
export const INTERVAL_MINUTES: Record<Source, number> = { gdacs: 10, twelvedata: 15, eventregistry: 60 };

/** Request timeout per source, in seconds (AC-12). */
export const TIMEOUT_SECONDS: Record<Source, number> = { gdacs: 30, twelvedata: 30, eventregistry: 60 };

export type Mode = 'samples' | 'live';

export interface Config {
  mode: Mode;
  samplesDir: string;
  dbPath: string;
}

export class ModeError extends Error {}

export function parseMode(value: string | undefined): Mode {
  if (value === undefined || value === '' || value === 'samples') return 'samples';
  if (value === 'live') return 'live';
  throw new ModeError(`SOURCE_MODE must be "samples" or "live" (got "${value}")`);
}

export function resolveConfig(env: Record<string, string | undefined>, cwd: string = process.cwd()): Config {
  const mode = parseMode(env.SOURCE_MODE);
  const samplesDir = env.SAMPLES_DIR ? resolve(cwd, env.SAMPLES_DIR) : resolve(cwd, 'spikes/samples');
  const dbPath = env.DB_PATH ? resolve(cwd, env.DB_PATH) : resolve(cwd, mode === 'live' ? 'data/app.db' : 'data/samples.db');
  return { mode, samplesDir, dbPath };
}
