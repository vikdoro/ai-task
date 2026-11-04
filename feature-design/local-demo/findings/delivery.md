# Findings: email and Slack delivery (M2)

Spec: [`../milestones/02-try-email-and-slack-delivery.md`](../milestones/02-try-email-and-slack-delivery.md). Script: [`spikes/`](../../../spikes/README.md) (M2 section). The raw responses stay local in `spikes/samples/delivery-*/` (gitignored).

Only the happy path was tried (P-109). No failure was caused on purpose, so every failure case below comes from the docs unless it is marked as seen in a run. This note contains no alert wording (OQ-07, M5).

Labels: **[docs]** = read on the linked page on 2026-11-04; **[run]** = seen in one of the user's live runs (see [Live runs](#live-runs)); **[secondhand]** = not found on an official page, taken from third-party guides and still to be confirmed.

## Email: Resend

Call used, with built-in `fetch` and no SDK:

- Send: `POST https://api.resend.com/emails`, `Authorization: Bearer <key>`, JSON body with `from`, `to`, `subject` (required) and `text`. A 2xx returns `{"id": "..."}`. [docs] https://resend.com/docs/api-reference/emails/send-email

Since P-121 (D-58) the script counts a 2xx with an id as `delivered` (`email delivered (accepted, id <id>)`) and checks nothing after the send, so a "Sending access" key is enough. Whether the email reached the inbox is the user's hand check. The rest of this subsection and the two below are notes for M5.

### Note for M5: a status lookup needs more than a "Sending access" key

- The lookup endpoint is `GET https://api.resend.com/emails/{id}`; the status is its `last_event` field [docs] https://resend.com/docs/api-reference/emails/retrieve-email.
- Seen in run 1 [run], before P-121 removed the lookup: the send with the user's key was accepted (HTTP 200, id returned), but the lookup got HTTP 401 with `{"statusCode":401,"message":"This API key is restricted to only send emails","name":"restricted_api_key"}`. The live message has no trailing period, unlike the docs' wording.
- The docs list this as 401 `restricted_api_key`, "This API key is restricted to only send emails", and say to use a key with **Full access** for anything other than sending [docs] https://resend.com/docs/api-reference/errors. So a lookup (or any polling in M5) needs a Full access key; a Sending access key is enough only to send.
- Also seen in run 1 [run]: the send response carried `ratelimit-limit: 10`, `ratelimit-policy: 10;w=1`, `x-resend-daily-quota: 0` and `x-resend-monthly-quota: 0`. The quota headers read 0 after a send; what 0 counts (used or remaining) is not stated on the rate-limit page and is not settled here.

### Free-use limits and terms

| Item | Value | Source |
|---|---|---|
| Daily quota (Free plan only) | 100 emails a day, reset at midnight UTC, not rolling. Sent and received emails both count. Returned in the `x-resend-daily-quota` header | [docs] https://resend.com/pricing, https://resend.com/docs/api-reference/rate-limit, https://resend.com/docs/api-reference/errors |
| Monthly quota | 3,000 emails a month on Free. Returned in `x-resend-monthly-quota` | [docs] https://resend.com/pricing, https://resend.com/docs/api-reference/rate-limit |
| Request rate limit | 10 requests per second per team, the same on every plan. Headers `ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset`, `retry-after` | [docs] https://resend.com/docs/api-reference/rate-limit, https://resend.com/pricing |
| Test sender | Without a verified domain, test email goes only to the account's own address; anything else is a 403 `validation_error` "You can only send testing emails to your own email address". That the sender to use is `onboarding@resend.dev` is from the spec and third-party guides; no official page found states it | [docs] https://resend.com/docs/api-reference/errors; [secondhand] for `onboarding@resend.dev` |
| Test addresses | `delivered@`, `bounced@`, `complained@`, `suppressed@resend.dev` simulate those events and count against the quota. Not used (happy path only) | [docs] https://resend.com/docs/dashboard/emails/send-test-emails |
| Other Free limits | 3 domains, 1 webhook endpoint, 30-day data retention | [docs] https://resend.com/pricing |

### Failure cases the docs name

