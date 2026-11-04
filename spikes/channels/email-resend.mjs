// Email through Resend's HTTPS API (spec 02). No SDK: built-in fetch through ctx.request.
//   Send: POST https://api.resend.com/emails   https://resend.com/docs/api-reference/emails/send-email
// A "Sending access" key is enough. No status lookup after the send (P-121, D-58).

export const NAME = 'email';
export const KEYS = ['RESEND_API_KEY', 'DEMO_USER_EMAIL'];

const API = 'https://api.resend.com/emails';
const FROM = 'onboarding@resend.dev';

export function buildRequest(env, msg) {
  return {
    method: 'POST',
    url: API,
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [env.DEMO_USER_EMAIL], subject: msg.subject, text: msg.text }),
  };
}

// Resend errors come back as JSON with `name` and `message` (https://resend.com/docs/api-reference/errors).
function httpReason(r) {
  let name = '', message = '';
  try {
    const j = JSON.parse(r.text);
    name = j.name ?? '';
    message = j.message ?? '';
  } catch {
    message = r.text.slice(0, 200).replace(/\s+/g, ' ');
  }
  return `HTTP ${r.status}${name ? ` ${name}` : ''}${message ? `: ${message}` : ''}`;
}

// Delivered means accepted: a 2xx with an id. Nothing is checked after the send (P-121, D-58).
export async function send(ctx, env, msg) {
  const sent = await ctx.request('email-send', buildRequest(env, msg), 'json');
  if (sent.error) return { state: 'failed', detail: sent.error };
  if (!sent.ok) return { state: 'failed', detail: httpReason(sent) };
  let id;
  try {
    id = JSON.parse(sent.text).id;
  } catch {}
  if (!id) return { state: 'failed', detail: `HTTP ${sent.status} without an email id` };
  return { state: 'delivered', detail: `(accepted, id ${id})` };
}
