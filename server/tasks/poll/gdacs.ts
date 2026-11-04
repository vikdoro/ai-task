import { pollSource } from '../../../lib/poll.ts';
import { getPollContext } from '../../../lib/runtime.ts';

export default defineTask({
  meta: { name: 'poll:gdacs', description: 'Poll gdacs once and record the check' },
  async run() {
    const result = await pollSource('gdacs', await getPollContext());
    return { result };
  },
});
