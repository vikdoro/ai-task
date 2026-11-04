---
name: setup
description: Prepare this repo for the flow workflow - write the workflow section into CLAUDE.md, the spec templates and a brief stub. Invoke as /setup.
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
2. **Templates.** Copy `templates/spec-TEMPLATE.md` to `specs/TEMPLATE.md` and
   `templates/ROADMAP-TEMPLATE.md` to `specs/ROADMAP-TEMPLATE.md`. Create
   `specs/` if needed. Skip a file that exists and is identical; ask if it
   differs.
3. **`brief.md`.** If it does not exist, create a stub with the headings
   "What it is", "Who uses it", "What it records", "Rules and thresholds you
   already know", "Tech stack and constraints", "Out of scope", and tell the
   user to fill it in or run `/brief` to be interviewed.

## Step 2: report

List every file created, changed or skipped. The next step is `/brief`
to write `brief.md` by interview, or filling it in by hand, then `/kickoff`.

End with what the user does next, such as filling in `brief.md`.
