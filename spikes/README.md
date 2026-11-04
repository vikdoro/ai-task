# Spikes: try the data sources (M1)

Throwaway scripts for spec `feature-design/local-demo/milestones/01-try-the-data-sources.md`. No dependencies: Node's built-in `fetch` and `node:` modules only. Findings are in `feature-design/local-demo/findings/data-sources.md`.

## Keys

Put these in a `.env` file at the repo root (gitignored). Key names only are listed in `.env.example`.

| Name | Used for | Without it |
|---|---|---|
| `TWELVE_DATA_API_KEY` | Twelve Data quotes | `twelvedata` is skipped |
| `EVENT_REGISTRY_API_KEY` | Event Registry event search (breaking news) | `eventregistry` is skipped |

GDACS needs no key.

## Run

```sh
node --env-file-if-exists=.env spikes/fetch-sources.mjs           # one round
node --env-file-if-exists=.env spikes/fetch-sources.mjs --watch   # 4 rounds, about a minute apart, ~3 minutes
env -u TWELVE_DATA_API_KEY -u EVENT_REGISTRY_API_KEY node spikes/fetch-sources.mjs   # keys unset
```

`env -u` does not override `--env-file-if-exists=.env`, which loads the keys back from `.env`. To run with keys unset, leave out `--env-file-if-exists`.

Each round makes these calls:
- GDACS: two calls, filtered and unfiltered.
- Twelve Data: one batch quote for SPY, QQQ, EUR/USD, BTC/USD, GLD and USO, costing 6 credits. Calls are kept at least 61 seconds apart, so no minute holds more than 6 credits.
- Event Registry: one event search, `POST https://eventregistry.org/api/v1/event`. It asks for English events dated the current or previous UTC day, sorted by article count, up to 50, with title, date, location, categories and article counts.

A single run is 1 Event Registry search and a watch is 4.

Exit code: 0 if every source was `ok` or `skipped`, 1 if any `failed`.

## Output and samples

For each source the run prints one line: name, `ok` / `failed` / `skipped`, item count and age of the newest item. Event Registry dates are whole days, so its age is measured from midnight UTC of the newest event date.

Then the details:
- every GDACS event, in the first round only;
- each quote;
- the Event Registry events by article count, each with rank, count, title, date, location and id;
- from round 2 on, what changed since the previous round;
- at the end, the number of Event Registry requests made.

Raw responses go to `spikes/samples/<run timestamp>/round-N/` (gitignored). Each call also gets a `.meta.json` with the redacted request URL and headers, the status and the response headers. The Event Registry request body is saved as `eventregistry-request.json`. `run.json` in the run folder holds the round times. Both key values are replaced with `<NAME>` in everything saved or printed.

# Spikes: try email and Slack delivery (M2)

Throwaway script for spec `feature-design/local-demo/milestones/02-try-email-and-slack-delivery.md`. No dependencies: Node's built-in `fetch` and `node:` modules only. Findings are in `feature-design/local-demo/findings/delivery.md`.

## Keys

In the same `.env` (gitignored); names only in `.env.example`.

| Name | Used for | Without it |
|---|---|---|
| `RESEND_API_KEY` | Resend send; a "Sending access" key is enough | `email` is skipped |
| `DEMO_USER_EMAIL` | Recipient; must be the address the Resend account was signed up with, since the test sender `onboarding@resend.dev` delivers only there | `email` is skipped |
| `SLACK_WEBHOOK_URL` | Slack Workflow Builder webhook (`hooks.slack.com/triggers/...`) whose workflow has a `text` variable and posts it to the demo channel; a classic incoming webhook (`hooks.slack.com/services/...`) also works. It is a secret, like a key | `slack` is skipped |

## Run

```sh
node --env-file-if-exists=.env spikes/send-test.mjs                   # both channels
node --env-file-if-exists=.env spikes/send-test.mjs --channel=email   # or --channel=slack
node --env-file-if-exists=.env spikes/send-test.mjs --dry-run         # print the requests, send nothing
```

A run makes at most one send per channel and nothing else; there is no email status lookup (P-121). Every request times out after 10 seconds and nothing is retried. Agents only run it offline, with `node --import ./spikes/no-network.mjs spikes/send-test.mjs ...`, which makes every `fetch` throw.

Exit code: 0 if every channel was `delivered` or `skipped`, 1 if any `failed`, 2 on bad usage.

## Output and samples

One line per channel: `email` or `slack`, then `delivered`, `failed` or `skipped`, then the detail. Email `delivered` means Resend accepted the send (a 2xx with an id), and the line shows the id; whether it reached the inbox is checked by hand. Slack `delivered` means HTTP 200 with the body `ok` (classic webhook) or JSON `"ok": true` (workflow webhook); JSON `"ok": false` reads `failed` with its `error`, such as `workflow_not_published`.

Except in a dry run, each request's raw response and a `.meta.json` (redacted request, time sent, status and response headers, or the error) go to `spikes/samples/delivery-<run timestamp>/` (gitignored). The three key values are replaced with `<NAME>` in everything printed or saved, so the output can be pasted as is.
