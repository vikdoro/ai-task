# Spec 04: Set up the alert

Roadmap: M4

## Intent

The demo user gets their own screen at `/`. On it they can set up their one alert by picking email, Slack or both, see what it covers and where it delivers, change its channels, and delete it after confirming (FR-01, FR-02, FR-03, FR-11). The alert is stored in the same SQLite database as the events of the mode in use. Nothing is sent in M4. Matching and delivery are M5.

## Allowed files

- `package.json`: add `@vue/test-utils` and `happy-dom` to `devDependencies` (AC-20). `package-lock.json` changes with it.
- `vitest.config.ts`: only what the component tests need, such as the `nuxt` environment for some files. The network-blocking setup file stays.
- `app/pages/index.vue`, `app/components/alert/**`
- `server/api/alert.get.ts`, `server/api/alert.put.ts`, `server/api/alert.delete.ts`
- `lib/alert.ts`: the plain TS module for the alert rules and storage (AC-1 to AC-5).
- `lib/storage/schema.ts`: add the `alert` table. The existing statements stay as they are.
- `lib/runtime.ts`: only to let the alert routes reach the open database.
- `tests/**`: new unit, component and end-to-end tests, plus the M3 repo checks narrowed as AC-18 and AC-20 say. No other M3 test changes.
- `README.md`: add the user screen to the "Run the local demo" section. The existing text stays as it is.
- `.gitignore`: add the one line `.nuxtrc`, next to `.nuxt/`.
- `data/app.db` and `data/samples.db`: written at runtime, gitignored, never committed.

## Out of scope

- Sending anything: no message, no delivery, no "send test message" button, and no reading of `RESEND_API_KEY` (Q9). That is M5.
- Matching events to the alert, and recording alerts fired or deliveries.
- Any change to the admin view, its routes or its modules. This includes showing the alert's state to the admin (Q9).
- A link from `/` to `/admin` or back (Q9).
- A change history for the alert, a soft delete, and a `deleted_at` (Q1, Q2).
- More than one alert, a choice of event kinds, or any setting other than the two channels (FR-01, DEC-04, DEC-17).
- Pausing the alert (DEC-18).
- Login or auth (DEC-09).
- New keys in `.env.example`, and editing `.env`. M4 reads only `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL`, which exist since M2.
- Any live call to a data source or a delivery service. Agents never run `SOURCE_MODE=live`.
- A reset or cleanup command for the database.
- Any change to the polling, the sources, the bars or the events tables.
- Changing anything in `spikes/`. Creating, changing, moving or deleting anything in `spikes/samples/`.
- Editing `feature-design/product-spec.md` or `feature-design/local-demo/roadmap.md`.
- Playwright, a UI or CSS library, and any dependency not named in AC-20.

## Acceptance criteria

### Storage

- AC-1: The schema in `lib/storage/schema.ts` gains a `CREATE TABLE IF NOT EXISTS alert` statement.
  - The table holds at most one row. A second insert is refused by the database.
  - The row holds: `email` (0 or 1), `slack` (0 or 1), `email_address` (text or empty), `slack_webhook_url` (text or empty), `created_at` and `updated_at` (ISO 8601 UTC).
  - Opening a database written by M3 that already has rows adds the table, raises no error and loses no row in `events` or `source_checks`. A test opens such a database twice.
- AC-2: The alert lives in the database of the mode in use: `data/samples.db` in samples mode, `data/app.db` in live mode, or `DB_PATH` if set (Q3). A test saves an alert in one database file and finds no alert in another.
- AC-3: Every save copies the contact values from the environment.
  - If `DEMO_USER_EMAIL` is set, its value is written to `email_address`. If `SLACK_WEBHOOK_URL` is set, its value is written to `slack_webhook_url`.
  - If a key is not set, the column keeps what it held before, or stays empty on a new alert.
  - The values are copied whether or not that channel is ticked.
  - A test covers each case, with fake values.
