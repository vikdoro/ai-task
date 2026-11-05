import { parseTicked, saveAlert } from '../../lib/alert.ts';
import { getPollContext } from '../../lib/runtime.ts';

// Body: { "email": boolean, "slack": boolean } (AC-11). A refusal is 400 with { reason }.
export default defineEventHandler(async (event) => {
  let body: unknown;
  try {
    body = await readBody(event);
  } catch {
    body = undefined;
  }
  const ticked = parseTicked(body);
  if (!ticked) {
    setResponseStatus(event, 400);
    return { reason: 'Send { "email": boolean, "slack": boolean }.' };
  }
  const result = await saveAlert((await getPollContext()).db, process.env, ticked);
  if (!result.ok) {
    setResponseStatus(event, 400);
    return { reason: result.reason };
  }
  return result.state;
});
