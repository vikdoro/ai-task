// The server's single poll context: config from the environment and one open database.
import { parseDeliveryMode, parsePolling, resolveConfig, type Config, type DeliveryMode, type Polling } from './config.ts';
import { sweepInterrupted } from './delivery/store.ts';
import { openDb } from './storage/db.ts';
import type { PollContext } from './poll.ts';

let ctx: Promise<PollContext> | undefined;

/** Throws ModeError on a bad SOURCE_MODE. */
export function serverConfig(): Config {
  return resolveConfig(process.env);
}

/** Throws ModeError on a bad DELIVERY_MODE (M5 AC-14). */
export function serverDeliveryMode(): DeliveryMode {
  return parseDeliveryMode(process.env.DELIVERY_MODE);
}

/** Throws ModeError on a bad POLLING (M5 AC-15). */
export function serverPolling(env: Record<string, string | undefined> = process.env): Polling {
  return parsePolling(env.POLLING);
}

export function getPollContext(): Promise<PollContext> {
  ctx ??= (async () => {
    const config = serverConfig();
    const deliveryMode = serverDeliveryMode();
    const db = await openDb(config.dbPath);
    // A delivery left 'sending' by a process that stopped is failed, never resent (M5 AC-7).
    await sweepInterrupted(db);
    return { db, mode: config.mode, deliveryMode, samplesDir: config.samplesDir, env: process.env };
  })();
  return ctx;
}

/** What a scheduled task runs: its poll, or nothing with POLLING=off (M5 AC-15). */
export async function whenPolling<T>(poll: () => Promise<T>, env: Record<string, string | undefined> = process.env): Promise<{ result: T | 'polling off' }> {
  if (serverPolling(env) === 'off') return { result: 'polling off' };
  return { result: await poll() };
}
