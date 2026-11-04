// At server start: refuse a bad SOURCE_MODE, then poll each source that is due (AC-11, AC-15).
// The recurring polls are the scheduled tasks in nuxt.config.ts.
import { ModeError } from '../../lib/config.ts';
import { pollSource, sourcesDueAtStartup } from '../../lib/poll.ts';
import { getPollContext, serverConfig } from '../../lib/runtime.ts';

export default defineNitroPlugin(() => {
  try {
    serverConfig();
  } catch (err) {
    if (err instanceof ModeError) {
      console.error(err.message);
      process.exit(2);
    }
    throw err;
  }

  void (async () => {
    const ctx = await getPollContext();
    const due = await sourcesDueAtStartup(ctx.db, new Date());
    await Promise.all(
      due.map(async (source) => {
        const r = await pollSource(source, ctx);
        console.log(`[poll] ${r.source} ${r.outcome} ${r.detail}`);
      }),
    );
  })().catch((err) => console.error('[poll] startup poll failed:', err));
});
