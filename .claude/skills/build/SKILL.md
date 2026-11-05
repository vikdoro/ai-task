---
name: build
description: Run one milestone through planner, executor and reviewer, with an optional explainer walkthrough. Invoke as /build <roadmap ID or request>.
---

You orchestrate. You do not write the spec, the code or the review yourself.
Each role runs in its own subagent: `planner`, `executor`,
`reviewer`, and `explainer` when the user asks for it.

The user sees only your own final message each turn, so it must carry what
they need and nothing more. Summarise the subagents' results; do not paste
their reports. Say what happened, which files were written, and any stop or
failure; after a build, give the reviewer's verdict and the verification as one
line (the command, then its result). Say plainly any choice made without the
user that they might veto (Claude's tier-two choices), with the reason and, if it is hard to reverse, what it
costs or locks in. End with what they must do next, written so it stands
alone: the context needed to act, why it matters, and for a choice the options
with your recommendation. Do not repeat what is already in a file or was said
earlier; point to it. A stage 4 walkthrough is the exception: relay it in
full.

## Preflight

Check that `feature-design/templates/TEMPLATE.md` exists. If not, tell the user to run
`/setup` and stop. If the request is a roadmap ID such as `M3`, also
check that `feature-design/mvp/roadmap.md` exists; if not, tell the user the
roadmap has to be drafted and approved first, and stop.

## Gates

Put every tier-one question to the user with AskUserQuestion; never take a
default without confirmation. End the turn after the spec, after a PASS, and
after a walkthrough. The reviewer's third FAIL also ends the turn.

## Stage 1: spec

1. Spawn `planner` with the request. If it is a roadmap ID such as `M3`,
   pass the ID and the folder `feature-design/`. It returns interview
   questions with defaults, possibly none if the design documents already
   answer everything.
2. Put the questions to the user with AskUserQuestion. Send the answers back
   to the same planner with SendMessage. It writes `feature-design/mvp/milestones/NN-title.md`.
   An answer may defer an option to post-MVP ("1 post-MVP, MVP should be
   X"), with the MVP behaviour asked for if missing. The spec records X, and
   the deferred option goes to the `product-designer` for the Later section
   of `feature-design/product-spec.md`. Each tier-one answer goes in
   the open phase's `decisions.md` as one line that links to the spec.
3. End the turn with the spec path and the planner's Decisions, and ask the
   user to approve the spec or change it. Do not continue until they do.

## Stage 2 and 3: build and review

Run these in one turn without asking, unless something below says stop.

1. Spawn `executor` with the spec path and nothing else.
   - If it returns a tier-one question, end the turn and ask the user.
2. Spawn `reviewer` with the spec path. Do not give it the executor's
   report until it asks for step 5 of its own brief.
3. On FAIL, send the reviewer's findings to the same executor with
   SendMessage, then ask the same reviewer to re-review. At most two rounds.
   A third FAIL ends the turn with both reports and a note that the spec,
   not the code, is probably wrong. Log each FAIL as a `REJECT` entry in
   the open phase's `interventions.md`, caught by the reviewer, naming the
   findings and what the fix round changed.
4. On PASS, end the turn with: the executor's report, the reviewer's verdict
   and verification output, and both agents' sections. Offer the stage 4
   walkthrough in one line; do not start it unless the user asks. Without
   it, remind the user that they read the full diff and commit themselves.

## Stage 4: walkthrough (optional)

Run only when the user asks for it.

1. Spawn `explainer` with the spec path and the executor's Decisions.
2. Relay its walkthrough. Take the user's accept, reject and questions and
   pass them to the same explainer with SendMessage.
3. A rejected decision goes into the spec as a new line under Decisions, and
   stage 2 reruns for that change. A rejected approach goes back to stage 1.
   Log each rejection as a `CORRECT` entry in the open phase's `interventions.md`
   (a rejected approach is a `REJECT`), with the user's reason in their words.
4. When every item is accepted, end the turn with the explainer's sections
   and remind the user that they read the full diff and commit themselves.

## Always

- Never commit or push.
- Stage 4 runs only on request. Without it, the PASS message's list of
  tier-two choices is the user's look at the decisions before the diff.
- `feature-design/product-spec.md` and `feature-design/mvp/roadmap.md` are
  fixed. If any stage needs one changed, end the turn and ask the user.
- When a milestone passes, ask the user whether to mark its spec path in
  `feature-design/mvp/roadmap.md`, and edit it if they agree.
- If a subagent reports a missing expected file, relay it and ask the user how
  to proceed. Do not create the file yourself.
- Pass file paths between stages, never file contents.
- A fresh session per milestone is better than two milestones in one.
