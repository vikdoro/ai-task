import { getAlertState } from '../../lib/alert.ts';
import { getPollContext } from '../../lib/runtime.ts';

export default defineEventHandler(async () => getAlertState((await getPollContext()).db, process.env));
