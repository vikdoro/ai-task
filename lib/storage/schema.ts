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
];
