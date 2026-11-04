import { pollSource } from '../../../lib/poll.ts';
import { getPollContext } from '../../../lib/runtime.ts';

export default defineTask({
  meta: { name: 'poll:eventregistry', description: 'Poll eventregistry once and record the check' },
  async run() {
    const result = await pollSource('eventregistry', await getPollContext());
    return { result };
  },
});
