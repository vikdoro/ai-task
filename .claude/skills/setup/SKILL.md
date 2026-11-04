---
name: setup
description: Prepare this repo for the flow workflow - write the workflow section into CLAUDE.md and the spec templates. Invoke as /setup.
---

Prepare the current repo, once. The templates are in `.claude/templates/` at the repo root; paths below
like `templates/...` are relative to `.claude/`.

Never commit or push. Never overwrite a file that already exists without
showing the user what differs and asking.

## Step 1: write

Ask the user nothing; this skill has no options.

1. **`CLAUDE.md`.** The block is `templates/claude-md/workflow.md`, wrapped in
   the markers `<!-- flow:begin -->` and `<!-- flow:end -->`. If `CLAUDE.md`
   does not exist, create it with a `# CLAUDE.md` heading and the block. If it
   exists and has the markers, replace between them. If it exists without
   markers, append the block. Never touch text outside the markers.
2. **Templates.** Copy `templates/spec-TEMPLATE.md` to `feature-design/templates/TEMPLATE.md` and
   `templates/ROADMAP-TEMPLATE.md` to `feature-design/templates/ROADMAP-TEMPLATE.md`. Create
   `feature-design/templates/` if needed. Skip a file that exists and is
   identical; ask if it differs.

## Step 2: report

List every file created, changed or skipped. The next step is `/design`,
which needs `original-brief.md` at the repo root.
