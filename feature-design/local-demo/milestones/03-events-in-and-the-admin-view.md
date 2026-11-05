# Spec 03: Events in and the admin view

Roadmap: M3

## Intent

The app polls the three chosen sources on a schedule, stores every event they report, marks whether each one made its kind's cut (DEC-27, DEC-29, DEC-30), and shows them in the read-only admin view at `/admin`, with each source's status (FR-07, FR-10). By default the sources are replayed from the M1 samples. Live polling happens only when the user starts it on the command line. Agents never call a source live (D-49).

This is the first app milestone. It sets up the stack: Nuxt 4, TypeScript, Vitest, and SQLite through db0. The source parsers, the bar rules, the storage and the poll function are plain TS modules with no Nuxt imports. Nuxt holds only the admin page, the admin API routes and the polling schedule.

## Allowed files

- `package.json`: scripts, `"type": "module"`, and the dependencies in AC-24. `package-lock.json` changes with it.
- `nuxt.config.ts`, `tsconfig.json`, `vitest.config.ts`
- `app/app.vue`, `app/pages/admin.vue`, `app/components/admin/**`
- `server/api/admin/**`: GET routes only.
- `server/tasks/poll/**`: one Nitro task per source.
- `server/plugins/polling.ts`: the poll at startup, and the timer fallback if scheduled tasks fail (AC-11).
- `lib/**`: plain TS modules: sources, bars, storage, schema, poll, replay, config, formatting.
- `scripts/poll-once.ts`
- `tests/**`: unit tests, end-to-end tests, fixtures, and the setup file that blocks the network.
- `.gitignore`: add `data/`, `.nuxt/`, `.output/`.
- `README.md`: add a "Run the local demo" section. The existing text stays as it is.
- `feature-design/local-demo/findings/data-sources.md`: add a "M3 live run" section at the end, filled in from the user's pasted output (AC-27). The rest stays as it is.
- `data/app.db` and `data/samples.db`: written at runtime, gitignored, never committed.

## Out of scope

- The demo user's screen, alerts, matching events to an alert, messages and delivery. These are M4 and M5. M3 has no alert or delivery table.
- Reading `DEMO_USER_EMAIL`, `SLACK_WEBHOOK_URL` or `RESEND_API_KEY` anywhere in M3 code.
- Merging duplicate events (PM-15), filtering news by category, and any coverage filter beyond the rules in AC-4 to AC-9.
- The unfiltered GDACS call (`SEARCH` with no `alertlevel`).
- Any admin action that changes data: no POST, PUT, PATCH or DELETE route, and no form or button that writes (DEC-08).
- A reset, delete or cleanup command for the database (Q17).
- Retries beyond AC-13, and any change to the polling intervals in AC-11.
- Pagination, filters, search or sort controls on `/admin`, and a home page or any page other than `/admin`.
- Showing the admin any time zone other than UTC.
- Login or auth (DEC-09).
- Any live call by an agent: no run with `SOURCE_MODE=live`, with no exception.
- Changing anything in `spikes/`, and creating, changing, moving or deleting anything in `spikes/samples/`.
- Editing `feature-design/local-demo/product-spec.md`, `feature-design/local-demo/roadmap.md`, `.env` or `.env.example`. M3 adds no keys, and `SOURCE_MODE` is not a key and never goes in `.env`.
- Drizzle, tsx, Playwright, a UI or CSS library, and Nitro's experimental `database` feature or `useDatabase()`.

## Acceptance criteria

### Storage

- AC-1: On startup, the app creates its SQLite file with the tables `events` and `source_checks` if they do not exist. This also happens on the first `poll:once`. The schema lives in one file, `lib/storage/schema.ts`, as `CREATE TABLE IF NOT EXISTS` statements. Running it twice on a database that has rows raises no error and loses no row. There is no migration tool.
- AC-2: An event is identified by its kind plus its source ID. A poll that returns an event already stored updates that row's latest fields and `last_seen_at`, and leaves `first_seen_at` unchanged. It never creates a second row. Two items with different source IDs are always two rows, even when their titles are the same (DEC-26).
- AC-3: Each `events` row holds:
  - kind;
  - source ID;
  - what, where and source time;
  - the measure;
  - `current`, for disasters only;
  - `made_cut` (yes or no);
  - `cleared_at`, empty until the event first makes the cut;
  - `first_seen_at` and `last_seen_at`;
  - the latest raw JSON of that item as the source returned it.

  Each `source_checks` row holds the source, the check time in UTC, the outcome (`ok`, `failed`, `not configured` or `paused`), and the reason or detail. For Event Registry it also holds the `x-ratelimit-remaining` value, if the response carried one.

