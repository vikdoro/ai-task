import { pollSource } from '../../../lib/poll.ts';
import { getPollContext, whenPolling } from '../../../lib/runtime.ts';

export default defineTask({
  meta: { name: 'poll:gdacs', description: 'Poll gdacs once and record the check, unless POLLING=off' },
  run() {
    return whenPolling(async () => pollSource('gdacs', await getPollContext()));
  },
});
