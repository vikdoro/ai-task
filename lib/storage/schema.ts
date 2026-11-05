// The whole schema (AC-1). Each statement is idempotent; there is no migration tool.
// Times are ISO 8601 strings in UTC. Booleans are 0 or 1.
export const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS events (
    kind TEXT NOT NULL CHECK (kind IN ('disaster', 'market', 'news')),
    source_id TEXT NOT NULL,
    what TEXT NOT NULL,
    place TEXT NOT NULL,
    source_time TEXT,
    measure TEXT NOT NULL,
    current INTEGER CHECK (current IN (0, 1)),
    made_cut INTEGER NOT NULL CHECK (made_cut IN (0, 1)),
    cleared_at TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    raw_json TEXT NOT NULL,
    PRIMARY KEY (kind, source_id)
  )`,
  `CREATE TABLE IF NOT EXISTS source_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL CHECK (source IN ('gdacs', 'twelvedata', 'eventregistry')),
    checked_at TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('ok', 'failed', 'not configured', 'paused')),
    detail TEXT NOT NULL DEFAULT '',
    ratelimit_remaining INTEGER
  )`,
  // The user's one alert (M4 AC-1). id is fixed at 1, so a second row is refused.
  // The contact values are copied from the environment at save time; empty when never set.
  `CREATE TABLE IF NOT EXISTS alert (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    email INTEGER NOT NULL CHECK (email IN (0, 1)),
    slack INTEGER NOT NULL CHECK (slack IN (0, 1)),
    email_address TEXT NOT NULL DEFAULT '',
    slack_webhook_url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
];
