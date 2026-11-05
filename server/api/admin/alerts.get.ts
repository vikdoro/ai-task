import { getAdminAlerts } from '../../../lib/admin.ts';
import { getPollContext } from '../../../lib/runtime.ts';

export default defineEventHandler(async () => getAdminAlerts((await getPollContext()).db));
