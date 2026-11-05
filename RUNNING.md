# Running the local demo

The local demo is one person's journey on one machine. The app polls three sources (natural disasters from GDACS, market moves from Twelve Data, breaking news from Event Registry) and keeps the events that clear their kind's bar. It sends an alert to email and Slack for each event that clears, and shows everything read-only at `/admin`. It listens on localhost only and has no login.

Each step below adds one thing and is optional beyond the first. Steps 1 and 2 need no account and make no network request.

## 1. Install and test

Node, version in [`.nvmrc`](.nvmrc) (26).

```sh
npm install
npm test        # unit and end-to-end tests; the network is blocked during tests
```

## 2. Try it with no keys

By default the app replays the demo samples in [`samples/`](samples/): three rounds of made-up events, one of each kind, with generic names such as "Sample tropical cyclone" and "Sample major news story". Each message names its category, for example "Natural disaster: Sample tropical cyclone". Sending is faked, so nothing leaves the machine.

In one terminal, start the server without polling, so it only serves the screens:

```sh
DEMO_USER_EMAIL=you@example.com POLLING=off npm start
```

`npm start` builds the app and serves it on port 3000, which must be free.

1. Open http://127.0.0.1:3000/, tick Email and save the alert. Slack shows "(not set up)" until step 4.
2. In a second terminal, poll the samples once:

   ```sh
   npm run poll:once
   ```

   Each run replays the next round:

   | Run | What it sends |
   |---|---|
   | 1 | One alert of each kind: a tropical cyclone, a US stock index fund up 3.6%, a major news story. `alerts: 3 sent, 0 not sent` |
   | 2 | Four new ones: an earthquake, bitcoin up 9.2%, gold down 3.4%, a second news story. The cyclone and the first story come again and are not resent. `alerts: 4 sent, 0 not sent` |
   | 3 | A quiet round: nothing new clears its bar. `alerts: 0 sent, 0 not sent` |

   Every round also holds events below their bar (a flood, a past earthquake, small market moves, minor stories), which show in Events in but are never sent.
3. Open http://127.0.0.1:3000/admin. Events in shows what came in and whether it made the cut. Alerts fired shows `Delivered (fake: not sent)` for email.

To start again, delete `data/samples.db`.

## 3. Real email

The demo sends email through [Resend](https://resend.com).

1. Create a free Resend account, and an API key with **Sending access**.
2. Add the key and the address alerts go to. Without a verified domain, Resend sends only to the address the account was created with, so use that one:

   ```sh
   printf 'RESEND_API_KEY=re_...\n' >> .env
   printf 'DEMO_USER_EMAIL=the-address-you-signed-up-with@example.com\n' >> .env
   ```

   A value set on the command line wins over `.env`, so leave `DEMO_USER_EMAIL=...` off the commands from now on.
3. Run the journey in step 5.

Mail comes from `onboarding@resend.dev` and may land in spam.

## 4. Slack

Slack takes a webhook URL that posts to one channel. The app sends `{"text": "..."}` and reads either kind of webhook:

- **Incoming webhook** (`https://hooks.slack.com/services/...`): create a Slack app, turn on Incoming Webhooks, and add one to the channel you want.
- **Workflow Builder webhook** (`https://hooks.slack.com/triggers/...`), which the demo used: needs a paid Slack plan. Make a workflow that starts from a webhook, define a text variable named exactly `text`, add a step that posts `text` to a channel, and publish it. Without the `text` variable, Slack answers `ok` but posts nothing ([`findings/delivery.md`](submission-docs/feature-design/local-demo/findings/delivery.md#slack-webhooks)).

```sh
printf 'SLACK_WEBHOOK_URL=https://hooks.slack.com/...\n' >> .env
```

The URL is a secret: it never reaches the browser or `/admin`.

## 5. The journey, with real delivery

Run on the demo samples, against a fresh database. `DELIVERY_MODE=live` sends for real; leave it off and sending is faked.

1. `DB_PATH=data/journey.db POLLING=off npm start`
2. Open http://127.0.0.1:3000/ and set up the alert with email, Slack or both.
3. In a second terminal: `DB_PATH=data/journey.db DELIVERY_MODE=live npm run poll:once`
4. Check the inbox, the Slack channel, and Alerts fired at http://127.0.0.1:3000/admin. Expect three messages on each channel.
5. Run step 3 again: four new messages, and none of the first three again.

## 6. Live sources (optional)

Live polling calls the real sources. It happens only with `SOURCE_MODE=live` on the command line, uses `data/app.db`, and needs two keys (GDACS needs none). A missing key shows that source as "not configured".

```sh
printf 'TWELVE_DATA_API_KEY=...\n' >> .env       # twelvedata.com, free plan
printf 'EVENT_REGISTRY_API_KEY=...\n' >> .env    # eventregistry.org, free plan

SOURCE_MODE=live npm run poll:once    # one round: 1 GDACS request, 6 Twelve Data credits, 5 Event Registry tokens
SOURCE_MODE=live npm start            # polls GDACS every 10 min, Twelve Data every 15, Event Registry every 60
```

Event Registry's free allowance is 2,000 tokens that never renew. The app stops polling it when fewer than 200 remain, and shows "paused: token floor reached".

## Reference

Switches, set on the command line only, never in `.env`. Any other value stops the server, and `poll:once` exits 2.

| Variable | Values | What it does |
|---|---|---|
| `SOURCE_MODE` | `samples` (default), `live` | Replay samples, or call the sources |
| `DELIVERY_MODE` | `fake` (default), `live` | Record deliveries as `fake: not sent`, or send them |
| `POLLING` | `on` (default), `off` | Server only: `off` skips the startup poll and the scheduled polls |

Paths:
- `SAMPLES_DIR` defaults to `samples/`, the committed demo set. The real responses recorded during development are in `spikes/samples/`, which is gitignored and exists only on the developer's machine: `SAMPLES_DIR=spikes/samples` replays them.
- `DB_PATH` defaults to `data/samples.db`, or `data/app.db` in live mode. Both are gitignored.

Behaviour:
- `poll:once` prints one line per source, then one `alert sent ...` line per event it sent, and `alerts: <n> sent, <m> not sent`. It exits 0 if no source failed and 1 if any did. Alerts don't change the exit code.
- An event that cleared its bar before the alert was set up is not sent. Each channel gets an event at most once, ever. A failure is recorded and not retried.
- A delivery still in progress when its process stopped shows as `Failed: interrupted, outcome unknown` and is never resent.
- `GET`, `PUT` and `DELETE` `/api/alert` read, save and delete the alert. `PUT` takes `{ "email": boolean, "slack": boolean }`. Each save copies whichever of `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` are set into the alert, and keeps the stored values otherwise.
- The alert is stored in the database in use, so one set up on the samples doesn't carry over to live.