### Natural disasters (GDACS)

- AC-4: A live GDACS poll makes exactly one request: `GET https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?alertlevel=Orange;Red`. If it is retried (AC-13), there is one more. Every feature in the response is stored, whether or not it is current.
  - The source ID is `<eventtype>-<eventid>`.
  - What is `name`, where is `country`, source time is `fromdate` read as UTC.
  - The measure is `alertlevel`, followed by `severitydata.severitytext` in brackets when that is not empty.
  - `current` is yes when `iscurrent` is `"true"`, and no otherwise.
- AC-5: A disaster makes the cut only if it is current and, on its overall `alertlevel`, it is either Red, or Orange with `eventtype` `EQ` or `TC` (DEC-27, DEC-30). A table-driven test covers at least these cases:

  | Item | Made the cut |
  |---|---|
  | current Red FL | yes |
  | not current Red TC | no |
  | current Orange EQ | yes |
  | current Orange TC | yes |
  | current Orange FL | no |
  | current Orange DR | no |
  | current Green EQ | no |
  | current, `alertlevel` Orange, `episodealertlevel` Red, FL | no |

### Market movements (Twelve Data)

- AC-6: A live Twelve Data poll makes one batch quote request for `SPY,QQQ,EUR/USD,BTC/USD,GLD,USO`. If it is retried (AC-13), there is one more.
  - Each symbol in the response becomes one event per trading day (DEC-29). The trading day is the date part of the quote's `datetime`, and the source ID is `<symbol> <trading day>`, such as `SPY 2026-11-04`.
  - A later poll on the same trading day updates that row. A new trading day creates a new row.
  - Every instrument-day is stored, whether or not it made the cut.
  - What is `<name> (<symbol>)`, where is `exchange`, source time is `last_quote_at`, and the measure is `percent_change` with its sign and 2 decimals, such as `+3.71%`.
  - A symbol that comes back as `{status: "error"}` or is missing creates no row. The other symbols are still stored, and the check counts as `ok`, with that symbol's error as its detail.
- AC-7: An instrument-day makes the cut when the absolute value of `percent_change` is strictly greater than its threshold: SPY 3, QQQ 3, EUR/USD 1.2, BTC/USD 8, GLD 3, USO 6 (DEC-27, "by more than"). A test covers both sides of each threshold, including:

  | Instrument | Move | Made the cut |
  |---|---|---|
  | SPY | +3.00 | no |
  | SPY | −3.01 | yes |
  | EUR/USD | 1.20 | no |
  | EUR/USD | −1.21 | yes |
  | BTC/USD | 8.00 | no |
  | BTC/USD | 8.01 | yes |
  | USO | −6.01 | yes |

### Breaking news (Event Registry)

- AC-8: A live Event Registry poll makes exactly one `POST https://eventregistry.org/api/v1/event` and is never retried. Its body matches the M1 request: `getEvents`, `lang` `eng`, `dateStart` the previous UTC day, `dateEnd` the current UTC day, 50 events sorted by size descending, the same `includeEvent*` flags, and `forceMaxDataTimeWindow` 31.
  - Each result is one event, with `uri` as its source ID.
  - What is `title.eng`, or the first title if there is no English one.
  - Where is `location.label` plus the country label, and is blank when there is no location.
  - Source time is `eventDate`, a day only.
  - The measure is `<totalArticleCount> articles`, with a thousands separator, such as `1,234 articles`.
- AC-9: A news event makes the cut when `totalArticleCount` is 1,000 or more (DEC-27). The tests include 999 (no) and 1,000 (yes).

### Making the cut is permanent

- AC-10: Once an event has made the cut, it stays `made_cut` yes and its `cleared_at` never changes, whatever later polls return:
  - a market move falling back under its threshold;
  - a news count dropping below 1,000;
  - a GDACS item no longer current or at a lower level.

  An event that had not made the cut and makes it on a later poll gets `cleared_at` set to that poll's time. A test covers each of the three kinds.

