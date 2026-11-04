# Spec 02: Try email and Slack delivery

Roadmap: M2

## Intent

A throwaway script in `spikes/` sends one plain-text test message to the demo user's own email through Resend, and one to a dedicated Slack channel through a Slack webhook. Since P-118 that is a Workflow Builder webhook. It prints delivered, failed or skipped for each channel, with the reason. A committed findings note in `feature-design/local-demo/findings/` records each service's limits and failure cases, taken from the services' docs, and the outcome of the user's own live runs.

Only the happy path is tried (P-109). No failure is caused on purpose. Agents never send live. The executor and the reviewer verify offline, and the user runs every live send (see [Steps the user runs](#steps-the-user-runs)).

## Allowed files

- `spikes/send-test.mjs` (the one command)
- `spikes/channels/email-resend.mjs`
- `spikes/channels/slack-webhook.mjs`
- `spikes/no-network.mjs` (offline guard used only for verification; see AC-9)
- `spikes/README.md` (add an M2 section; the M1 section stays as it is)
- `.env.example` (add the three key names, no values)
- `feature-design/local-demo/findings/delivery.md`
- `spikes/samples/delivery-<run timestamp>/**` (written by the script, gitignored, never committed)

## Out of scope

- Causing any failure on purpose, against either service: no wrong keys, no bad addresses, no revoked webhooks, no rate-limit or quota tests, and no `--fail` flag (P-109, "Go for the happy path."). Failure cases come from the docs, plus any failure that happens naturally in the user's runs.
- Any live send by an agent (P-109, "No, I run them"). An agent runs `spikes/send-test.mjs` only with `--import ./spikes/no-network.mjs`.
- Retrying a failed send (DEC-20).
- Other email services, SMTP, and verifying a sending domain. Resend only, from `onboarding@resend.dev`.
- Any Resend delivery-status check after the send (P-121): no status lookup, no wait, no Resend webhooks, and no server or database.
- A Slack app with a bot token, `chat.postMessage`, or posting to a user or DM. Only the webhook in `SLACK_WEBHOOK_URL` is used: a Workflow Builder webhook (P-118) or a classic incoming webhook.
- HTML email, attachments, Slack blocks or formatting.
- Message wording beyond the approved test text in AC-2. Alert wording is OQ-07 and belongs to M5.
- npm packages, including Resend's or Slack's SDKs. Use built-in `fetch` and `node:` modules only. Do not change `package.json` or `package-lock.json`.
- Changing M1's scripts (`spikes/fetch-sources.mjs`, `spikes/sources/**`) or anything already in `spikes/samples/`.
- Editing `feature-design/product-spec.md`, `feature-design/local-demo/roadmap.md` or `.env`.
- Unit tests (roadmap Decisions: spikes are verified by running them).

## Setup

- **Email.**
  - Resend's HTTPS API is called with `fetch`, and a "Sending access" API key is enough (P-121).
  - The sender is `onboarding@resend.dev`. The recipient is `DEMO_USER_EMAIL`, which must be the address the user signed up to Resend with, because Resend's test sender delivers only to that address.
  - The executor checks the send endpoint against Resend's docs and cites the page in the findings. For the findings' M5 note only, it also cites the docs for the status-lookup endpoint (one email by id) and the key permission that lookup needs.
- **Slack.**
  - The webhook is a Slack Workflow Builder webhook (`hooks.slack.com/triggers/…`), in a workspace the user owns. Its workflow has a `text` variable and posts that variable to a channel used only for the demo, such as `#event-alerts-demo` (P-118).
  - The request body is the JSON `{"text": "<message>"}`.
  - A classic incoming webhook (`hooks.slack.com/services/…`) takes the same body, and the script accepts either kind.
  - The executor checks both kinds' request and response formats against Slack's docs, and cites them.
- **Keys.** These three go in the gitignored `.env` at the repo root, and the user adds them:
  - `RESEND_API_KEY`;
  - `DEMO_USER_EMAIL`;
  - `SLACK_WEBHOOK_URL`, treated as a secret like a key.
- **Request budget per live run.** At most one send per channel.
- **Timeout.** 10 seconds per request. No retry.

## Acceptance criteria

- AC-1: `node --env-file-if-exists=.env spikes/send-test.mjs` sends one message to each channel whose keys are set. It prints one result line per channel, starting with `email` or `slack`, then `delivered`, `failed` or `skipped`, then the detail:
  - Email `delivered` means Resend accepted the send: a 2xx with an id. The line shows the id, for example `email delivered (accepted, id <id>)`. Nothing is checked after the send (P-121).
  - Slack `delivered` means HTTP 200 with either the body `ok` (classic incoming webhook) or a JSON body with `"ok": true` (Workflow Builder webhook). A JSON body with `"ok": false` reads `failed`, with its `error` value as the reason, such as `workflow_not_published`.
- AC-2: The message carries exactly this approved test text, with `<UTC time>` written as ISO 8601 to the second, such as `2026-11-04T14:05:09Z`:
  - Email subject: `World event alerts: test message`
  - Email body, plain text only: `This is a test message from the world event alerts local demo, sent <UTC time>. No action needed.`
  - Slack: the request body is the JSON `{"text": "<the same sentence as the email body>"}`.
- AC-3: `--channel=email` or `--channel=slack` sends to that channel only. Any other value prints a usage line and exits 2 without sending.
- AC-4: For each channel, if a key it needs is unset, its line reads `skipped: <NAME> not set`, naming every missing key. Email needs `RESEND_API_KEY` and `DEMO_USER_EMAIL`, and Slack needs `SLACK_WEBHOOK_URL`. The other channel still runs, and the run exits 0 if nothing failed. The same holds when there is no `.env` at all.
- AC-5: The channel's line reads `failed` with the reason on any of these:
  - a network error;
  - a timeout after 10 seconds;
  - a non-2xx status;
  - a Slack response that is neither the body `ok` nor JSON with `"ok": true`.

  The reason is `timeout after 10s`, or the error code and message, or the HTTP status with the service's error name and message, or the Slack JSON `error` value, or the Slack body text. Nothing is retried, and the other channel still runs.
- AC-6: Exit code: 0 if every channel was `delivered` or `skipped`, 1 if any was `failed`.
- AC-7: `--dry-run` prints, for each channel whose keys are set, the method, URL, headers and body it would send, and the line `dry run: nothing sent`. It makes no network request, saves nothing and exits 0.
- AC-8: Neither the value of `RESEND_API_KEY`, `SLACK_WEBHOOK_URL` nor `DEMO_USER_EMAIL` appears in printed output (dry run included) or in anything saved. Each is replaced by `<NAME>`, so the user's output can be pasted as is.
- AC-9: With `--import ./spikes/no-network.mjs`, any `fetch` call throws `network blocked by no-network.mjs`. That guard file does nothing else.
- AC-10: A run other than a dry run saves the raw response and a `.meta.json` for each send in a new folder, `spikes/samples/delivery-<run timestamp>/`. That is at most one send per channel and no email-status files. The `.meta.json` holds the redacted request (method, URL, headers, body), the time sent in UTC, the status and the response headers, or the error. Nothing else under `spikes/samples/` is created, changed or removed.
- AC-11: `git status --porcelain` lists nothing under `spikes/samples/`. `package.json` and `package-lock.json` are unchanged, and every import in the new files is a relative path or a `node:` module. `.env.example` lists `RESEND_API_KEY`, `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL`, with no values.
- AC-12: `feature-design/local-demo/findings/delivery.md` exists. For Resend and for Slack webhooks, it covers the items below, each with the URL it came from, marked as either read in the docs or seen in a run:
  - the free-use limits and terms. For Resend these are the daily and monthly quotas, the request rate limit, and the rule that the test sender delivers only to the account's own address. For Slack they are the webhook rate limit and the message size limit;
  - every failure case the docs name, with the status and the error name or body text it comes back as;
  - for Resend, a note for M5:
    - that "accepted" (the 2xx this spike counts as delivered) is not "delivered", and that the spike does not learn the final status;
    - what M5 would need to learn it: the status-lookup endpoint and its status values, or Resend's webhooks;
    - that a lookup needs a key with more than "Sending access", because a "Sending access" key got HTTP 401 `restricted_api_key`, which was seen in a run;
  - for Slack:
    - the two webhook kinds, a classic incoming webhook (`hooks.slack.com/services/…`) and a Workflow Builder webhook (`hooks.slack.com/triggers/…`), and their different responses. The classic one answers with the plain body `ok`. The workflow one answers with JSON `{"ok": true}`, or `{"ok": false, "error": …}` such as HTTP 400 `workflow_not_published`, which was seen in a run before the workflow was published;
    - that a workflow webhook needs a `text` variable set up in the workflow;
    - for each kind, where it posts and whether it can target a user, and what that means for FR-02 ("the Slack account it delivers to");
    - that the webhook URL is a secret;
  - a short list, for FR-09 in M5, of which failure reasons each channel can give the admin view.

  It contains no alert wording.
- AC-13: The findings note has a "Live runs" section, filled from the output the user pasted after their own runs (see [Steps the user runs](#steps-the-user-runs)). For each run it records:
  - the date and time in UTC;
  - the command;
  - the printed result lines;
  - the user's hand check: whether the email reached the inbox or spam, and whether the Slack message reached the demo channel. In P-118 the user confirmed by hand that the email arrived in the inbox;
  - any failure that happened naturally, with its reason. This includes the `workflow_not_published` response, and the `restricted_api_key` status lookup from the runs before P-121.

  Until the user has run the command, the section reads `pending: user run`, and the milestone is not done.
- AC-14: `git diff --stat` shows no change to `feature-design/product-spec.md`, `feature-design/local-demo/roadmap.md`, `spikes/fetch-sources.mjs` or anything under `spikes/sources/`.

## Verification

### Offline, by the executor and the reviewer

These are run from the repo root. They use fake values, and the `--import ./spikes/no-network.mjs` guard on every run of `send-test.mjs`, so nothing can reach Resend or Slack.

1. Keys unset (AC-4, AC-6): `env -u RESEND_API_KEY -u DEMO_USER_EMAIL -u SLACK_WEBHOOK_URL node --import ./spikes/no-network.mjs spikes/send-test.mjs`. Expect both lines to read `skipped: ...` and the run to exit 0.
2. Dry run (AC-2, AC-7, AC-8): `env RESEND_API_KEY=re_fake_key DEMO_USER_EMAIL=demo@example.invalid SLACK_WEBHOOK_URL=https://hooks.slack.com/triggers/TFAKE/1/fakefake node --import ./spikes/no-network.mjs spikes/send-test.mjs --dry-run`. Expect:
   - the redacted requests carrying the AC-2 text;
   - `dry run: nothing sent`;
   - exit 0;
   - no new folder under `spikes/samples/`;
   - none of the three fake values in the output.
3. Failure path (AC-5, AC-6, AC-8, AC-10): the same command without `--dry-run`. Expect:
   - both lines to read `failed` with the network-blocked reason, and exit 1;
   - a new `spikes/samples/delivery-<timestamp>/` holding the `.meta.json` files;
   - `grep -rE "re_fake_key|demo@example.invalid|fakefake" spikes/samples/delivery-*` to find nothing.
4. Channel flag (AC-3): step 3 with `--channel=slack` shows only a `slack` line. `--channel=sms` prints usage and exits 2.
5. Repo checks (AC-11, AC-14):
   - `git status --porcelain`;
   - `git check-ignore spikes/samples/any`;
   - `git diff --stat`;
   - `grep -nE "^import|from '" spikes/send-test.mjs spikes/channels/*.mjs spikes/no-network.mjs`.
6. Findings (AC-12): read `feature-design/local-demo/findings/delivery.md`.

These parts cannot be run offline, so the reviewer checks them by reading `spikes/channels/email-resend.mjs` and `spikes/channels/slack-webhook.mjs`:
- the 10-second timeout;
- that nothing is checked after the email send;
- how each Slack response is read (`ok`, JSON `"ok": true`, JSON `"ok": false`).

### Steps the user runs

1. Create a Resend account, create an API key with "Sending access" (enough since P-121), and note the address you signed up with.
2. In a Slack workspace you own:
   - create a channel just for the demo, such as `#event-alerts-demo`;
   - in Workflow Builder, create a workflow that starts from a webhook, has a `text` variable, and posts that variable to the demo channel;
   - publish the workflow, and copy its webhook URL (`hooks.slack.com/triggers/…`).
3. Add the three keys, then fill in their values in an editor: `! printf 'RESEND_API_KEY=\nDEMO_USER_EMAIL=\nSLACK_WEBHOOK_URL=\n' >> .env`
4. Optionally, check the requests first with `node --env-file-if-exists=.env spikes/send-test.mjs --dry-run`.
5. Run `node --env-file-if-exists=.env spikes/send-test.mjs` once. It sends two messages.
6. Check your inbox (and spam) and the Slack channel by hand.
7. Paste the printed output, and what you saw in step 6, back into the session. The executor records them in the findings' "Live runs" section (AC-13).

Success: steps 1 to 6 of the offline checks behave as stated, and AC-13 is filled in from the user's run. There are no unit tests (roadmap Decisions).

## Decisions from the interview

All decided by the user in P-109, unless a later prompt is named.

- **Email service:** Resend only, as I recommended. Postmark, SendGrid and SES are not tried.
- **Sender and recipient:** Resend's test sender `onboarding@resend.dev`, to the address the user signed up to Resend with. No domain verification. As I recommended.
- **Slack destination:** a webhook that posts to a channel used only for the demo, in a workspace the user owns. As I recommended.
- **Slack webhook kind (P-118, D-57):**
  - The user's live runs showed that `SLACK_WEBHOOK_URL` is a Workflow Builder webhook (`hooks.slack.com/triggers/…`), not a classic incoming webhook. It answered HTTP 200 with JSON `{"ok":true}`, and earlier, before the workflow was published, HTTP 400 `{"ok":false,"error":"workflow_not_published"}`.
  - The user's words: "Workflow webhook is fine for MVP". The user sets up a `text` variable in the workflow.
  - So Slack `delivered` also covers JSON `"ok": true`, and JSON `"ok": false` is `failed` with its `error`. The request body stays `{"text": …}`.
- **What "delivered" means:**
  - email: accepted by Resend (a 2xx). Since P-121 there is no status lookup; originally there was one after about 10 seconds;
  - Slack: HTTP 200 with the body `ok` or, since P-118, JSON `"ok": true`;
  - the user confirms the inbox and the channel by hand.

  As I recommended, amended by P-121.
- **Email status lookup dropped (P-121, D-58):**
  - The user's words: "Fine to descope, so sender Resend key is fine, no need for lookup."
  - Email counts as delivered on a 2xx from Resend, with no status lookup, no 10-second wait and no email-status samples. A "Sending access" key is enough.
  - The findings keep the accepted-versus-delivered gap, and that a lookup needs a key with more than "Sending access" (HTTP 401 `restricted_api_key` seen live), as a note for M5.
  - This removes Claude's tier-two rule that a bounce reported by the lookup counts as `failed`.
- **Failure cases:** happy path only. User's words: "Go for the happy path." No failure is caused on purpose and there is no `--fail` flag. Failure cases and limits in the findings come from the docs, plus any natural failure, and the command still prints `failed` with the reason on any error. **Override:** I recommended causing a set of safe, free failures on each channel.
- **Live sends:** user's words: "No, I run them". Agents make no live sends and verify offline, and the user runs every live send and pastes the output. **Override:** I recommended letting the executor send live, capped at 10 sends per channel.
- **Test message wording:** the subject and body in AC-2, plain text, with no event content. As I recommended.
- **Keys and dependencies:** `RESEND_API_KEY`, `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` in `.env`, added by the user. A missing key skips its channel. No npm packages or SDKs. As I recommended.
- **Timeout:** 10 seconds per request, counted as `failed`, with no retry (DEC-20). As I recommended.

Tier two, decided by Claude:

- **Layout:** `spikes/send-test.mjs`, with one module per channel in `spikes/channels/`, and the findings at `findings/delivery.md`. This mirrors M1's runner, its per-source modules and `findings/data-sources.md`.
- **Samples folder:** `spikes/samples/delivery-<run timestamp>/`. The prefix keeps M2's runs apart from M1's, and nothing already in `spikes/samples/` is touched.
- **Command shape:** both channels by default, with `--channel=email|slack` to pick one and `--dry-run` to print without sending. Bad usage exits 2.
- **Exit codes:** 0 if every channel was delivered or skipped, 1 if any failed, as in M1.
- **Email that bounces is `failed`:** removed by P-121, since there is no status lookup.
- **Both Slack webhook kinds accepted (P-118):** the script reads both the plain `ok` and the JSON `ok` response, so a classic incoming webhook still works if the user switches.
- **The email address is redacted too:** `DEMO_USER_EMAIL` is masked like the two secrets, so the user can paste the output into the session and the logs without exposing it.
- **Offline guard `spikes/no-network.mjs`:** loaded with `--import`, it replaces `fetch` with one that throws. Agents can then exercise the dry run and the failure printing with no risk of a live call, even if the code has a bug.
- **Plain text only:** no HTML email and no Slack formatting. It is the least that shows delivery, and formatting goes with the M5 wording.
- **README:** M2 gets its own section in the existing `spikes/README.md` rather than a new file, so all the spikes share one how-to-run page.
- **UTC time format:** ISO 8601 to the second, with `Z`. It is unambiguous and matches the timestamps in the samples.
