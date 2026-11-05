// The alert lines poll:once prints (M5 AC-16). No contact value and no message text.
import { KIND_LABELS } from '../format.ts';
import type { ChannelResult, Fired } from './match.ts';

function outcome(r: ChannelResult | null): string {
  if (!r) return 'not picked';
  return r.outcome === 'delivered' ? 'delivered' : `failed: ${r.detail}`;
}

/** `alert sent <Kind label> <source ID>: email <outcome>, slack <outcome>`, for an event sent by this run. */
export function formatAlertLine(f: Fired): string {
  return `alert sent ${KIND_LABELS[f.kind] ?? f.kind} ${f.sourceId}: email ${outcome(f.email)}, slack ${outcome(f.slack)}`;
}

export function formatAlertSummary(fired: Fired[]): string {
  const sent = fired.filter((f) => f.sent).length;
  return `alerts: ${sent} sent, ${fired.length - sent} not sent`;
}
