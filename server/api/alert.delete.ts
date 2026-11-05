import { deleteAlert } from '../../lib/alert.ts';
import { getPollContext } from '../../lib/runtime.ts';

export default defineEventHandler(async () => deleteAlert((await getPollContext()).db, process.env));
