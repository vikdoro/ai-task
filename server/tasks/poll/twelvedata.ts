import { pollSource } from '../../../lib/poll.ts';
import { getPollContext } from '../../../lib/runtime.ts';

export default defineTask({
  meta: { name: 'poll:twelvedata', description: 'Poll twelvedata once and record the check' },
  async run() {
    const result = await pollSource('twelvedata', await getPollContext());
    return { result };
  },
});
