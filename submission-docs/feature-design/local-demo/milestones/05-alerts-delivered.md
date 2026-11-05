# Spec 05: Alerts delivered, the journey complete

Roadmap: M5

## Intent

When an event makes its kind's cut, the app checks it against the demo user's alert once. If the alert existed when the event made the cut and has channels ticked, the app sends one message per ticked channel, by email through Resend and to Slack through the stored webhook, with the approved wording (FR-05, FR-06, OQ-07). It records the outcome of each, and never sends that event on that channel again. The admin view gains an `Alerts fired` section, showing for each event that made the cut whether it was sent or why not, and each channel's outcome (FR-08, FR-09). Real sending happens only with `DELIVERY_MODE=live` on the command line. By default deliveries are faked and nothing leaves the machine. The milestone ends with one journey run by the user, J-01, on replayed samples with real delivery.

## Allowed files

- `lib/delivery/**`: new plain TS modules for the matching, the messages, the email and Slack senders, and the delivery storage.
- `lib/poll.ts`: run the matching after each poll (AC-1), and carry the delivery mode in `PollContext`.
- `lib/config.ts`: parse `DELIVERY_MODE` and `POLLING` (AC-14, AC-15).
- `lib/storage/schema.ts`: add the two tables in AC-4. The existing statements stay as they are.
- `lib/alert.ts`: add one read function that returns the stored alert, with its contact values, to `lib/delivery/`. Nothing that exists changes, and the user routes still never see the webhook URL.
- `lib/runtime.ts`, `scripts/poll-once.ts`: the delivery mode, the interrupted-delivery sweep (AC-7) and the `poll:once` output (AC-16).
- `lib/admin.ts`, `lib/format.ts`: the data and wording of the `Alerts fired` section.
- `server/api/admin/alerts.get.ts`: new, GET only.
- `app/pages/admin.vue`, `app/components/admin/**`: the `Alerts fired` section.
- `server/plugins/polling.ts`, `server/tasks/poll/**`: only the `POLLING=off` switch (AC-15) and the refusal of a bad `DELIVERY_MODE` (AC-14).
- `tests/**`: new tests, plus the M3 and M4 repo checks updated as AC-25 says.
- `README.md`: add delivery and the journey run to the "Run the local demo" section. The existing text stays as it is.
- `submission-docs/feature-design/local-demo/findings/delivery.md`: add an "M5 journey run" section at the end (AC-27). The rest stays as it is.
- `data/*.db`: written at runtime, gitignored, never committed.

## Out of scope

- Retrying a failed delivery (DEC-20, PM-13). This includes retrying on a 429.
- An email status lookup, Resend webhooks, and any later change to a delivery's outcome other than AC-7.
- HTML email, attachments, links, footers or an unsubscribe line (DEC-18, DEC-28).
- Sending past events again: after a channel is added, after a delete and a new setup, or after a failure (Q2, DEC-21).
- An age limit on events (Q1).
- Anything new on the user screen `/`, such as a history of sent alerts or a test-send button (Q9). The user routes `server/api/alert.*`, `app/pages/index.vue` and `app/components/alert/**` do not change.
- Any admin action that changes data. The admin view stays read-only (DEC-08).
- Storing the message text. Storing the email address or webhook URL anywhere but the `alert` table.
- The 60-minute live run of the schedules (D-71). It stays deferred and is not part of M5 (Q8).
- Changes to the sources, the bars, the replay, the polling intervals, or the `events`, `source_checks` and `alert` tables.
- A reset, cleanup or delete command for any database, and deleting `data/samples.db` or `data/app.db`.
- Any new dependency. Resend and Slack are called with the built-in `fetch`.
- Any live call by an agent. No agent runs with `SOURCE_MODE=live` or `DELIVERY_MODE=live`.
- Editing `.env`, `.env.example`, `nuxt.config.ts`, `submission-docs/feature-design/local-demo/product-spec.md` or `submission-docs/feature-design/local-demo/roadmap.md`. M5 adds no key. `DELIVERY_MODE` and `POLLING` are command-line switches and never go in `.env`.
- Changing anything in `spikes/`. Creating, changing, moving or deleting anything in `spikes/samples/`.

## Acceptance criteria

### Matching (FR-05, FR-08)

