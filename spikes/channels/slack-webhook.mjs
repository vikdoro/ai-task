// Slack through the webhook in SLACK_WEBHOOK_URL (spec 02). No SDK: built-in fetch through ctx.request.
// Two kinds are read (P-118):
//   - Workflow Builder webhook (hooks.slack.com/triggers/...): answers JSON {"ok": true},
//     or {"ok": false, "error": "..."}. Its workflow needs a `text` variable.
//     https://slack.com/help/articles/360041352714-Build-a-workflow--Create-a-workflow-that-starts-outside-of-Slack
//   - classic incoming webhook (hooks.slack.com/services/...): answers the plain-text body `ok`.
//     https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks
// Both take a POST with the JSON body {"text": "..."}.

export const NAME = 'slack';
export const KEYS = ['SLACK_WEBHOOK_URL'];

export function buildRequest(env, msg) {
  return {
    method: 'POST',
    url: env.SLACK_WEBHOOK_URL,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: msg.text }),
  };
}

export async function send(ctx, env, msg) {
  const r = await ctx.request('slack-send', buildRequest(env, msg), 'txt');
  if (r.error) return { state: 'failed', detail: r.error };
  const body = r.text.trim();
  let json = null;
  try {
    json = JSON.parse(body);
  } catch {}
  const isObject = json !== null && typeof json === 'object';

  if (r.status === 200 && body === 'ok') return { state: 'delivered', detail: '(HTTP 200, body ok)' };
  if (r.status === 200 && isObject && json.ok === true) return { state: 'delivered', detail: '(HTTP 200, JSON ok: true)' };
  if (isObject && json.ok === false) return { state: 'failed', detail: `HTTP ${r.status} ${json.error ?? '(no error value)'}` };
  return { state: 'failed', detail: `HTTP ${r.status}: ${body.slice(0, 200).replace(/\s+/g, ' ') || '(empty body)'}` };
}
