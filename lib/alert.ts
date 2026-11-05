// The user's one alert: its rules and its storage (M4 AC-1 to AC-13).
// This is the only module that names the contact keys. The Slack webhook URL never leaves it.
import type { Db } from './storage/db.ts';

export type Env = Record<string, string | undefined>;

export interface Ticked {
  email: boolean;
  slack: boolean;
}

/** What the user routes return. No times, no webhook URL. */
export interface AlertState {
  exists: boolean;
  email: { ticked: boolean; available: boolean; address: string | null };
  slack: { ticked: boolean; available: boolean };
}

export type SaveResult = { ok: true; state: AlertState } | { ok: false; reason: string };

export const PICK_ONE = 'Pick at least one channel.';
export const EMAIL_NOT_SET_UP = 'Email is not set up.';
export const SLACK_NOT_SET_UP = 'Slack is not set up.';

interface AlertRow {
  email: 0 | 1;
  slack: 0 | 1;
  email_address: string;
  slack_webhook_url: string;
  created_at: string;
  updated_at: string;
}

/** A key counts as set only when it holds a non-empty value. */
function contacts(env: Env): { email: string; hook: string } {
  return { email: env.DEMO_USER_EMAIL ?? '', hook: env.SLACK_WEBHOOK_URL ?? '' };
}

async function readRow(db: Db): Promise<AlertRow | null> {
  const row = await db.prepare('SELECT email, slack, email_address, slack_webhook_url, created_at, updated_at FROM alert WHERE id = 1').get();
  return (row as AlertRow | undefined) ?? null;
}

function toState(row: AlertRow | null, env: Env): AlertState {
  const c = contacts(env);
  // The address shown is the stored one, or else the environment's (AC-10).
  const address = row?.email_address || c.email || null;
  return {
    exists: row !== null,
    // Available when the key is set or the alert holds a stored value (AC-6).
    email: { ticked: row?.email === 1, available: address !== null, address },
    slack: { ticked: row?.slack === 1, available: Boolean(row?.slack_webhook_url || c.hook) },
  };
}

/** Accepts exactly `{ email: boolean, slack: boolean }`; anything else is null (AC-11). */
export function parseTicked(body: unknown): Ticked | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const keys = Object.keys(body).sort();
  if (keys.length !== 2 || keys[0] !== 'email' || keys[1] !== 'slack') return null;
  const { email, slack } = body as Record<string, unknown>;
  if (typeof email !== 'boolean' || typeof slack !== 'boolean') return null;
  return { email, slack };
}

export async function getAlertState(db: Db, env: Env): Promise<AlertState> {
  return toState(await readRow(db), env);
}

/** Setup when no alert exists, a change when one does (AC-3 to AC-9). A refusal writes nothing. */
export async function saveAlert(db: Db, env: Env, ticked: Ticked, now: Date = new Date()): Promise<SaveResult> {
  const row = await readRow(db);
  const state = toState(row, env);
  if (ticked.email && !state.email.available) return { ok: false, reason: EMAIL_NOT_SET_UP };
  if (ticked.slack && !state.slack.available) return { ok: false, reason: SLACK_NOT_SET_UP };
  if (!row && !ticked.email && !ticked.slack) return { ok: false, reason: PICK_ONE };

  const c = contacts(env);
  const emailAddress = c.email || row?.email_address || '';
  const hook = c.hook || row?.slack_webhook_url || '';
  const at = now.toISOString();
  if (row) {
    await db
      .prepare('UPDATE alert SET email = ?, slack = ?, email_address = ?, slack_webhook_url = ?, updated_at = ? WHERE id = 1')
      .run(ticked.email ? 1 : 0, ticked.slack ? 1 : 0, emailAddress, hook, at);
  } else {
    await db
      .prepare('INSERT INTO alert (id, email, slack, email_address, slack_webhook_url, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?)')
      .run(ticked.email ? 1 : 0, ticked.slack ? 1 : 0, emailAddress, hook, at, at);
  }
  return { ok: true, state: toState(await readRow(db), env) };
}

/** Removes the row (AC-5). Succeeds when there is none. */
export async function deleteAlert(db: Db, env: Env): Promise<AlertState> {
  await db.exec('DELETE FROM alert');
  return toState(null, env);
}
