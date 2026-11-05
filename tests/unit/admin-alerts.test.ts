import { afterEach, describe, expect, it } from 'vitest';
import { getAdminAlerts } from '../../lib/admin.ts';
import { alertLabel, deliveryLabel } from '../../lib/format.ts';
import type { Db } from '../../lib/storage/db.ts';
import { recordPoll } from '../../lib/storage/store.ts';
import type { ParsedEvent } from '../../lib/sources/types.ts';
import { cleanupTmp, tmpDb } from '../helpers.ts';

afterEach(cleanupTmp);

const ev = (sourceId: string, over: Partial<ParsedEvent> = {}): ParsedEvent => ({
  kind: 'disaster',
  sourceId,
  what: `What ${sourceId}`,
  where: 'p',
  sourceTime: '2026-11-04T00:00:00.000Z',
  measure: 'm',
  current: true,
  madeCut: true,
  raw: {},
  ...over,
});

async function fire(db: Db, e: ParsedEvent, clearedAt: string, sent: boolean, reason: string, channels: [string, string, string][] = []) {
  await recordPoll(db, { source: 'gdacs', checkedAt: clearedAt, outcome: 'ok', detail: '', events: [e] });
  await db.prepare('INSERT INTO alerts_fired (kind, source_id, matched_at, sent, reason) VALUES (?, ?, ?, ?, ?)').run(e.kind, e.sourceId, clearedAt, sent ? 1 : 0, reason);
  for (const [channel, outcome, detail] of channels)
    await db.prepare("INSERT INTO deliveries (kind, source_id, channel, outcome, detail, started_at) VALUES (?, ?, ?, ?, ?, '2026-11-04T00:00:00.000Z')").run(e.kind, e.sourceId, channel, outcome, detail);
}

describe('M5 AC-18 Alerts fired data', () => {
  it('AC-18 with no rows: total 0 and No alerts fired yet.', async () => {
    const { db } = await tmpDb();
    await recordPoll(db, { source: 'gdacs', checkedAt: '2026-11-04T00:00:00.000Z', outcome: 'ok', detail: '', events: [ev('unmatched')] });
    expect(await getAdminAlerts(db)).toEqual({ total: 0, shown: 0, countLine: 'No alerts fired yet.', rows: [] });
  });

  it('AC-18 rows newest first by cleared_at, then source time; UTC times and kind labels', async () => {
    const { db } = await tmpDb();
    await fire(db, ev('old'), '2026-11-04T01:00:00.000Z', false, 'no alert set up');
    await fire(db, ev('new-early', { sourceTime: '2026-11-04T00:00:00.000Z' }), '2026-11-04T03:00:00.000Z', false, 'no alert set up');
    await fire(db, ev('SPY 2026-11-04', { kind: 'market', what: 'SPDR (SPY)', sourceTime: '2026-11-04T02:00:00.000Z' }), '2026-11-04T03:00:00.000Z', false, 'no alert set up');
    const view = await getAdminAlerts(db);
    expect(view.countLine).toBe('Showing 3 of 3 alerts fired, newest first.');
    expect(view.rows.map((r) => r.sourceId)).toEqual(['SPY 2026-11-04', 'new-early', 'old']);
    expect(view.rows[0]).toEqual({ clearedAt: '2026-11-04 03:00:00 UTC', kind: 'Market movement', what: 'SPDR (SPY)', alert: 'Not sent: no alert set up', email: '', slack: '', sourceId: 'SPY 2026-11-04' });
  });

  it('AC-18 at most 200 rows are shown, with the total', async () => {
    const { db } = await tmpDb();
    const events = Array.from({ length: 203 }, (_, i) => ev(`e-${i}`));
    await recordPoll(db, { source: 'gdacs', checkedAt: '2026-11-04T00:00:00.000Z', outcome: 'ok', detail: '', events });
    for (const e of events) await db.prepare("INSERT INTO alerts_fired (kind, source_id, matched_at, sent, reason) VALUES (?, ?, 'x', 0, 'no alert set up')").run(e.kind, e.sourceId);
    const view = await getAdminAlerts(db);
    expect(view.rows).toHaveLength(200);
    expect(view.total).toBe(203);
    expect(view.countLine).toBe('Showing 200 of 203 alerts fired, newest first.');
  });
});

describe('M5 AC-19 AC-20 the Alert, Email and Slack columns', () => {
  it('AC-19 the four Alert values', () => {
    expect(alertLabel(true, '')).toBe('Sent');
    expect(alertLabel(false, 'no alert set up')).toBe('Not sent: no alert set up');
    expect(alertLabel(false, 'no channels picked')).toBe('Not sent: no channels picked');
    expect(alertLabel(false, 'made the cut before the alert was set up')).toBe('Not sent: made the cut before the alert was set up');
  });

  it('AC-20 the delivery labels per channel', () => {
    expect(deliveryLabel('email', true, { outcome: 'delivered', detail: '' })).toBe('Delivered (accepted by Resend)');
    expect(deliveryLabel('slack', true, { outcome: 'delivered', detail: '' })).toBe('Delivered');
    expect(deliveryLabel('email', true, { outcome: 'delivered', detail: 'fake: not sent' })).toBe('Delivered (fake: not sent)');
    expect(deliveryLabel('slack', true, { outcome: 'delivered', detail: 'fake: not sent' })).toBe('Delivered (fake: not sent)');
    expect(deliveryLabel('email', true, { outcome: 'failed', detail: 'HTTP 422 validation_error: x' })).toBe('Failed: HTTP 422 validation_error: x');
    expect(deliveryLabel('slack', true, { outcome: 'failed', detail: 'interrupted, outcome unknown' })).toBe('Failed: interrupted, outcome unknown');
    expect(deliveryLabel('email', true, { outcome: 'sending', detail: '' })).toBe('Sending');
    expect(deliveryLabel('slack', true, null)).toBe('Not picked');
    expect(deliveryLabel('email', false, null)).toBe('');
  });

  it('AC-20 rows combine the alert and both channels', async () => {
    const { db } = await tmpDb();
    await fire(db, ev('a'), '2026-11-04T05:00:00.000Z', true, '', [
      ['email', 'delivered', ''],
      ['slack', 'failed', 'HTTP 404 no_service'],
    ]);
    await fire(db, ev('b'), '2026-11-04T04:00:00.000Z', true, '', [['slack', 'sending', '']]);
    await fire(db, ev('c'), '2026-11-04T03:00:00.000Z', false, 'no channels picked');
    const rows = (await getAdminAlerts(db)).rows.map((r) => [r.sourceId, r.alert, r.email, r.slack]);
    expect(rows).toEqual([
      ['a', 'Sent', 'Delivered (accepted by Resend)', 'Failed: HTTP 404 no_service'],
      ['b', 'Sent', 'Not picked', 'Sending'],
      ['c', 'Not sent: no channels picked', '', ''],
    ]);
  });
});