### Polling

- AC-11: Polling runs on these schedules, each of which calls `pollSource(kind)`:
  - GDACS every 10 minutes;
  - Twelve Data every 15 minutes;
  - Event Registry every 60 minutes.

  The schedules are defined in one place: `scheduledTasks` in `nuxt.config.ts`, with Nitro `experimental.tasks` on. If the executor cannot get scheduled tasks to fire in the built server, it moves the same three intervals to timers in `server/plugins/polling.ts` and says so in its report.

  At server start, each source is polled once if its last recorded check is older than its interval, or if it has never been checked. Otherwise it waits for its schedule.

  A source's poll never overlaps another poll of the same source.
- AC-12: Each call to `pollSource` writes exactly one `source_checks` row:
  - `ok`, with the item count;
  - `failed`, with the reason. Failures are a network error, a timeout (30 s for GDACS and Twelve Data, 60 s for Event Registry), a non-2xx status, a body that is not JSON, a body without the expected list, a Twelve Data body with `status: "error"` (this arrives with HTTP 200), or an Event Registry body with an `error` field;
  - `not configured`, in live mode when the source's key (`TWELVE_DATA_API_KEY` or `EVENT_REGISTRY_API_KEY`) is not set. No request is made;
  - `paused` (AC-14).

  A failed poll changes no event row.
- AC-13: GDACS and Twelve Data retry once, 5 seconds later, after a network error, a timeout or a 5xx. No other failure is retried. Event Registry never retries. After the attempts are used up, the check is recorded as `failed`, and the next scheduled poll is the next attempt. Tests use a fake fetch and fake timers.
- AC-14: Before every live Event Registry request, the app checks the most recently recorded `x-ratelimit-remaining`. If that value is below 200, it makes no request and records the check as `paused`, with the detail `token floor reached`. Every Event Registry response that carries the header has its value recorded. If no value has ever been recorded, the request goes ahead.

### Sample replay and live mode

- AC-15: `SOURCE_MODE` selects where data comes from.
  - Unset or `samples`: no network request is made, and every source reads from the samples folder. The folder is `spikes/samples/` by default, or `SAMPLES_DIR` if set.
  - `live`: the real sources are called.
  - Any other value: the server refuses to start, and `poll:once` exits 2, each with a message naming the allowed values.
  - Samples mode writes to `data/samples.db` and live mode to `data/app.db`, unless `DB_PATH` is set.
  - A test runs every source in samples mode with a `fetch` that throws, and the test passes.
- AC-16: Replay takes the newest run folder whose `round-1` holds `gdacs-filtered.json`, `twelvedata-quote.json` and `eventregistry-events.json`.
  - The n-th successful poll of a source, counted in the database in use, reads round n of that folder. Once the rounds run out, it stays on the last round.
  - Event Registry's `x-ratelimit-remaining` is read from the matching `.meta.json` in the same round folder.
  - If no matching folder is found, the check is `failed` with the reason `no samples found in <folder>`.
  - Replay only reads: nothing under the samples folder is created, changed or removed.
- AC-17: `npm run poll:once` runs `node --env-file-if-exists=.env scripts/poll-once.ts` directly, with no tsx and no running server. It polls each of the three sources once in the current `SOURCE_MODE`, and prints one line per source:
  - `<source> <outcome> <detail>`, such as `gdacs ok 83 items, 4 made the cut`;
  - for a failed source, the line ends with the reason.

  It exits 0 if no source failed, and 1 if any failed.

### Admin view

- AC-18: The built server is started with `npm start`, which runs `nuxt build` and then `node --env-file-if-exists=.env .output/server/index.mjs`. It listens on `127.0.0.1:3000` only. `nuxt dev` also listens on localhost only. `GET /admin` returns the page rendered on the server. The page fetches its data again from `/api/admin/*` every 60 seconds, without a full page reload.
- AC-19: `/admin` shows a status line for every source, then the events table.
  - The page title is `Admin: events in`.
  - The columns, in order, are `Received (UTC)`, `Kind`, `What`, `Where`, `Source time`, `Measure`, `Current`, `Cleared bar`, `Source ID`.
  - Kind is `Breaking news`, `Market movement` or `Natural disaster`.
  - Cleared bar is `Yes` or `No`.
  - Current is `Yes` or `No` for disasters, and blank for the other kinds.
  - Rows are ordered by `first_seen_at`, newest first. Rows with the same `first_seen_at` are ordered by source time, newest first.
  - At most 200 rows are shown, with the line `Showing <shown> of <total> events, newest first.`
  - Times are UTC, as `YYYY-MM-DD HH:MM:SS UTC`. News source times are a day, as `YYYY-MM-DD`.
