---
name: kickoff
description: Turn a brief into SPEC.md, PLAN.md and ROADMAP.md with approval gates. Run once per app, before /build. Invoke as /kickoff [--mode=guided|checkpoint|auto].
---

You orchestrate. You do not write the documents yourself. The
`architect` subagent writes all three, one stage per turn.

The user sees only your own final message each turn, so it must carry what
they need and nothing more. Summarise the subagent's result; do not paste its
report. Say what happened, which files were written, and any stop or failure.
Say plainly any choice made without the user that they might veto (Claude's
tier-two choices and any default taken without confirmation), with the reason
and, if it is hard to reverse, what it costs or locks in. End with what they
must do next, written so it stands alone: the context needed to act, why it
matters, and for a choice the options with your recommendation. Do not repeat
what is already in a file or was said earlier; point to it.

## Preflight

Input is `brief.md` at the repo root. Check that it exists and that
`specs/ROADMAP-TEMPLATE.md` exists. If `brief.md` is missing, ask the user for
it and stop. If the template is missing, tell the user to run `/setup`
and stop.

## Mode

Read `--mode=` from the request; default `guided`. Tell the architect "mode:
<mode>".

| Mode | Tier-one questions | Gates |
|---|---|---|
| `guided` | Asked with AskUserQuestion | End the turn for approval after every stage |
| `checkpoint` | Asked | Stages 1 and 2 run straight on; gate only after the roadmap |
| `auto` | Recommended default taken, flagged to the user as a default | None; all three stages in one turn, ending with the roadmap |

Never relaxed in any mode: ask anyone for what deletes, migrates or could
wipe data, adds or cuts scope, adds a dependency or a server, has no clear
default because the brief reads two ways, or concerns the data model and
storage shape. In `checkpoint` and `auto`, say in the reply which defaults were taken without confirmation, and end
with a request to review them.

## Stage 1: product spec

1. Spawn `architect` with "stage 1". It returns interview questions with
   defaults, or says `SPEC.md` already exists.
2. Put the questions to the user as the mode says. Send the answers back to
   the same architect with SendMessage. It writes `SPEC.md`.
3. End the turn if the mode gates here: give the path, relay the Decisions,
   and ask the user to approve or change it.

## Stage 2: technical plan

1. Send the same architect (or spawn a new one) "stage 2". It returns any
   tier-one questions on data model and storage with defaults.
2. Ask them, send the answers back, and let it write `PLAN.md`.
3. End the turn if the mode gates here.

## Stage 3: roadmap

1. Send "stage 3". It writes `ROADMAP.md`.
2. End the turn with the path, the milestone list in order, the traceability
   result and the Decisions. Ask the user to approve or change it.
3. When approved, remind the user that the next step is `/build M1`.

## Always

- Never commit or push.
- Pass file paths between stages, never file contents.
- A change to an approved document is a revision: send the architect the
  request and the document path, and re-run the later stages that depend on it.
- Nothing but the architect edits `SPEC.md`, `PLAN.md` or `ROADMAP.md`.
- Log each tier-one answer in `submission-docs/decisions.md` as one line that
  links to the document holding it, noting when the user overrode the
  recommended default. A change the user asks for at a gate is a `CORRECT`
  entry in `submission-docs/interventions.md`.
- If a subagent reports a missing expected file, relay it and ask the user how
  to proceed. Do not create the file yourself.
