# ai-task

An assessment project built with Claude Code. The app is designed in [`feature-design/`](feature-design/) (in progress), starting from the assessment brief.

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