- AC-20: With no events stored, the page shows `Waiting for the first event.`, followed by one line per source:
  - `<Source>: last checked <time UTC>`, or
  - `<Source>: not checked yet`.

  The source names are `GDACS`, `Twelve Data` and `Event Registry`.
- AC-21: Each source's status line follows that source's latest check:
  - `ok`: `<Source>: last checked <time UTC>`. For Twelve Data with symbol errors, `. <symbol>: <error>` is added for each symbol that failed.
  - `failed`: `<Source> could not be reached: <reason>. Last success: <time UTC | never>.`
  - `not configured`: `<Source>: not configured (API key missing).`
  - `paused`: `Event Registry: paused: token floor reached.`

  An end-to-end test covers the waiting, events and unreachable states.
- AC-22: The admin view is read-only. Every route under `/api/admin/` answers GET only. A POST, PUT, PATCH or DELETE to them returns a 4xx and leaves the database unchanged. The page has no form and no control that writes.
- AC-23: An end-to-end test sets fake values for `DEMO_USER_EMAIL`, `SLACK_WEBHOOK_URL`, `RESEND_API_KEY`, `TWELVE_DATA_API_KEY` and `EVENT_REGISTRY_API_KEY`. None of those values appears in `/admin`, in any `/api/admin/*` response, or in the database file (DEC-31). No file in `lib/`, `server/`, `app/` or `scripts/` mentions `DEMO_USER_EMAIL`, `SLACK_WEBHOOK_URL` or `RESEND_API_KEY`.

### Invariants