- AC-1: After every `pollSource` call has recorded its check, the app matches. This covers the scheduled tasks, the startup poll and `poll:once`.
  - Matching takes every event with `made_cut` yes that has no `alerts_fired` row, whatever its source.
  - It gives each one exactly one `alerts_fired` row.
  - A failed, paused or not-configured poll still matches, but it adds no new event to match.
- AC-2: The `alerts_fired` row is decided from the alert as it is at that moment. The first rule that applies wins:

  | Alert at matching time | Event's `cleared_at` | Recorded as |
  |---|---|---|
  | none | any | not sent: no alert set up |
  | exists | earlier than the alert's `created_at` | not sent: made the cut before the alert was set up |
  | exists, zero channels ticked | at or after `created_at` | not sent: no channels picked |
  | exists, one or both channels ticked | at or after `created_at` | sent, to the ticked channels |

  A table-driven unit test covers each row, including `cleared_at` equal to `created_at`, which counts as sent. There is no age limit on the event (Q1).
- AC-3: Matching happens once per event (Q2). An event with an `alerts_fired` row is never matched again. A test shows each of these sends nothing new:
  - a later poll that updates the event;
  - ticking a channel after the event was sent to the other one;
  - ticking a channel after the event was recorded as "no channels picked";
  - deleting the alert and setting it up again.

### Storage

- AC-4: `lib/storage/schema.ts` gains two `CREATE TABLE IF NOT EXISTS` statements.
  - `alerts_fired`: one row per event, keyed by `(kind, source_id)` of `events`. It holds:
    - the time of matching;
    - sent, yes or no;
    - the not-sent reason, one of the three in AC-2, empty when sent.
  - `deliveries`: one row per sent event per channel, keyed by `(kind, source_id, channel)`. It holds:
    - `channel`, `email` or `slack`;
    - `outcome`, `sending`, `delivered` or `failed`;
    - `detail`: the failure reason, or `fake: not sent`, or empty;
    - the Resend email id, when there is one;
    - the start and finish times.
  - The keys make the database refuse a second row for the same event, or for the same event and channel.
  - Neither table holds the message text, the email address or the webhook URL.
  - Opening a database written by M4, with rows in `events`, `source_checks` and `alert`, adds the tables, raises no error and loses no row. A test opens such a database twice.
- AC-5: At most once (Q3). A `deliveries` row is written as `sending` before the send call, and its outcome is updated when the call ends.
  - If two matchings run at once, for example two sources' polls in one process, or the server and `poll:once` on the same database file, only the one that wrote the `alerts_fired` row sends.
  - A test runs two matchings at once over the same events and counts one send per channel.

### Delivery (FR-05, FR-09, DEC-20)

- AC-6: Sending, per sent event:
  - Each ticked channel is sent to once, to the values stored in the `alert` row.
  - Sends on one channel are at least 1 second apart in live mode (Q6).
  - Events are sent in order of `cleared_at`, oldest first, then by source time, oldest first.
  - Nothing is retried. Every attempt ends as `delivered` or `failed`.