All from [docs] https://resend.com/docs/api-reference/errors. The page does not show the error body's JSON shape. Run 1 showed it [run]: `{"statusCode": ..., "message": "...", "name": "..."}`. The script reads `name` and `message`, falling back to the raw text.

| HTTP | Error name | Message (short) | Relevant to the demo? |
|---|---|---|---|
| 400 | `validation_error` | "An error was found with one or more fields in the request." / "API key is invalid" (non-sending endpoints, such as a status lookup) | yes, for a malformed send |
| 400 | `invalid_idempotency_key` | key length out of range | no (not sent) |
| 401 | `missing_api_key` | "Missing API Key" | yes |
| 401 | `restricted_api_key` | "This API key is restricted to only send emails." | not for the send; a Sending access key fails a status lookup with it. **Seen in run 1** [run], before P-121 |
| 401 | `validation_error` | "API key is invalid" (sending endpoints) | yes |
| 403 | `restricted_api_key` | "API key is not active" | yes |
| 403 | `suspended_api_key` | "This API key is suspended" | yes |
| 403 | `validation_error` | "You can only send testing emails to your own email address" | yes: `DEMO_USER_EMAIL` not the sign-up address |
| 403 | `validation_error` | "The `domain.com` domain is not verified..." | only if `from` changes |
| 403 | `validation_error` | domain registered already / inbox limit reached | no |
| 403 | `email_above_quota`, `invalid_permission` | received-email content / token scopes | no |
| 404 | `not_found` | "The requested endpoint does not exist." | yes, on a wrong URL |
| 405 | `method_not_allowed` | wrong method for the path | no |
| 409 | `concurrent_idempotent_requests`, `invalid_idempotent_request`, `resource_locked` | idempotency and locking | no |
| 422 | `missing_required_field`, `missing_required_parameter`, `invalid_parameter`, `invalid_attachment` | body or parameters wrong | yes for the first three |
| 429 | `daily_quota_exceeded` | "You have exceeded your daily email sending quota." | yes |
| 429 | `monthly_quota_exceeded` | "You have exceeded your monthly email sending quota." | yes |
| 429 | `rate_limit_exceeded` | "Too many requests. Please limit the number of requests per second." | unlikely at demo volume |
| 500 | `application_error` | "An unexpected error occurred." | yes |
| 503 | `service_unavailable` | "API is temporarily unavailable" | yes |

Plus the cases the script itself reports: a network error (code and message), and `timeout after 10s`.

### Note for M5: status values a lookup can return

From [docs] https://resend.com/docs/dashboard/emails/manage-emails (the retrieve page points to "all available `last_event` types" but lists only `delivered` in its example). Event descriptions also at https://resend.com/docs/dashboard/webhooks/event-types.

| `last_event` | Meaning (docs) | For M5: final? reached the recipient's server? |
|---|---|---|
| `queued` | Created from Broadcasts or Batches, queued for delivery | not final |
| `scheduled` | Scheduled for delivery | not final |
| `sent` | Sent successfully; Resend will attempt delivery to the recipient's server | not final (what a 2xx means) |
| `delivered` | Resend delivered it to the recipient's mail server | yes |
| `delivery_delayed` | Temporary issue; Resend retries for up to 14 hours, then marks it bounced | not final |
| `opened` | Recipient opened it (not always precise) | yes |
| `clicked` | Recipient clicked a link | yes |
| `complained` | Delivered, but the recipient marked it as spam | yes |
| `bounced` | The recipient's mail server rejected it (permanently, per the webhook page) | **no** |
| `failed` | The email failed to be sent | **no** |
| `suppressed` | Not sent: recipient is on the suppression list | **no** |
| `canceled` | A scheduled email was canceled by the user | **no** |

**Accepted is not delivered.** A 2xx with an id, which is all this spike counts as `delivered`, means only that Resend took the request (`sent`). The spike does not learn the final status. Delivery to the recipient's server (`delivered`) or a `bounced` comes later; a `delivery_delayed` email can take up to 14 hours to settle. Reaching the server is not reaching the inbox either: Resend cannot see spam-folder placement, which is why the user checks by hand.

**What M5 would need to learn the final status.** One of:

