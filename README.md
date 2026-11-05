# AI-task

An assessment project built with Claude Code. The purpose of the repo is to show how I work with AI.

Reflections on how it went: [`submission-docs/reflections.md`](submission-docs/reflections.md)

The app is designed in [`submission-docs/feature-design/`](submission-docs/feature-design/), starting from the assessment brief ([`original-brief.md`](original-brief.md)). The local demo is done and frozen in [`submission-docs/feature-design/local-demo/`](submission-docs/feature-design/local-demo/). The MVP's spec ([`submission-docs/feature-design/product-spec.md`](submission-docs/feature-design/product-spec.md)) and roadmap ([`submission-docs/feature-design/mvp/roadmap.md`](submission-docs/feature-design/mvp/roadmap.md)) are approved, and its milestones are next.

The record of how the AI was directed is as much the deliverable as the app. Start at [`submission-docs/README.md`](submission-docs/README.md):

- [`submission-docs/workflow.md`](submission-docs/workflow.md): the agentic workflow (subagents, skills, approval gates).
- [`submission-docs/process-logs/process-logs.md`](submission-docs/process-logs/process-logs.md): the prompt, decision, intervention and check logs, and how to read them.

## Run the local demo

Node, version in [`.nvmrc`](.nvmrc).

```sh
npm install
npm test
DEMO_USER_EMAIL=you@example.com POLLING=off npm start   # then open http://127.0.0.1:3000/ and set up the alert
npm run poll:once                                       # in a second terminal; then see http://127.0.0.1:3000/admin
```

That runs on the made-up demo samples in [`samples/`](samples/), with sending faked. [`RUNNING.md`](RUNNING.md) walks through it step by step, then adds real email, Slack and live sources.