- AC-4: Setting up the alert writes `created_at` and `updated_at` to the save time. Changing it updates `updated_at` only, so `created_at` stays the same.
- AC-5: Deleting removes the row (Q2). After a delete, the `alert` table is empty, and `events` and `source_checks` are unchanged. A new setup after a delete gets a new `created_at`. Deleting when there is no alert succeeds and changes nothing.

### Rules

- AC-6: A channel is available when its key is set in the environment, or when the existing alert holds a stored value for it (Q5 with Q1). A channel that is not available cannot be ticked.
- AC-7: Setup, meaning a save when no alert exists, needs at least one available channel ticked (FR-01). A save with none ticked is refused, and no row is written.
- AC-8: A change, meaning a save when an alert exists, may tick any available channels, including none (Q6). A change to zero channels is saved like any other change and keeps the alert.
- AC-9: A save that ticks a channel which is not available is refused, and the row is unchanged.

  A table-driven unit test covers AC-6 to AC-9 with at least these cases:

  | Alert exists | Email key | Slack key | Stored values | Ticked | Result |
  |---|---|---|---|---|---|
  | no | set | set | none | email | saved |
  | no | set | set | none | email, slack | saved |
  | no | set | set | none | none | refused: pick at least one |
  | no | set | not set | none | slack | refused: not available |
  | no | not set | not set | none | email | refused: not available |
  | yes | set | set | both | none | saved, zero channels |
  | yes | not set | set | email | email | saved, stored email kept |
  | yes | not set | set | none | email | refused: not available |

### API

- AC-10: `GET /api/alert` returns either that no alert exists, or the alert's state.
  - The state covers each channel: ticked or not, and available or not. For email it also carries the address to show, which is the stored value or else the environment value.
  - The response never contains the Slack webhook URL, whether stored or from the environment.
- AC-11: `PUT /api/alert` takes the ticked channels as `{ "email": boolean, "slack": boolean }` and applies AC-3 to AC-9.
  - A save returns 2xx with the same state shape as `GET`.
  - A refusal returns 400 with a reason. For AC-7 the reason is `Pick at least one channel.`
  - Any other body, such as a missing or non-boolean field, returns 400 and changes nothing.
- AC-12: `DELETE /api/alert` applies AC-5 and returns 2xx.
- AC-13: No user route returns `created_at`, `updated_at` or anything about events, sources or the admin view.

### The user screen

- AC-14: `GET /` returns the page rendered on the server. Its title is `Your alert`. The page does not link to `/admin`, and `/admin` does not link to `/`.
- AC-15: With no alert, the page shows:
  - `You have no alert set up. Choose where to hear about important breaking news, market movements and natural disasters.`
  - an `Email (<address>)` checkbox, with the value of `DEMO_USER_EMAIL`, or `Email (not set up)`, disabled, when the key is not set;
  - a `Slack (demo channel)` checkbox, or `Slack (not set up)`, disabled, when `SLACK_WEBHOOK_URL` is not set;
  - a `Save alert` button.

  Nothing is ticked at first. Pressing `Save alert` with nothing ticked shows `Pick at least one channel.` and saves nothing.
- AC-16: With an alert, the page shows:
  - `Your alert is set up.`
  - `Covers: Breaking news, Market movements, Natural disasters`
  - the same two checkboxes, ticked as stored, with `Email (<stored or environment address>)`, and `(not set up)` and disabled for a channel that is not available (AC-6);
  - a `Save alert` button and a `Delete alert` button.

  An alert with zero channels shows both checkboxes unticked, with no other message (Q6).
- AC-17: Saving and deleting:
  - A successful save shows `Alert saved.`, and the page shows the saved state. After a first setup, that is the AC-16 view.
  - A failed save, meaning a non-2xx or a network error other than the AC-7 refusal, shows `Your alert could not be saved. Please try again.`. The checkboxes keep what the user ticked.
  - `Delete alert` shows `Delete your alert? Nothing more will be sent until you set up a new one.` with `Delete` and `Keep alert`. Nothing is deleted until `Delete` is pressed. `Keep alert` returns to the AC-16 view with the alert unchanged.
  - After a successful delete, the page shows `Alert deleted.` and then the AC-15 view, with nothing ticked.
  - A failed delete shows `Your alert could not be deleted. It is unchanged. Please try again.`, and the AC-16 view stays as it was.

  Component tests with `@vue/test-utils` and `happy-dom` cover each bullet, with the API mocked to succeed or fail.

