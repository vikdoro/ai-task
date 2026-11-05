// Email through Resend (M5 AC-8). The only module that names RESEND_API_KEY and the Resend API.
import { isObject, parseJson, post } from './post.ts';

export const RESEND_URL = 'https://api.resend.com/emails';
export const EMAIL_FROM = 'World event alerts <onboarding@resend.dev>';

export type SendResult = { outcome: 'delivered'; emailId?: string } | { outcome: 'failed'; reason: string };

export interface EmailInput {
  fetch: typeof fetch;
  env: Record<string, string | undefined>;
  /** The stored address. */
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(input: EmailInput): Promise<SendResult> {
  const key = input.env.RESEND_API_KEY;
  if (!key) return { outcome: 'failed', reason: 'not configured (RESEND_API_KEY missing)' };
  if (!input.to) return { outcome: 'failed', reason: 'no email address stored' };
  const r = await post(
    input.fetch,
    RESEND_URL,
    { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    JSON.stringify({ from: EMAIL_FROM, to: input.to, subject: input.subject, text: input.text }),
  );
  if (r.kind === 'failed') return { outcome: 'failed', reason: r.reason };
  const body = parseJson(r.text);
  if (r.status >= 200 && r.status <= 299) {
    if (isObject(body) && typeof body.id === 'string' && body.id) return { outcome: 'delivered', emailId: body.id };
    return { outcome: 'failed', reason: `HTTP ${r.status} unexpected body` };
  }
  if (isObject(body) && typeof body.name === 'string' && typeof body.message === 'string') return { outcome: 'failed', reason: `HTTP ${r.status} ${body.name}: ${body.message}` };
  return { outcome: 'failed', reason: `HTTP ${r.status}` };
}

/** Replaces the Resend key's value with its name, for every stored reason (AC-10). */
export function redactResendKey(text: string, env: Record<string, string | undefined>): string {
  const key = env.RESEND_API_KEY;
  return key ? text.split(key).join('<RESEND_API_KEY>') : text;
}
