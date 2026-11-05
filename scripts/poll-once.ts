// npm run poll:once: poll each source once in the current SOURCE_MODE and print one line per source,
// then one line per alert sent by this run and a summary (M5 AC-16). DELIVERY_MODE picks fake or live sending.
// Exit 0 if no source failed, 1 if any failed, 2 on a bad SOURCE_MODE or DELIVERY_MODE. POLLING is ignored.
import { ModeError, SOURCES, parseDeliveryMode, resolveConfig } from '../lib/config.ts';
import type { Fired } from '../lib/delivery/match.ts';
import { formatAlertLine, formatAlertSummary } from '../lib/delivery/report.ts';
import { sweepInterrupted } from '../lib/delivery/store.ts';
import { formatPollLine, pollSource } from '../lib/poll.ts';
import { openDb } from '../lib/storage/db.ts';

let config;
let deliveryMode;
try {
  config = resolveConfig(process.env);
  deliveryMode = parseDeliveryMode(process.env.DELIVERY_MODE);
} catch (err) {
  if (err instanceof ModeError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}

const db = await openDb(config.dbPath);
// A delivery left 'sending' by a process that stopped is failed, never resent (M5 AC-7).
await sweepInterrupted(db);
const ctx = { db, mode: config.mode, deliveryMode, samplesDir: config.samplesDir, env: process.env };
let failed = false;
const fired: Fired[] = [];
for (const source of SOURCES) {
  const result = await pollSource(source, ctx);
  if (result.outcome === 'failed') failed = true;
  fired.push(...(result.alerts?.fired ?? []));
  console.log(formatPollLine(result));
}
for (const f of fired) if (f.sent) console.log(formatAlertLine(f));
console.log(formatAlertSummary(fired));
await db.dispose();
process.exit(failed ? 1 : 0);