### Contact details stay where they belong

- AC-18: The Slack webhook URL never reaches the browser, and the user's contact details never reach the admin.
  - An end-to-end test sets fake values for `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL`, and saves an alert with both channels.
  - The fake webhook URL then appears in no response from `/` and no response under `/api/alert`.
  - Neither fake value appears on `/admin` or in any `/api/admin/*` response (DEC-31).
  - In the database file, the fake values appear only in the `alert` table.
  - In M3's repo check (AC-23 there), the rule is narrowed. `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` may be named only in `lib/alert.ts`. `RESEND_API_KEY` is still named in no file in `lib/`, `server/`, `app/` or `scripts/`.

### Invariants

- AC-19: The admin is untouched. `git diff --stat` shows no change to:
  - `app/pages/admin.vue`, `app/components/admin/**`, `server/api/admin/**` and `lib/admin.ts`;
  - `lib/sources/**`, `lib/poll.ts`, `lib/bars.ts`, `lib/replay.ts`, `server/tasks/**` and `server/plugins/**`.

  M3's admin tests still pass, including the GET-only check on `/api/admin/*`.
- AC-20: The dependencies are M3's (`nuxt`, `vue`, `db0`, `vitest`, `@nuxt/test-utils`, `typescript`, and `husky`), plus exactly `@vue/test-utils` and `happy-dom` as dev dependencies. M3's AC-24 check in `tests/unit/repo.test.ts` is updated to this list.
- AC-21: `lib/alert.ts` follows M3's AC-25. It imports only relative `.ts` paths, `node:` modules or `db0`, and uses no `enum`, `namespace` or parameter properties.
- AC-22: Nothing is sent and no outbound call is made. No file in `lib/`, `server/`, `app/` or `scripts/` contains `api.resend.com` or `hooks.slack.com`. The suite runs with M3's network guard in place.
- AC-23: `git status --porcelain` lists nothing under `spikes/` or `data/`. `git diff --stat` shows no change to `feature-design/product-spec.md`, `feature-design/local-demo/roadmap.md`, `.env.example` or anything in `spikes/`.

## Verification

### Offline, by the executor and the reviewer

None of these makes a live call. `SOURCE_MODE=live` is never set.

1. Tests: `npm test` (`vitest run`). Success is exit code 0, 0 failing and 0 skipped.
2. Build: `npm run build` exits 0.
3. Repo checks:
   - `git status --porcelain` and `git diff --stat` (AC-19, AC-23);
   - `grep -rlnE "DEMO_USER_EMAIL|SLACK_WEBHOOK_URL" lib server app scripts` lists only `lib/alert.ts` (AC-18);
   - `grep -rnE "RESEND_API_KEY|api\.resend\.com|hooks\.slack\.com" lib server app scripts` finds nothing (AC-18, AC-22);
   - the `devDependencies` and `dependencies` in `package.json` (AC-20).
4. By reading: the `alert` statement in `lib/storage/schema.ts` (AC-1).

### Steps the user runs

This is a short hand check at the end of M4. It makes no live call, and nothing is pasted back (Q10).

1. Run `npm start`. It runs in samples mode and uses `data/samples.db`. `.env` already has `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` from M2.
2. Open `http://127.0.0.1:3000/`. Set up the alert with email only, then change it to both channels. Then untick both and save, and check that the alert stays with both boxes unticked.
3. Delete it: press `Keep alert` once, then delete for real. Then check that the screen offers to set one up again.
4. Optional: open `http://127.0.0.1:3000/admin` and check that your email address appears nowhere.

