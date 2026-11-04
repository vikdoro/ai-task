import { getAdminEvents } from '../../../lib/admin.ts';
import { getPollContext } from '../../../lib/runtime.ts';

export default defineEventHandler(async () => getAdminEvents((await getPollContext()).db));