- Resend webhooks (`email.delivered`, `email.bounced`, `email.failed`, `email.suppressed`, `email.delivery_delayed`, `email.complained`). This needs a public HTTPS endpoint to receive them, so a server or a tunnel, and the Free plan allows 1 webhook endpoint [docs] https://resend.com/pricing. Out of scope for M2.
- Or a status lookup, `GET /emails/{id}`, once later or repeatedly until `last_event` is final, counting against the 10 requests a second limit. This needs a Full access key (above) and the id stored with the alert.

Either way the id from the send must be kept with the delivery record.

## Slack: webhooks

Since P-118 (D-57), `SLACK_WEBHOOK_URL` is a **Workflow Builder webhook**, not a classic incoming webhook. The script reads both kinds; both take `POST <URL>`, `Content-type: application/json`, body `{"text": "..."}`.

### The two webhook kinds

| | Classic incoming webhook | Workflow Builder webhook |
|---|---|---|
| URL | `https://hooks.slack.com/services/...` [docs] | `https://hooks.slack.com/triggers/...` followed by a random string, generated when the workflow is set up [docs] |
| Set up | A Slack app installed on one channel [docs] | A workflow that starts from a webhook. Its variables (up to 20 key-value pairs, typed text, channel ID, user ID or user email; no nested JSON) are defined in the trigger, and a step posts them [docs] |
| Success response | HTTP 200, plain-text body `ok` [docs] | HTTP 200, JSON `{"ok":true}` [run 2 to 4]. The help article documents no response format |
| Error response | HTTP 400/403/404 with a plain-text body such as `no_service` [docs] | JSON `{"ok":false,"error":"..."}`. Seen [run 1]: HTTP 400 `{"ok":false,"error":"workflow_not_published"}`, before the workflow was published |
| Script reads it as | body `ok` → `delivered (HTTP 200, body ok)` | `ok: true` → `delivered (HTTP 200, JSON ok: true)`; `ok: false` → `failed: HTTP <status> <error>` |
| Where it posts | One channel, fixed when the app is installed. "You cannot override the default channel"; the URL is "specific to a single user and a single channel" [docs] | Wherever the workflow's steps post. In this demo, the demo channel. The help article only describes posting to a channel; it does not say whether a workflow can DM a person, though it offers user ID and user email variable types [docs] |
| Can it target a user? | No [docs] | Not shown in the docs read; not tried |
| Plan | Not limited on the page read | "Available on paid plans" [docs] |
| Rate limit | 1 per second per channel, short bursts allowed; over it, HTTP 429 with `Retry-After` [docs] | "Webhook workflows are limited to one request per second" [docs] |

Sources: classic, https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks and https://docs.slack.dev/apis/web-api/rate-limits; workflow, https://slack.com/help/articles/360041352714-Build-a-workflow--Create-a-workflow-that-starts-outside-of-Slack.

**The workflow needs a `text` variable.** The script sends only `{"text": "..."}`, so the workflow's webhook trigger must define a text variable named `text`, and its post step must insert it. The help article says that if a variable the workflow expects is missing from the request, "the workflow would fail" [docs]. The reverse case, a body field the workflow has no variable for, is not documented. Runs 2 to 4 all got `{"ok":true}`, but only runs 3 and 4 were made with the `text` variable set up, and only in those did the test text appear in the channel [run]. So `ok: true` on its own does not show that the text was posted.

### Message size

Keep `text` to 4,000 characters; longer text may be split into messages of about 4,000, and over 40,000 characters it is truncated with a `message_truncated` warning. This is from the `chat.postMessage` page; neither webhook page names a size limit (the classic page names only a 100-attachment maximum), and Workflow Builder text variables have no size stated [docs] https://docs.slack.dev/reference/methods/chat.postMessage.

### Failure cases the docs name

Classic incoming webhook, from [docs] https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks. The page says webhooks return "more relevant HTTP status codes (like HTTP 400 Bad Request, HTTP 403 Forbidden, and HTTP 404 Not Found)" but does not map each body to a status. The body is plain text.

