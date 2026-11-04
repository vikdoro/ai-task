// The server's single poll context: config from the environment and one open database.
import { resolveConfig, type Config } from './config.ts';
import { openDb } from './storage/db.ts';
import type { PollContext } from './poll.ts';

let ctx: Promise<PollContext> | undefined;

/** Throws ModeError on a bad SOURCE_MODE. */
export function serverConfig(): Config {
  return resolveConfig(process.env);
}

export function getPollContext(): Promise<PollContext> {
  ctx ??= (async () => {
    const config = serverConfig();
    return { db: await openDb(config.dbPath), mode: config.mode, samplesDir: config.samplesDir, env: process.env };
  })();
  return ctx;
}
