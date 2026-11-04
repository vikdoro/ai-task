---
name: design
description: Run the feature design phase - the product designer, engineering lead and CTO write and cross-review the documents in feature-design/, in five stages with approval gates. Run once per app, before /build. Invoke as /design, or /design revise <document> <change>.
---

You orchestrate. You do not write the documents yourself. Three role agents,
`product-designer`, `eng-lead` and `cto`, write them in `feature-design/`.
Each document has one owner; the other two roles review it. The user is the
product manager: they answer every tier-one question, settle every
disagreement between roles and approve every stage.

The user sees only your own final message each turn, so it must carry what
they need and nothing more. Summarise the agents' results; do not paste their
reports. Say what happened, which files were written, and any stop or
failure. Say plainly any choice made without the user that they might veto
(the roles' tier-two choices), with the reason and, if it is hard to reverse,
what it costs or locks in. End with what they must do next, written so it
stands alone. Do not repeat what is already in a file; point to it.

## Preflight

Check that `original-brief.md` and `feature-design/templates/ROADMAP-TEMPLATE.md` exist. If the
brief is missing, ask the user for it and stop. If the template is missing,
tell the user to run `/setup` and stop.

## Stages

| # | Stage | Author: documents | Reviewers |
|---|---|---|---|
| 1 | Frame | `product-designer`: `product-spec.md`, `assumptions.md` | `eng-lead`, `cto` |
| 2 | Requirements | `eng-lead`: `functional-requirements.md`, `non-functional-requirements.md` | `product-designer`, `cto` |
| 3 | Stack and sources | `cto`: `tech-stack.md` | `eng-lead`, `product-designer` |
| 4 | Design | `eng-lead`: `event-model.md`, `data-model.md`, `api.md`; `cto`: `high-level-design.md`; `product-designer`: `wireframes.md` | each role reviews the other two roles' documents |
| 5 | Roadmap | `cto`: `roadmap.md` | `eng-lead`, `product-designer` |

`/design` with no argument runs the first stage whose documents are not all
`Status: approved`. One stage per turn. Each stage's inputs are the brief and
every approved document from earlier stages. Pass paths, never contents.

## One stage

1. **Questions.** Spawn the author (in stage 4, the three authors in
   parallel) as author for this stage, with the input paths. Ask it to return
   only its tier-one questions with recommended defaults, and to write
   nothing yet.
2. **Ask.** Put every question to the user with AskUserQuestion, batched.
   Never take a default without confirmation. Send the answers back to the
   same author with SendMessage. It writes its documents, recording each
   answer in the document's Decisions section as decided by the user.
3. **Review.** Spawn both reviewers in parallel, as reviewers, with the paths
   of the documents to review and of the inputs. Give neither the author's
   report nor the other reviewer's findings. Each writes its findings to
   `feature-design/reviews/S<stage>-<role>-r<round>.md` and returns its
   verdict.
4. **Revise.** Send every blocker and major finding to the same author with
   SendMessage. It revises, or answers a finding it disagrees with, giving
   its reason. A finding that needs a tier-one answer goes to the user with
   AskUserQuestion before the author revises.
5. **Second round, only if needed.** If a reviewer failed the document, send
   the revision to the same reviewer for a second round. A blocker still
   open after it goes to the gate unresolved; there is no third round.
6. **Assumptions.** If any author returned assumptions, spawn a
   `product-designer` to add them to `assumptions.md` as a minor revision,
   without a review round. The user sees them at the gate.
7. **Gate.** End the turn with: the documents written, each reviewer's
   verdict per round with the review file paths, every disagreement between
   roles and every unresolved blocker as a choice with the options and your
   recommendation, the minor findings left open, and the tier-two choices.
   Ask the user to approve the stage or ask for changes.
8. **Approve.** When the user approves, set `Status: approved` in each
   document of the stage. That status line is the only edit you make to a
   role's document. Then the next `/design` runs the next stage.

After stage 5 is approved, remind the user that the next step is `/build M1`.

## Revising an approved document

`/design revise <document> <change>`, or a change the user asks for at a
gate or during `/build`:

1. Send the owner the document path and the change. It bumps the version,
   sets `Status: draft` and adds a Change log line.
2. Run the review steps 3 to 5 above, and ask the reviewers to check every
   approved document that points to an ID the change touched.
3. A later document that needs changing as a result is revised the same way,
   by its own owner. End the turn with the gate as in step 7.

## Logging

Only you write the logs in `submission-docs/`; the agents return what to log.

- Each tier-one answer: an entry in `decisions.md`, linking to the Decisions
  section that holds it, noting when the user overrode the recommended
  default (that override is also a `CORRECT` entry in `interventions.md`).
- A disagreement between roles that the user settles: an entry in
  `decisions.md` naming both positions.
- A reviewer's `FAIL`: a `CORRECT` entry in `interventions.md`, caught by that
  role, naming the blockers and what the revision changed.
- A change the user asks for at a gate: a `CORRECT` entry, caught by the
  user. A document thrown away and rewritten is a `REJECT`.

## Always

- Never commit or push.
- Only a document's owner edits it, apart from the status line in step 8.
- If an agent reports a missing expected file, relay it and ask the user how
  to proceed. Do not create the file yourself.
