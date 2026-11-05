// Matching events that made the cut against the demo user's alert, once each, and sending them (M5 AC-1 to AC-10, AC-14).
import { getStoredAlert, type StoredAlert } from '../alert.ts';
import type { DeliveryMode } from '../config.ts';
import type { Db } from '../storage/db.ts';
import type { EventRow } from '../storage/store.ts';
import { redactResendKey, sendEmail, type SendResult } from './email.ts';
import { buildMessage, systemTimeZone, type Message } from './message.ts';
import { sendSlack } from './slack.ts';
import { CHANNELS, FAKE_DETAIL, claimUnmatched, finishDelivery, type Channel, type Decision } from './store.ts';

export interface MatchOptions {
  db: Db;
  mode: DeliveryMode;
  env: Record<string, string | undefined>;
  fetch?: typeof fetch;
  now?: () => Date;
  /** For the message times; the system zone by default (AC-12). */
  timeZone?: string;
}

export interface ChannelResult {
  outcome: 'delivered' | 'failed';
  detail: string;
}

/** One event matched by this run. A channel is null when it was not sent to. */
export interface Fired {
  kind: string;
  sourceId: string;
  sent: boolean;
  reason: string;
  email: ChannelResult | null;
  slack: ChannelResult | null;
}

export interface MatchResult {
  fired: Fired[];
}

/** Sends on one channel are at least this far apart in live mode (Q6). */
export const SEND_SPACING_MS = 1000;
export const MAX_DETAIL = 300;

/** AC-2: the first rule that applies wins. */
export function decide(alert: StoredAlert | null, event: Pick<EventRow, 'cleared_at'>): Decision {
  if (!alert) return { sent: false, reason: 'no alert set up', channels: [] };
  if (!event.cleared_at || Date.parse(event.cleared_at) < Date.parse(alert.createdAt)) return { sent: false, reason: 'made the cut before the alert was set up', channels: [] };
  const channels = CHANNELS.filter((c) => (c === 'email' ? alert.email : alert.slack));
  if (channels.length === 0) return { sent: false, reason: 'no channels picked', channels: [] };
  return { sent: true, reason: '', channels };
}

// Sends on one channel run one after another in this process, at least SEND_SPACING_MS apart in live mode.
const lanes: Record<Channel, Promise<unknown>> = { email: Promise.resolve(), slack: Promise.resolve() };
const lastStart: Record<Channel, number> = { email: -Infinity, slack: -Infinity };

function inLane<T>(channel: Channel, spaced: boolean, fn: () => Promise<T>): Promise<T> {
  const run = lanes[channel]
    .catch(() => {})
    .then(async () => {
      if (spaced) {
        const wait = lastStart[channel] + SEND_SPACING_MS - Date.now();
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        lastStart[channel] = Date.now();
      }
      return fn();
    });
  lanes[channel] = run;
  return run;
}

/** AC-10: no contact value or key in a stored reason, and at most 300 characters. */
function clean(reason: string, alert: StoredAlert, env: Record<string, string | undefined>): string {
  let out = reason;
  if (alert.emailAddress) out = out.split(alert.emailAddress).join('<email>');
  if (alert.slackWebhookUrl) out = out.split(alert.slackWebhookUrl).join('<webhook>');
  out = redactResendKey(out, env);
  return out.length > MAX_DETAIL ? out.slice(0, MAX_DETAIL) : out;
}

/**
 * Gives every made-cut event with no alerts_fired row its row, decided from the alert as it is now, then sends
 * the sent ones to each ticked channel once (AC-1 to AC-6). Resolves when every send has ended.
 */
export async function matchAlerts(opts: MatchOptions): Promise<MatchResult> {
  const now = () => (opts.now?.() ?? new Date()).toISOString();
  const alert = await getStoredAlert(opts.db);
  const claims = await claimUnmatched(opts.db, (event) => decide(alert, event), now());
  const fired: Fired[] = claims.map((c) => ({ kind: c.event.kind, sourceId: c.event.source_id, sent: c.sent, reason: c.reason, email: null, slack: null }));
  if (!alert) return { fired };

  const timeZone = opts.timeZone ?? systemTimeZone();
  const fetchImpl = opts.fetch ?? globalThis.fetch;
  const sends: Promise<void>[] = [];
  claims.forEach((claim, i) => {
    if (!claim.sent) return;
    const message = buildMessage(claim.event, timeZone);
    for (const channel of claim.channels) {
      sends.push(
        inLane(channel, opts.mode === 'live', async () => {
          const r = await send(opts, fetchImpl, alert, channel, message);
          const detail = r.outcome === 'delivered' ? (opts.mode === 'fake' ? FAKE_DETAIL : '') : clean(r.reason, alert, opts.env);
          const emailId = r.outcome === 'delivered' ? (r.emailId ?? null) : null;
          await finishDelivery(opts.db, claim.event.kind, claim.event.source_id, channel, r.outcome, detail, emailId, now());
          fired[i]![channel] = { outcome: r.outcome, detail };
        }),
      );
    }
  });
  await Promise.all(sends);
  return { fired };
}

async function send(opts: MatchOptions, fetchImpl: typeof fetch, alert: StoredAlert, channel: Channel, message: Message): Promise<SendResult> {
  if (opts.mode === 'fake') return { outcome: 'delivered' };
  try {
    if (channel === 'email') return await sendEmail({ fetch: fetchImpl, env: opts.env, to: alert.emailAddress, subject: message.subject, text: message.emailText });
    return await sendSlack({ fetch: fetchImpl, url: alert.slackWebhookUrl, text: message.slackText });
  } catch (err) {
    // A sender never throws on purpose; anything that does is recorded, not retried.
    return { outcome: 'failed', reason: `error ${err instanceof Error ? err.message : String(err)}` };
  }
}