## Decisions from the interview

Decided by the user in P-179, unless noted. "As recommended" means Claude's recommended default was taken.

- **Q1 Storage shape:** one `alert` table with at most one row, holding the `email` and `slack` flags, `created_at` and `updated_at`, and no history. **Override:** the row also holds the email address and Slack webhook URL, copied from `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` at save time. Claude had recommended reading them from the environment and storing neither. The webhook URL never reaches the browser, the admin view or the admin API.
- **Q2 Delete:** a hard delete of the row, with no soft delete. Events and source checks are never touched. As recommended.
- **Q3 Database:** the alert lives in the database of the mode in use, so an alert set up in samples mode does not carry over to live. As recommended.
- **Q4 Slack label:** the fixed text `Slack (demo channel)`. No new key. As recommended.
- **Q5 Missing key:** a channel whose key is missing is shown as `(not set up)` and cannot be ticked. With neither key set, the alert cannot be set up. An existing alert keeps the values it stored. As recommended, with the user's addition about stored values.
- **Q6 Zero channels:** **override**. Setup still needs at least one channel (FR-01), but changing an existing alert to zero channels saves and keeps the alert. Delete is its own explicit action. User's words: "An alert with all channels unticked should be a valid entry, so keep it. Make delete an explicit action." There is no extra message for zero channels: "UI should be self-explanatory. No extra messaging is required. We will see channel labels unticked." Claude had recommended blocking a change to zero channels.
- **Q7 Wording:** the draft was approved as written, apart from the Q6 changes below.
- **Q8 Tests:** component tests with `@vue/test-utils` and `happy-dom` as dev dependencies. The API and the rendered pages are tested with `$fetch`, as in M3. No Playwright. As recommended.
- **Q9 Scope:** no sending or test-send button, no change to the admin view, and no link between `/` and `/admin`. As recommended.
- **Q10 End of milestone:** a short hand check in the browser (set up, change, delete), with nothing pasted back. As recommended.
- **Accepted for now by the user (P-179):** the user screen at `/`; `GET`, `PUT` and `DELETE` `/api/alert`; and the narrowed M3 AC-23 rule (AC-18).
- **`.nuxtrc` gitignored (P-184):** every `npm test` writes a `.nuxtrc` at the repo root, from @nuxt/test-utils (D-80). `.gitignore` gets the one line `.nuxtrc`, next to `.nuxt/`. Decided by the user, as recommended.

Tier two, decided by Claude:

- **Wording changed for Q6:**
  - `Your alert is on.` became `Your alert is set up.`, because it stays true with zero channels.
  - The separate `Change channels` button and the `Email: <address>` / `Slack: demo channel` lines were dropped. The view of an existing alert is the same two checkboxes, ticked as stored, with `Save alert`, so the zero state reads from the checkboxes alone.
- **Stored values count as available (AC-6):** a channel whose key is now missing but which has a stored value can still be ticked. This follows "an existing alert keeps the values it stored": the alert still has somewhere to deliver.
- **A set key overwrites on every save (AC-3):** each save refreshes the stored values from the environment when the key is set, and keeps them when it is not. Both values are copied whether or not the channel is ticked, so a later change that ticks a channel needs no new copy.
- **Shown email address:** the stored value if there is one, or else the environment value. The screen then shows what the alert would deliver to.
- **The save time sets `created_at` only at setup:** a change keeps `created_at`, and a new setup after a delete gets a new one. M5 can then avoid resending past events (DEC-21).
- **Deleting when there is no alert succeeds:** this keeps a repeated or late delete harmless.
- **Module layout:** the alert rules and storage are in one plain module, `lib/alert.ts`, which is also the only file that names the two keys. The routes are three files, `server/api/alert.{get,put,delete}.ts`, and the UI is `app/pages/index.vue` plus `app/components/alert/**`.
- **The validation reason `Pick at least one channel.` comes from the server too:** the screen shows the same text whether the check happens in the browser or in the API.