| Body text | Meaning (docs) |
|---|---|
| `invalid_payload` | Malformed request; do not retry without correcting it |
| `no_text` | The `text` field is missing |
| `too_many_attachments` | More than 100 attachments |
| `user_not_found` / `channel_not_found` | User or channel does not exist or is invalid |
| `channel_is_archived` | The channel no longer accepts messages |
| `action_prohibited` | An admin restricted posting; do not retry |
| `posting_to_general_channel_denied` | Posting to #general is restricted for the webhook's creator |
| `invalid_token` | Token expired, invalid or missing |
| `no_active_hooks` | The webhook is disabled |
| `no_service` | The webhook is disabled, removed or invalid (also what a revoked, leaked URL would give) |
| `no_service_id` | Service id invalid or missing |
| `no_team` | Workspace missing or invalid |
| `team_disabled` | Workspace no longer active |
| (HTTP 429) | Rate limited, with `Retry-After` [docs] https://docs.slack.dev/apis/web-api/rate-limits |

Workflow Builder webhook: the help article documents no error codes. Known so far:

| Status | Body | Meaning | Source |
|---|---|---|---|
| 400 | `{"ok":false,"error":"workflow_not_published"}` | The workflow was not published yet | [run 1] |
| — | — | A variable the workflow expects is missing from the request: "the workflow would fail". Whether that shows in the HTTP response or only in Slack is not documented | [docs] help article above |

Plus, for either kind, the cases the script itself reports: a network error, `timeout after 10s`, and a response that is neither the body `ok` nor JSON `ok: true`.

### FR-02 and the URL as a secret

- **For FR-02 ("the Slack account it delivers to"):** with either kind, the admin does not pick a Slack *account*; they paste one URL. A classic webhook stands for one channel in one workspace and cannot reach a user. A workflow webhook posts wherever its workflow says (here, the demo channel); whether a workflow could DM a person was not checked. The user accepted the workflow webhook for the MVP ("Workflow webhook is fine for MVP", P-118). Delivering to a chosen person instead would need a Slack app with a bot token and `chat.postMessage`, which is out of scope for M2.
- **The URL is a secret.** Classic: "Your webhook URL contains a secret. Don't share it online, including via public version control repositories." and "Slack actively searches out and revokes leaked secrets." Workflow: "Be sure to keep your request URL secure", because "anyone with the link will have the ability to start your workflow" [docs]. The script redacts it to `<SLACK_WEBHOOK_URL>` in everything printed or saved.

## Failure reasons each channel can give the admin view (for FR-09, M5)

Email (Resend):

- key missing, invalid, restricted, inactive or suspended (and, if M5 adds a status lookup, `restricted_api_key` from a Sending access key, seen in run 1) (`missing_api_key`, `validation_error` "API key is invalid", `restricted_api_key`, `suspended_api_key`);
- recipient not allowed by the test sender ("You can only send testing emails to your own email address");
- quota used up, daily or monthly (`daily_quota_exceeded`, `monthly_quota_exceeded`), or rate limited (`rate_limit_exceeded`);
- request invalid (`validation_error`, `missing_required_field`, `invalid_parameter`);
- Resend down (`application_error`, `service_unavailable`);
- accepted, then not delivered: `bounced`, `failed`, `suppressed` (only known from a later lookup or a webhook);
- delayed: `delivery_delayed` (not final);
- network error or timeout.

Slack (either webhook kind):

- workflow not published (`workflow_not_published`, workflow webhook, seen in run 1), or a workflow variable missing (workflow fails, per the help article);
- webhook gone or disabled (`no_service`, `no_active_hooks`, `invalid_token`, classic webhook);
- channel archived or missing (`channel_is_archived`, `channel_not_found`);
- posting restricted (`action_prohibited`, `posting_to_general_channel_denied`);
- workspace gone (`no_team`, `team_disabled`);
- request invalid (`invalid_payload`, `no_text`);
- rate limited (HTTP 429);
- network error or timeout.

## Live runs

All five runs were made by the user with `node --env-file-if-exists=.env` and saved under `spikes/samples/`. Statuses and bodies are read from the saved files; the printed lines are the user's pasted output. Runs 1 and 2 were made with earlier code: run 1 still had the email status lookup (removed by P-121, D-58), and runs 1 and 2 read Slack as a classic webhook only (changed by P-118, D-57).

