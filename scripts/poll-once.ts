// npm run poll:once: poll each source once in the current SOURCE_MODE and print one line per source.
// Exit 0 if no source failed, 1 if any failed, 2 on a bad SOURCE_MODE.
import { ModeError, SOURCES, resolveConfig } from '../lib/config.ts';
import { formatPollLine, pollSource } from '../lib/poll.ts';
import { openDb } from '../lib/storage/db.ts';

let config;
try {
  config = resolveConfig(process.env);
} catch (err) {
  if (err instanceof ModeError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}

const db = await openDb(config.dbPath);
const ctx = { db, mode: config.mode, samplesDir: config.samplesDir, env: process.env };
let failed = false;
for (const source of SOURCES) {
  const result = await pollSource(source, ctx);
  if (result.outcome === 'failed') failed = true;
  console.log(formatPollLine(result));
}
await db.dispose();
process.exit(failed ? 1 : 0);
