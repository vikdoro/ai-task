# ai-task

An assessment project built with Claude Code. The app is designed in [`feature-design/`](feature-design/), starting from the assessment brief: the local demo is done ([`feature-design/local-demo/`](feature-design/local-demo/)) and the MVP is next. How the AI was directed is logged in [`submission-docs/`](submission-docs/README.md).

The record of how the AI was directed is as much the deliverable as the app:

- [`submission-docs/workflow.md`](submission-docs/workflow.md): the agentic workflow (subagents, skills, approval gates).
- [`submission-docs/process-logs.md`](submission-docs/process-logs.md): the prompt, decision, intervention and check logs, and how to read them.

## Setup

Node, version in [`.nvmrc`](.nvmrc).

```
npm install
```

## Run the local demo

The app polls GDACS, Twelve Data and Event Registry, stores every event they report, and shows them read-only at `http://127.0.0.1:3000/admin`. It listens on localhost only and has no login.

By default it replays the samples saved by M1 in `spikes/samples/` and makes no network request. Live polling happens only when `SOURCE_MODE=live` is set on the command line; never put `SOURCE_MODE` in `.env`.

```sh
npm test                              # unit and end-to-end tests, network blocked
npm run poll:once                     # poll each source once from the samples, one line per source
npm start                             # build, then serve /admin from the samples (data/samples.db)

SOURCE_MODE=live npm run poll:once    # live: 1 GDACS request, 6 Twelve Data credits, 5 Event Registry tokens
SOURCE_MODE=live npm start            # live polling: GDACS every 10 min, Twelve Data every 15, Event Registry every 60
```

- `SOURCE_MODE`: `samples` (default) or `live`. Any other value stops the server, and `poll:once` exits 2.
- Live mode reads `TWELVE_DATA_API_KEY` and `EVENT_REGISTRY_API_KEY` from `.env`. A missing key shows that source as "not configured". GDACS needs no key.
- Samples mode writes `data/samples.db`, live mode `data/app.db` (both gitignored). `DB_PATH` and `SAMPLES_DIR` override the paths.
- `poll:once` exits 0 if no source failed and 1 if any did.
- Event Registry stops when fewer than 200 of its tokens remain, and shows "paused: token floor reached".

### The user screen

`http://127.0.0.1:3000/` is the demo user's screen, also served by `npm start`. There they set up their one alert by picking email, Slack or both, change its channels, and delete it after confirming.

- The channels come from `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` in `.env`. A missing key shows that channel as "(not set up)", and it cannot be ticked.
- Each save copies whichever of the two values are set into the alert, and keeps the stored ones otherwise. The webhook URL never reaches the browser, and neither value reaches `/admin`.
- The alert is stored in the database of the mode in use, so one set up in samples mode does not carry over to live.
- `GET`, `PUT` and `DELETE` `/api/alert` read, save and delete it. `PUT` takes `{ "email": boolean, "slack": boolean }`.

### Alerts delivered

After every poll, each event that made its kind's cut is matched once against the alert. If the alert existed when the event made the cut and has channels ticked, one plain-text message goes to each ticked channel: email through Resend, Slack through the stored webhook. Each channel is sent an event once, ever; a failure is recorded and not retried. `/admin` shows the outcome under `Alerts fired`.

By default nothing is sent: deliveries are faked and recorded as `Delivered (fake: not sent)`. Real sending happens only with `DELIVERY_MODE=live` on the command line; never put `DELIVERY_MODE` or `POLLING` in `.env`.

```sh
DELIVERY_MODE=live npm run poll:once  # samples replay, real email and Slack for each new event that is sent
POLLING=off npm start                 # serve / and /admin without polling: no startup poll, scheduled polls skipped
```

- `DELIVERY_MODE`: `fake` (default) or `live`, independent of `SOURCE_MODE`. Live mode reads `RESEND_API_KEY` from `.env`; the address and webhook are the ones stored in the alert.
- `POLLING`: `on` (default) or `off`, read by the server only. Any other value of either stops the server, and a bad `DELIVERY_MODE` makes `poll:once` exit 2.
- After its source lines, `poll:once` prints one `alert sent ...` line per event it sent and `alerts: <n> sent, <m> not sent`. Its exit code still depends only on the sources.
- A delivery still in progress when its process stopped shows as `Failed: interrupted, outcome unknown` and is never resent.

### The journey run (J-01)

Run once, by the user, on the samples with real delivery, against a fresh database:

1. `DB_PATH=data/journey.db POLLING=off npm start`
2. Open `http://127.0.0.1:3000/` and set up the alert with email and Slack.
3. In a second terminal: `DB_PATH=data/journey.db DELIVERY_MODE=live npm run poll:once`
4. Check the inbox and the Slack demo channel, and `Alerts fired` on `http://127.0.0.1:3000/admin`.
5. Run step 3 again: expect `alerts: 0 sent, 0 not sent` and no new message.
