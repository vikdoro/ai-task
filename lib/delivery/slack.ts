// Slack through the stored webhook URL (M5 AC-9).
import type { SendResult } from './email.ts';
import { isObject, parseJson, post } from './post.ts';

export interface SlackInput {
  fetch: typeof fetch;
  /** The stored webhook URL. */
  url: string;
  text: string;
}

export async function sendSlack(input: SlackInput): Promise<SendResult> {
  if (!input.url) return { outcome: 'failed', reason: 'no Slack webhook stored' };
  const r = await post(input.fetch, input.url, { 'content-type': 'application/json' }, JSON.stringify({ text: input.text }));
  if (r.kind === 'failed') return { outcome: 'failed', reason: r.reason };
  const body = parseJson(r.text);
  if (r.status === 200 && ((isObject(body) && body.ok === true) || r.text.trim() === 'ok')) return { outcome: 'delivered' };
  if (isObject(body) && body.ok === false && typeof body.error === 'string') return { outcome: 'failed', reason: `HTTP ${r.status} ${body.error}` };
  const plain = r.text.trim();
  if ((r.status < 200 || r.status > 299) && body === undefined && plain) return { outcome: 'failed', reason: `HTTP ${r.status} ${plain}` };
  return { outcome: 'failed', reason: `HTTP ${r.status} unexpected body` };
}
