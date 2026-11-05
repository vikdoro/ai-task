# AI-task

An assessment project built with Claude Code. The purpose of the repo is to show how I work with AI.

Reflections on how it went: [`submission-docs/reflections.md`](submission-docs/reflections.md)

What was built and why: [`submission-docs/feature-design/what-was-built-and-why.md`](submission-docs/feature-design/what-was-built-and-why.md)

The agentic workflow: [`submission-docs/workflow.md`](submission-docs/workflow.md)

Prompt history, checks, decisions, interventions, grouped by phases: [`submission-docs/process-logs/phases.md`](submission-docs/process-logs/phases.md)

## Run the local demo

Node, version in [`.nvmrc`](.nvmrc).

```sh
npm install
npm test
DEMO_USER_EMAIL=you@example.com POLLING=off npm start   # then open http://127.0.0.1:3000/ and set up the alert
npm run poll:once                                       # in a second terminal; then see http://127.0.0.1:3000/admin
```

That runs on the made-up demo samples in [`samples/`](samples/), with sending faked. [`RUNNING.md`](RUNNING.md) walks through it step by step, then adds real email, Slack and live sources.
