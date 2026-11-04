import { getAdminSources } from '../../../lib/admin.ts';
import { getPollContext } from '../../../lib/runtime.ts';

export default defineEventHandler(async () => getAdminSources((await getPollContext()).db));