| Run | Time sent (UTC) | Command | Samples folder |
|---|---|---|---|
| 1 | 2026-11-04 20:12:16 (lookup 20:12:27) | `node --env-file-if-exists=.env spikes/send-test.mjs` | `delivery-2026-11-04T20-12-16-919Z` |
| 2 | 2026-11-04 20:15:26 | `node --env-file-if-exists=.env spikes/send-test.mjs --channel=slack` | `delivery-2026-11-04T20-15-26-303Z` |
| 3 | 2026-11-04 20:19:12 | `node --env-file-if-exists=.env spikes/send-test.mjs --channel=slack` | `delivery-2026-11-04T20-19-12-566Z` |
| 4 | 2026-11-04 20:19:40 | `node --env-file-if-exists=.env spikes/send-test.mjs --channel=slack` | `delivery-2026-11-04T20-19-40-714Z` |
| 5 | 2026-11-04 20:32:54 | `node --env-file-if-exists=.env spikes/send-test.mjs` | `delivery-2026-11-04T20-32-54-005Z` |

**Run 1** (both channels). Printed:

```
email accepted (id 01a1a830-de3d-796c-b7fb-335f458c6718), looking up its status in 10s
email delivered (accepted, id 01a1a830-de3d-796c-b7fb-335f458c6718, status lookup failed: HTTP 401 restricted_api_key: This API key is restricted to only send emails)
slack failed: HTTP 400: {"ok":false,"error":"workflow_not_published"}
samples in /Users/viktordorozsmai/dev/ai-task/spikes/samples/delivery-2026-11-04T20-12-16-919Z
```

- Email: the send got HTTP 200 with an id. The status lookup got HTTP 401 `restricted_api_key` from the Sending access key. With the current code the email line would read `email delivered (accepted, id 01a1a830-de3d-796c-b7fb-335f458c6718)`.
- Slack: HTTP 400 `{"ok":false,"error":"workflow_not_published"}`, because the workflow was not yet published. With the current code: `slack failed: HTTP 400 workflow_not_published`.
- Natural failures: the `restricted_api_key` status lookup and `workflow_not_published`.
- Hand check: the email arrived in the **inbox** (user, P-118). Nothing was posted to Slack.
- Email status lookup: not done. The Sending access key got `restricted_api_key`; delivery was confirmed by hand in the inbox. The lookup was then descoped (P-121).

**Run 2** (`--channel=slack`, after the workflow was published, before the `text` variable was set up). Printed:

```
slack failed: HTTP 200: {"ok":true}
samples in /Users/viktordorozsmai/dev/ai-task/spikes/samples/delivery-2026-11-04T20-15-26-303Z
```

- Slack: HTTP 200 `{"ok":true}`, which the code then did not count as success. With the current code: `slack delivered (HTTP 200, JSON ok: true)`. This run led to D-57.
- Hand check: a message showed in the demo channel (user, P-118).

**Run 3** (`--channel=slack`, with the `text` variable set up, current code).
- Slack: HTTP 200 `{"ok":true}`. Printed: `slack delivered (HTTP 200, JSON ok: true)`.
- Body sent: `{"text":"This is a test message from the world event alerts local demo, sent 2026-11-04T20:19:12Z. No action needed."}`.
- Hand check: the test text appeared in the demo channel (user, P-120: "Yep, Slack variable worked.").

**Run 4** (`--channel=slack`, the same setup as run 3).
- Slack: HTTP 200 `{"ok":true}`. Printed: `slack delivered (HTTP 200, JSON ok: true)`.
- Body sent: `{"text":"This is a test message from the world event alerts local demo, sent 2026-11-04T20:19:40Z. No action needed."}`.
- Hand check: the test text appeared in the demo channel (user, P-120).

**Run 5** (both channels, final code; the first both-channel run of the final code, P-132). Printed:

```
email delivered (accepted, id 01a1a843-bf50-73fd-b04f-eee312815660)
slack delivered (HTTP 200, JSON ok: true)
samples in /Users/viktordorozsmai/dev/ai-task/spikes/samples/delivery-2026-11-04T20-32-54-005Z
```

- Hand check: the email arrived in the **inbox**, and the test text appeared in the demo channel (user, P-132).

No failure other than the two in run 1 happened in these runs.
