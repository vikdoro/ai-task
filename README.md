# ai-task

An assessment project built with Claude Code. The app is designed in [`feature-design/`](feature-design/), starting from the assessment brief ([`original-brief.md`](original-brief.md)). The local demo is done and frozen in [`feature-design/local-demo/`](feature-design/local-demo/). The MVP's spec ([`feature-design/product-spec.md`](feature-design/product-spec.md)) and roadmap ([`feature-design/mvp/roadmap.md`](feature-design/mvp/roadmap.md)) are approved, and its milestones are next.

The record of how the AI was directed is as much the deliverable as the app. Start at [`submission-docs/README.md`](submission-docs/README.md):

- [`submission-docs/workflow.md`](submission-docs/workflow.md): the agentic workflow (subagents, skills, approval gates).
- [`submission-docs/process-logs.md`](submission-docs/process-logs.md): the prompt, decision, intervention and check logs, and how to read them.

## Run the local demo

Node, version in [`.nvmrc`](.nvmrc).

```sh
npm install
npm test
DEMO_USER_EMAIL=you@example.com POLLING=off npm start   # then open http://127.0.0.1:3000/ and set up the alert
npm run poll:once                                       # in a second terminal; then see http://127.0.0.1:3000/admin
```

That runs on the made-up demo samples in [`samples/`](samples/), with sending faked. [`RUNNING.md`](RUNNING.md) walks through it step by step, then adds real email, Slack and live sources.