- AC-7: When a process opens a database for polling (the server's poll context and `poll:once`), every `deliveries` row still `sending` becomes `failed` with the detail `interrupted, outcome unknown`, and it is never sent again (Q3). If its own sender later finishes, that final outcome overwrites this one.
- AC-8: Email, in live mode:
  - The call is `POST https://api.resend.com/emails` with `Authorization: Bearer <RESEND_API_KEY>`, and the JSON body `from` `World event alerts <onboarding@resend.dev>`, `to` the stored address, `subject` and `text` (AC-11), with a 10-second timeout.
  - A 2xx with an `id` is `delivered`, with the id stored.
  - Everything else is `failed`, with these reasons:

  | Case | Reason |
  |---|---|
  | non-2xx with a JSON `name` and `message` | `HTTP <status> <name>: <message>` |
  | non-2xx without them | `HTTP <status>` |
  | 2xx without an `id` | `HTTP <status> unexpected body` |
  | network error | `network error <code or message>` |
  | timeout | `timeout after 10s` |
  | `RESEND_API_KEY` not set (no request made) | `not configured (RESEND_API_KEY missing)` |
  | email ticked but no stored address (no request made) | `no email address stored` |

- AC-9: Slack, in live mode:
  - The call is `POST` to the stored webhook URL with `Content-Type: application/json`, the body `{"text": "<Slack text>"}` (AC-11), and a 10-second timeout.
  - HTTP 200 with the JSON `{"ok": true}`, or the plain body `ok`, is `delivered`.
  - Everything else is `failed`, with these reasons:

  | Case | Reason |
  |---|---|
  | JSON `{"ok": false, "error": "<e>"}` | `HTTP <status> <e>` |
  | non-2xx with a plain-text body | `HTTP <status> <body>` |
  | any other response | `HTTP <status> unexpected body` |
  | network error | `network error <code or message>` |
  | timeout | `timeout after 10s` |
  | Slack ticked but no stored webhook URL (no request made) | `no Slack webhook stored` |

- AC-10: In every reason and detail:
  - the stored email address is replaced with `<email>`;
  - the webhook URL with `<webhook>`;
  - the value of `RESEND_API_KEY` with `<RESEND_API_KEY>`;
  - anything longer than 300 characters is cut to 300.

  A test feeds each of the three values back in an error body and checks that none of them is stored.

### Messages (FR-06, OQ-07)

- AC-11: Each message is plain text, built from the event's stored fields.
  - The email subject is line 1 below. The email text is the body. The Slack text is the subject, a blank line, then the body.
  - The same event gives the same text on both channels.
  - Subjects:
    - Natural disaster: `Natural disaster: <what>`
    - Market movement: `Market movement: <what>`, where `<what>` is `<name> (<symbol>)`
    - Breaking news: `Breaking news: <what>`
  - Bodies, one item per line:
    - Natural disaster:
      - `<what>`
      - `Where: <where>`
      - `When: <source time>`
      - a blank line
      - `Source: GDACS`
    - Market movement:
      - `<name> (<symbol>) rose <x.x>% today`, or `fell` for a negative move, with the absolute move to 1 decimal (Q11)
      - `Where: <where>`
      - `When: <source time>`
    - Breaking news:
      - `<what>`
      - `Where: <where>`
      - `When: <day>`
  - A `Where:` or `When:` line is left out when the value is empty (Q12).
  - Nothing else is added: no measure for disasters or news, no alert level, no article count, no link, no footer (DEC-28).
- AC-12: Times in messages (Q10, DEC-16):
  - A time is shown in the machine's system time zone with UTC alongside, as `5 Nov 2026, 14:03 CET (13:03 UTC)`.
    - The day has no leading zero, the month is the short English name, and the clock is 24-hour.
    - The zone label is what `Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' })` gives.
  - A news day is shown as `3 Nov 2026`, with no time and no UTC.
  - The message builder takes the time zone as a parameter that defaults to the system zone, so tests pass a fixed one.
- AC-13: A table-driven test builds the exact subject, email text and Slack text for at least these, with the time zone `Europe/Budapest`:
  - a disaster with and without a country;
  - a market rise and a market fall;
  - a news event with and without a place.

### Switches

- AC-14: `DELIVERY_MODE` selects real or fake sending (Q7).
  - Unset or `fake`: no request is made to Resend or Slack. Each ticked channel's row is `delivered`, with the detail `fake: not sent`.
  - `live`: AC-8 and AC-9 apply.
  - Any other value: the server refuses to start, and `poll:once` exits 2, each with a message naming the allowed values.
  - It is independent of `SOURCE_MODE`, so samples with live delivery is allowed.
  - A test runs matching in fake mode with a `fetch` that throws, and the test passes.
- AC-15: `POLLING` controls the server's polling (Q8).
  - Unset or `on`: polling runs as in M3.
  - `off`: the server makes no startup poll, and the scheduled tasks call no `pollSource` and write no `source_checks` row. The user screen and the admin view work as usual.
  - Any other value: the server refuses to start, with a message naming the allowed values.
  - `poll:once` ignores `POLLING`.

### `poll:once`

- AC-16: After its three source lines, `npm run poll:once` prints:
  - one line per event sent by this run: `alert sent <Kind label> <source ID>: email <outcome>, slack <outcome>`, where each outcome is `delivered`, `failed: <reason>` or `not picked`;
  - then one summary line: `alerts: <n> sent, <m> not sent`.

  The exit code still depends only on the sources, as in M3. No line holds an email address, a webhook URL or message text.

### Admin view (FR-08, FR-09, DEC-31)

- AC-17: `GET /api/admin/alerts` returns the `Alerts fired` data. Like every route under `/api/admin/`, it answers GET only (M3 AC-22). `/admin` fetches it again every 60 seconds, as it does the other two.
- AC-18: Below the events table, `/admin` shows a section headed `Alerts fired`.
  - With no `alerts_fired` rows, the section shows `No alerts fired yet.` This also applies while the page shows `Waiting for the first event.`
  - Otherwise it shows `Showing <shown> of <total> alerts fired, newest first.` and a table:
    - columns, in order: `Cleared bar at (UTC)`, `Kind`, `What`, `Alert`, `Email`, `Slack`;
    - rows ordered by `cleared_at` newest first, then by source time newest first, with at most 200 shown;
    - times in M3's `YYYY-MM-DD HH:MM:SS UTC` format, and Kind with M3's kind labels.
- AC-19: The `Alert` column is `Sent`, `Not sent: no alert set up`, `Not sent: no channels picked` or `Not sent: made the cut before the alert was set up`.
- AC-20: The `Email` and `Slack` columns show:

  | Delivery | Email | Slack |
  |---|---|---|
  | delivered, live | `Delivered (accepted by Resend)` | `Delivered` |
  | delivered, fake | `Delivered (fake: not sent)` | `Delivered (fake: not sent)` |
  | failed | `Failed: <reason>` | `Failed: <reason>` |
  | still sending | `Sending` | `Sending` |
  | event sent, channel not ticked | `Not picked` | `Not picked` |
  | event not sent | blank | blank |

  An interrupted delivery shows as `Failed: interrupted, outcome unknown` (AC-7).
- AC-21: An end-to-end test sets fake values for `DEMO_USER_EMAIL`, `SLACK_WEBHOOK_URL` and `RESEND_API_KEY`, sets up an alert with both channels, and matches events in fake mode.
  - None of the three values appears on `/admin` or in any `/api/admin/*` response.
  - No admin response contains a message line: no `Where: `, no `When: `, no `Source: GDACS`, and no `rose <x.x>% today` or `fell <x.x>% today` (DEC-31).
  - In the database file, the contact values appear only in the `alert` table.
- AC-22: An end-to-end test covers the empty state, a sent event with one channel delivered and the other failed, and each of the three not-sent reasons.

### Invariants

- AC-23: The parsers, the bars and the replay do not change. `git diff --stat` shows no change to:
  - `lib/sources/**`, `lib/bars.ts`, `lib/replay.ts` or `nuxt.config.ts`;
  - the user routes and screen (`server/api/alert.*`, `app/pages/index.vue`, `app/components/alert/**`).

  Every M3 and M4 test still passes, apart from the repo checks updated in AC-25.
- AC-24: The new modules follow M3's AC-25: they import only relative `.ts` paths, `node:` modules or `db0`, and use no `enum`, `namespace` or parameter properties. No dependency is added, so M4's dependency check passes unchanged.
- AC-25: The repo checks are narrowed. Nothing else in them changes.
  - `RESEND_API_KEY` and `api.resend.com` are named only in the email sender under `lib/delivery/`.
  - `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` are still named only in `lib/alert.ts`.
  - `hooks.slack.com` is still named in no file in `lib/`, `server/`, `app/` or `scripts/`.
  - M4's AC-19 "admin is untouched" check is replaced by the AC-23 paths above.
- AC-26: The suite runs with M3's network guard in place. Delivery tests use a fake `fetch` and fake timers. `git status --porcelain` lists nothing under `spikes/` or `data/`. `git diff --stat` shows no change to `submission-docs/feature-design/local-demo/product-spec.md`, `submission-docs/feature-design/local-demo/roadmap.md`, `.env.example` or anything in `spikes/`.
- AC-27: After the user's journey run (see [Steps the user runs](#steps-the-user-runs)), the executor adds an "M5 journey run" section at the end of `submission-docs/feature-design/local-demo/findings/delivery.md`, filled in from the user's pasted output:
  - the date and time in UTC;
  - the commands;
  - the `poll:once` lines;
  - the `Alerts fired` rows from `/admin`;
  - the hand check of the inbox and the Slack channel;
  - any failure, with its reason.

  Until then the section reads `pending: user run`, and the milestone is not done.

## Verification

### Offline, by the executor and the reviewer

None of these makes a live call. `SOURCE_MODE=live` and `DELIVERY_MODE=live` are never set.

1. Tests: `npm test` (`vitest run`). Success is exit code 0, 0 failing and 0 skipped.
2. Build: `npm run build` exits 0.
3. Replay with fake delivery: `DB_PATH=data/verify-m5.db npm run poll:once`.
   - Expect three source lines, then `alerts: 0 sent, <m> not sent`, since there is no alert. Exit 0.
   - `git status --porcelain spikes/ data/` is empty.
4. Bad switches:
   - `DELIVERY_MODE=foo npm run poll:once` exits 2 with the message.
   - `POLLING=foo` and `DELIVERY_MODE=foo` each stop the built server with the message.
5. Repo checks (AC-23 to AC-26):
   - `git status --porcelain` and `git diff --stat`;
   - `grep -rlnE "RESEND_API_KEY|api\.resend\.com" lib server app scripts` lists only the email sender;
   - `grep -rlnE "DEMO_USER_EMAIL|SLACK_WEBHOOK_URL" lib server app scripts` lists only `lib/alert.ts`;
   - `grep -rn "hooks\.slack\.com" lib server app scripts` finds nothing.
6. By reading: the two new statements in `lib/storage/schema.ts` (AC-4).

### Steps the user runs

This is the journey run, J-01, done once at the end of M5, by the user only (Q8). It replays the saved samples, makes no data-source call, and sends real email and Slack messages. Expect roughly one message per event in the first sample round that makes the cut, on each channel: a handful, well under Resend's 100 a day. `.env` already has `RESEND_API_KEY`, `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` from M2. Do not add `DELIVERY_MODE` or `POLLING` to `.env`.

1. Start the server on a new database, with polling held: `DB_PATH=data/journey.db POLLING=off npm start`.
2. Open `http://127.0.0.1:3000/` and set up the alert with email and Slack.
3. In a second terminal, run `DB_PATH=data/journey.db DELIVERY_MODE=live npm run poll:once`.
4. Check the inbox and the Slack demo channel. Open `http://127.0.0.1:3000/admin` and look at `Alerts fired`.
5. Run step 3 again. Expect `alerts: 0 sent, 0 not sent` and no new message, which shows "once per channel, ever".
6. Stop the server and paste back:
   - the output of steps 3 and 5;
   - the `Alerts fired` rows;
   - what arrived in the inbox and in Slack, including whether the email reached the inbox or spam.

   The executor records them (AC-27).

## Decisions from the interview

Decided by the user in the M5 interview. "As recommended" means Claude's recommended default was taken.

- **Q1 Events from before the alert:** an event is sent only if its `cleared_at` is at or after the alert's `created_at`. There is no age limit. As recommended.
- **Q2 Match once:** the channels ticked when the event makes the cut are the ones messaged. Nothing is reconsidered later, whether a channel is added, the alert has zero channels, or the alert is deleted and set up again. As recommended.
- **Q3 At most once:** a delivery is recorded as in progress before the send. One still in progress after a restart becomes `Failed: interrupted, outcome unknown` and is never resent. As recommended.
- **Q4 Storage:** two new tables. `alerts_fired` has one row per event that made the cut. `deliveries` has one row per sent event per channel. Neither stores the message text or the contact values. As recommended.
- **Q5 Delivered:**
  - Email is delivered when Resend accepts it, a 2xx with an id, with no lookup and no webhook.
  - Slack is delivered on HTTP 200 with `ok: true` or the body `ok`.
  - Everything else is failed, with no retry.
  - Labels: `Delivered (accepted by Resend)` for email and `Delivered` for Slack.
  - As recommended, with the user's choice of labels.
- **Q6 Rate:** at least 1 second between sends per channel. A 429 is failed. As recommended.
- **Q7 Sending switch:** `DELIVERY_MODE`, `fake` by default, `live` set on the command line only. Fake deliveries are recorded as delivered with `fake: not sent`. As recommended.
- **Q8 Journey:** **override.** Only the journey run: samples, `DELIVERY_MODE=live`, a new `DB_PATH`, `POLLING=off` on the server, and `poll:once`. The `POLLING=off` change to M3's polling plugin is allowed. The 60-minute live run (D-71) stays deferred and is not part of M5. Claude had recommended this journey run plus the 60-minute live run.
- **Q9 Scope:** nothing new on the user screen, no test-send button, the admin stays read-only, no reset command, and no new dependency. As recommended.
- **Q10 Time zone:** the machine's system time zone, with UTC alongside. News shows a day only. As recommended.
- **Q11 Market messages:** say the direction and size of the move, such as `fell 3.4% today`, as what happened rather than as significance. As recommended.
- **Q12 News place:** a `Where:` line only when the source gives one. As recommended.
- **Q13 Message wording:** the drafts approved as written (AC-11).
- **Q14 Admin wording:** the `Alerts fired` section approved as written (AC-18 to AC-20).
- **M3 test edits (user decision after review):** AC-16 and AC-18 force two narrow M3 test edits, in `tests/unit/poll-once.test.ts` (the alerts summary line) and `tests/e2e/admin.test.ts` (headers scoped to the events table), so they are an exception to AC-23's no-edit rule.
- **Stale README sentence (user decision after review):** the one sentence "Nothing is sent yet." in the user-screen paragraph of `README.md` is removed, as an exception to "existing text stays".

Tier two, decided by Claude:

- **Matching sweeps every unmatched event that made the cut, after every poll (AC-1):** a crash between a poll and its matching then heals at the next poll. It also covers events that made the cut before M5, in an existing database. Under AC-2 those get "no alert set up" or "made the cut before the alert was set up". One cost: an event that made the cut after an alert was set up in an older database, while M4 had no sending, would be sent at the first M5 poll.
- **`POLLING=off` also covers the scheduled tasks**, not only the startup poll in the plugin, so `server/tasks/poll/**` is allowed for that switch. Without it the 10-minute GDACS task would poll the journey database during the run. A bad `POLLING` value is refused, like a bad mode.
- **Fake sends skip the 1-second spacing:** nothing is sent, and tests stay quick.
- **Fake deliveries show `Delivered (fake: not sent)` on both channels:** fake rows are told apart from real ones on `/admin`.
- **`Sending` is shown for a delivery in progress:** a new one-word label, needed so a send in flight is not shown as failed.
- **Interrupted rows are swept when a process opens the database for polling, and a sender's final outcome overwrites the sweep:** with the server and `poll:once` on the same file, a delivery still in flight is then never left wrongly failed.
- **Reasons follow Q14's form even where the M3 helpers word them differently**, such as `timeout after 10s` and not `timeout after 10 s`. Contact values and the Resend key are redacted, and reasons are cut to 300 characters.
- **Slack reasons have no `: <message>` part**, as `HTTP 400 workflow_not_published`, because Slack's error JSON has only `error`.
- **Missing contact values or a missing key give a failed delivery, not a not-sent alert:** the channel was ticked, so the admin sees a channel failure with the reason.
- **Sending order is `cleared_at`, then source time, oldest first:** events arrive in the order they happened.
- **The `poll:once` alert lines and summary (AC-16), with the exit code unchanged:** the journey run needs to see what was sent, and M3's exit-code meaning stays.
- **Module layout:**
  - the matching, the messages, the senders and the delivery storage live under `lib/delivery/`;
  - `lib/alert.ts` gains one read function, and stays the only file that names `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL`;
  - the email sender is the only file that names `RESEND_API_KEY`;
  - the admin data is in `lib/admin.ts`, the route is `server/api/admin/alerts.get.ts`, and the section is a new component under `app/components/admin/`.
- **Count line `Showing <shown> of <total> alerts fired, newest first.`, and `No alerts fired yet.` shown even while waiting for the first event:** this mirrors M3's count line and keeps the section always visible.
- **Journey database `data/journey.db`:** a fresh file under the gitignored `data/`, so the samples replay starts at round 1 and nothing existing is touched.
- **The journey-run record goes in `findings/delivery.md`:** the run is about how delivery behaves, beside M2's runs.