- AC-24: The dependencies added are exactly `nuxt`, `vue`, `db0`, `vitest`, `@nuxt/test-utils` and `typescript`, plus whatever npm installs under them. `husky` stays. `package.json` has `"type": "module"`.
- AC-25: Nothing in `lib/` or `scripts/` imports from `nuxt`, `#imports`, `#app`, `h3`, `nitropack` or a `~`/`@` alias. Their imports are relative paths ending in `.ts`, `node:` modules, or `db0`. They use only TS syntax Node can strip (no `enum`, `namespace` or parameter properties), so `node scripts/poll-once.ts` runs on Node 26 without a build step.
- AC-26: The test suite runs with outbound network blocked. A Vitest setup file replaces `fetch` with one that throws `network blocked in tests` for any host other than `localhost` or `127.0.0.1`.
- AC-27: The user does one live run at the end of M3 (see [Steps the user runs](#steps-the-user-runs)). The executor then records the user's pasted output in a new "M3 live run" section at the end of `feature-design/local-demo/findings/data-sources.md`:
  - the date and time in UTC;
  - the commands;
  - the `poll:once` lines;
  - the source status lines and event counts per kind from `/admin`;
  - any failure, with its reason.

  Until then the section reads `pending: user run`, and the milestone is not done.
- AC-28: `git status --porcelain` lists nothing under `spikes/` or `data/`. `git diff --stat` shows no change to `feature-design/local-demo/product-spec.md`, `feature-design/local-demo/roadmap.md` or anything in `spikes/`.

## Verification

### Offline, by the executor and the reviewer

None of these makes a live call. `SOURCE_MODE=live` is never set.

1. Unit and end-to-end tests: `npm test`, which runs `vitest run`. Success is exit code 0, 0 failing and 0 skipped.
2. Build: `npm run build` (`nuxt build`) exits 0.
3. Replay against the real M1 samples on the user's machine (AC-15 to AC-17): `npm run poll:once`, which runs in samples mode. Expect:
   - three `ok` lines;
   - exit 0;
   - `data/samples.db` created;
   - `git status --porcelain spikes/` empty.
4. Bad mode (AC-15): `SOURCE_MODE=foo npm run poll:once` exits 2 with the message.
5. Repo checks (AC-23 to AC-25, AC-28):
   - `git status --porcelain`, `git diff --stat`, and `git check-ignore data/app.db`;
   - `grep -rnE "DEMO_USER_EMAIL|SLACK_WEBHOOK_URL|RESEND_API_KEY" lib server app scripts` finds nothing;
   - `grep -rnE "from '(nuxt|#imports|#app|h3|nitropack|~|@)" lib scripts` finds nothing.
6. By reading:
   - `nuxt.config.ts`, for the three schedules and the localhost binding (AC-11, AC-18);
   - the `start` script in `package.json` (AC-18).

### Steps the user runs

This happens once, at the end of M3, and only the user does it.

1. Optional: check that `.env` has `TWELVE_DATA_API_KEY` and `EVENT_REGISTRY_API_KEY`. They are already there from M1. Do not add `SOURCE_MODE` to `.env`.
2. Run `SOURCE_MODE=live npm run poll:once` once. It makes 1 GDACS request, uses 6 Twelve Data credits and 5 Event Registry tokens.
3. Right after step 2, run `SOURCE_MODE=live npm start` and leave it running for about 2 minutes. Both steps use `data/app.db`, and the startup poll skips any source checked within its interval, so this makes no further live call. The 60-minute run of the schedules is deferred to M5's live run (P-168).
4. Open `http://127.0.0.1:3000/admin`.
5. Paste back:
   - the output of step 2;
   - the source status lines from `/admin`;
   - the number of rows per kind, and how many made the cut.

   The executor records them (AC-27).

## Decisions from the interview

Decided by the user in the M3 interview, unless a prompt is named. "As recommended" means my recommended default was taken.

- **Stack (replaces Q1):** Nuxt 4 with TypeScript, and Vitest with @nuxt/test-utils where needed. The parsers, bar rules and storage are plain TS modules with no Nuxt imports. Nuxt holds the admin page, the server API routes and the polling task. User's choice.
- **Q2 Storage:** one SQLite file, reached from a plain TS module through db0 and its node:sqlite connector, with raw SQL. The schema is one idempotent `CREATE TABLE IF NOT EXISTS` file and there is no migration tool. Nitro's `database` feature is not used. Two tables, `events` and `source_checks`, with updates in place. As recommended.
- **Q3 Tests:** Vitest in the node environment for the plain modules, with hand-written fixtures in `tests/fixtures/`. @nuxt/test-utils is used for the admin API and page, with `$fetch` and no browser. No Playwright. As recommended.
- **Q4 Polling:** `pollSource(kind)`, called by Nitro scheduled tasks, with a Nitro plugin using `setInterval` as the fallback. The demo runs the built server through `npm start`. `poll:once` is run directly by Node, so the modules use only TS syntax Node can strip, with `.ts` imports. As recommended.
- **Q5 Live calls:** samples are the default. `SOURCE_MODE=live` is set on the command line only, never in `.env`. The user does one live run at the end of M3 themselves, and agents never do. As recommended, plus the user's choice of an end-of-M3 live run.
- **Q6 Serving:** `http://localhost:3000/admin`, bound to localhost, with no login. The page is rendered on the server and fetches `/api/admin/*` again every 60 s. It shows the newest 200 plus the total, with no pagination. As recommended.
- **Q7 Intervals:** GDACS every 10 min, Twelve Data every 15 min, Event Registry every 60 min. As recommended.
- **Q8 Token floor:** Event Registry stops below 200 remaining tokens and shows "paused: token floor reached". As recommended.
- **Q9 Retry:** GDACS and Twelve Data retry once after 5 s on a network error or a 5xx. Event Registry never retries. As recommended.
- **Q10 Unreachable:** any failed check counts and shows its reason. A missing key shows as "not configured". A Twelve Data symbol error counts as reached, with the error shown. As recommended.
- **Q11 Market event:** one per instrument per trading day, keyed by the symbol plus the trading day, stored and shown whether or not it made the cut, and updated on each poll. It was first overridden in P-150, and settled by spec v6 (DEC-29, P-154, P-156) back to the recommendation.
- **Q12 Making the cut is permanent:** once made, it stays. As recommended.
- **Q13 GDACS:** store and show every item the alert-level call returns, with whether GDACS marks it current. It makes the cut only if it is current and reaches the alert level, with the Orange exception for EQ and TC. The bar is judged on the overall `alertlevel`, and there is no unfiltered call. It was first overridden in P-150 to store only current items, and settled by spec v6 (DEC-30, P-154, P-156). The known risk is OQ-11.
- **Q14 Events already there at the first poll:** shown like any other event, with no marking. Whether M5 alerts on them is left to M5. As recommended.
- **Q15 Order:** `first_seen_at` newest first, with ties broken by source time. As recommended.
- **Q16 Admin wording:** as proposed, without edits: the title, column labels, kind labels, Yes/No values, empty state, unreachable and not-configured lines, and times in UTC only. As recommended.
- **Q17 Reset:** no reset or delete command. The app never deletes events. As recommended.
- **Q18 Spikes:** `spikes/` stays JS and untouched. M3's parsers are rewritten test-first in TS, and replay only reads `spikes/samples/`. As recommended.
- **Live run shortened (P-168):** `poll:once` live, then about 2 minutes of `npm start` live to see `/admin` on live data, with no further live call. The 60-minute schedule run moves to M5's live run, since the scheduled tasks were already seen to fire on samples. Claude's recommendation, chosen by the user.
- **Q19 Dependencies:** `nuxt`, `vue`, `db0`, `vitest`, `@nuxt/test-utils` and `typescript`, and nothing else. As recommended.
- **Admin view hides user details (DEC-31, spec v6):** no email address, Slack webhook URL or message content on `/admin` or in `/api/admin/*`. In M3 none of them is ever read.

Tier two, decided by Claude:

- **`Current` column:** labelled `Current`, with `Yes` or `No` for disasters and blank for the other kinds, placed before `Cleared bar`. FR-07 and DEC-30 need it, and it follows the Q16 label style. The coordinator suggested it.
- **Layout:** Nuxt at the repo root with Nuxt 4's `app/` and `server/` folders. The plain modules go in `lib/`, not the auto-imported `shared/`, so they stay free of Nuxt. Tests go in `tests/` and the CLI in `scripts/poll-once.ts`.
- **`"type": "module"` in `package.json`:** needed by Nuxt and by Node's native `.ts` run of `poll:once`. The spikes are `.mjs` and husky is unaffected.
- **Schema as a TS module (`lib/storage/schema.ts`), not a `.sql` file:** a `.sql` file would not be bundled into the Nitro build.
- **Separate databases per mode:** `data/samples.db` for replay and `data/app.db` for live, overridable with `DB_PATH`. Replayed M1 data then never mixes into the record of the live run.
- **Replay order:** the newest run folder with all three sources (today the 4-round watch, run W). It steps one round per successful poll and stays on the last one. This shows real updates, such as counts changing, without live calls, and it is deterministic.
- **Poll at startup only when stale:** a restart does not spend Event Registry tokens or Twelve Data credits when the last check is still within its interval.
- **Timeouts:** 30 s for GDACS and Twelve Data, 60 s for Event Registry, which is the value M1 used for it.
- **Env names `SAMPLES_DIR` and `DB_PATH`:** they let the tests point at fixtures and a temporary database.
- **Display formats:**
  - market source ID `SPY 2026-11-04`;
  - measures `Red (Magnitude 7.1M ...)`, `+3.71%` and `1,234 articles`;
  - times `YYYY-MM-DD HH:MM:SS UTC`;
  - source names `GDACS`, `Twelve Data` and `Event Registry`;
  - the count line `Showing <shown> of <total> events, newest first.`

  Each follows the Q16 wording.
- **Status lines are always shown above the table, not only in the empty state:** FR-10's unreachable state has to be visible once events exist.
- **Market trading day = the date part of `datetime`:** the M1 findings show `datetime` is the start of the daily bar, which is the instrument's trading day.
- **`poll:once` output and exit codes:** one line per source, 0 if nothing failed, 1 if anything failed, 2 on a bad `SOURCE_MODE`. This matches the M1 and M2 commands.
- **Live-run record:** a new section at the end of `findings/data-sources.md`, beside M1's runs, since it is about how the sources behave.
- **Test network guard:** only `localhost` and `127.0.0.1` are allowed, so the @nuxt/test-utils `$fetch` calls still work.
