import { pollSource } from '../../../lib/poll.ts';
import { getPollContext, whenPolling } from '../../../lib/runtime.ts';

export default defineTask({
  meta: { name: 'poll:twelvedata', description: 'Poll twelvedata once and record the check, unless POLLING=off' },
  run() {
    return whenPolling(async () => pollSource('twelvedata', await getPollContext()));
  },
});
