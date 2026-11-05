// Wording and formats shown on /admin (Q16).
import type { Source } from './config.ts';
import type { CheckRow } from './storage/store.ts';
import type { Channel, DeliveryOutcome } from './delivery/store.ts';

export const SOURCE_LABELS: Record<Source, string> = {
  gdacs: 'GDACS',
  twelvedata: 'Twelve Data',
  eventregistry: 'Event Registry',
};

export const KIND_LABELS: Record<string, string> = {
  news: 'Breaking news',
  market: 'Market movement',
  disaster: 'Natural disaster',
};

/** ISO time as `YYYY-MM-DD HH:MM:SS UTC`. A day-only value (news) stays `YYYY-MM-DD`. */
export function formatUtc(value: string | null): string {
  if (!value) return '';
  if (/^\d{4}-\d\d-\d\d$/.test(value)) return value;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return value;
  return `${new Date(t).toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

/** The status line for a source from its latest check (AC-20, AC-21). */
export function statusLine(source: Source, latest: CheckRow | undefined, lastSuccess: string | null): string {
  const name = SOURCE_LABELS[source];
  if (!latest) return `${name}: not checked yet`;
  switch (latest.outcome) {
    case 'ok': {
      let line = `${name}: last checked ${formatUtc(latest.checked_at)}`;
      // The ok detail is "<n> items, <m> made the cut", then ". <symbol>: <error>" per failed symbol.
      const cut = latest.detail.indexOf('. ');
      if (source === 'twelvedata' && cut !== -1) line += latest.detail.slice(cut);
      return line;
    }
    case 'failed':
      return `${name} could not be reached: ${latest.detail}. Last success: ${lastSuccess ? formatUtc(lastSuccess) : 'never'}.`;
    case 'not configured':
      return `${name}: not configured (API key missing).`;
    case 'paused':
      return `${name}: paused: token floor reached.`;
  }
}

/** The Alert column of Alerts fired (M5 AC-19). */
export function alertLabel(sent: boolean, reason: string): string {
  return sent ? 'Sent' : `Not sent: ${reason}`;
}

/** The Email and Slack columns of Alerts fired (M5 AC-20). `delivery` is null when the channel has no row. */
export function deliveryLabel(channel: Channel, sent: boolean, delivery: { outcome: DeliveryOutcome; detail: string } | null): string {
  if (!sent) return '';
  if (!delivery) return 'Not picked';
  switch (delivery.outcome) {
    case 'sending':
      return 'Sending';
    case 'failed':
      return `Failed: ${delivery.detail}`;
    case 'delivered':
      if (delivery.detail === 'fake: not sent') return 'Delivered (fake: not sent)';
      return channel === 'email' ? 'Delivered (accepted by Resend)' : 'Delivered';
  }
}
