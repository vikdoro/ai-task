# CLAUDE.md

<!-- flow:begin -->
## Way of working

Built with the `flow` workflow: five subagents (architect, planner, executor, reviewer, explainer), two orchestrating skills, specs in `specs/`.

- **Before kickoff, once per app: `/brief`.** A first interview about the product as a whole, tech stack included, that writes `brief.md`. You can write `brief.md` by hand instead.
- **App level, once per app: `/kickoff`.** The `architect` agent writes `SPEC.md` (what and why), `PLAN.md` (how) and `ROADMAP.md` (ordered milestones M1, M2, ... with a traceability table) from `brief.md`, one stage per turn. The roadmap format is `specs/ROADMAP-TEMPLATE.md`.
- **Milestone level, per slice: `/build M3`.** The `planner` reads the three app-level documents, treats them as fixed, and writes `specs/NN-title.md` (format: `specs/TEMPLATE.md`). The `executor` implements it test-first, the `reviewer` checks the diff against the spec, the `explainer` walks the user through the result.
- Only the architect edits `SPEC.md`, `PLAN.md` and `ROADMAP.md`. Any other agent that needs one changed raises it as a tier one question, and the user reruns `/kickoff`.
- Only the first two roadmap milestones are detailed. Later ones are one line each and get specced when their turn comes.
- The user reads the full diff and commits. Agents never commit or push.
- Every agent checks for the files it expects before starting. If one is missing it stops and asks, and does not invent it.

## Approval gates

The user stays in the loop at every stage. Subagents return tier one questions with recommended defaults, and the orchestrator puts every one to the user with AskUserQuestion; no default is taken without confirmation.

- `/kickoff` ends the turn for approval after every stage.
- `/build` ends the turn after the spec, then after the walkthrough.
- The reviewer's third FAIL ends the turn. Agents never commit or push.

## Replies

The user sees only the orchestrator's final message each turn, so it carries what they need and nothing more:

- What happened and which files were written, with any stop or failure. Summarise subagent reports; do not paste them.
- Any choice made without the user that they might veto (Claude's tier-two choices), with the reason and, if it is hard to reverse, what it costs or locks in.
- A **Logged:** line naming every entry added to `decisions.md` or `interventions.md` this turn, by ID and heading, such as `D-06 · process · ...`. If none were added, leave the line out. `checks.md` rows are not listed, because the checks they record were already numbered in a reply.
- Last, what the user must do next, written so it stands alone: the context needed to act, why it matters, and for a choice the options with a recommendation.
- Do not repeat what is already in a file or was said earlier; point to it.

## Reviewing decisions: tier by reversibility

Not every decision needs the user's sign-off. Sort each one into a tier by how hard it is to reverse and whether it encodes knowledge only the user has.

1. **Ask first.** Stop and ask the user before acting. Batch the questions, give a recommended default for each, and record the answers in the spec. This tier covers:
   - Data model and storage shape, and anything that deletes, migrates or could wipe data.
   - Scope: adding or cutting a feature, adding a dependency or a server.
   - Business rules the agent cannot know: what counts as important enough to alert on, severity and market thresholds, dedup and rate-limit windows, retry and failure handling per channel, who is an admin, wording users see.
   - Anything in the brief that can be read two ways.
2. **Decide and log.** Pick the sensible option, keep going, and mention it in the reply with a one-line reason. The user reviews the choices, not the moment. This tier covers reversible choices where any reasonable answer works: file names, sort orders, label formats, which module owns a rule, delete-and-redo versus edit-in-place.
3. **Just do it.** Implementation detail below the spec. The diff is the record.

When in doubt between tiers 1 and 2, ask if the user would be annoyed to find out after the fact; otherwise log it. Sub-agents follow the same tiers: a planner surfaces tier 1 as interview questions with defaults, a coder never makes a tier 1 decision on its own, and a verifier reports rather than fixes.
<!-- flow:end -->

## Commit messages

This overrides the global one-line rule for this repo; the other global git rules still apply.

- Imperative subject, 50 characters or less, no trailing period.
- Add a short body, wrapped at 72, only when the reason isn't recorded elsewhere (`decisions.md`, `interventions.md`, a spec's Decisions).

## Process logs

The brief evaluates how the AI was directed, not only what it built. Four logs in `submission-docs/` record that. They are written as the work happens, so the user never has to tag a prompt.

- **`prompts/prompts.md`** is written by the hook. Each prompt has an ID (`P-042`), and the hook gives Claude that ID at the start of every turn. It also reports any tool call the user rejected or any interrupt in the previous turn.
- **`decisions.md`** (`D-NN`) holds every tier-one decision and every decision about the process or tooling, whoever made it. A tier-two decision stays in the Decisions section of its artifact (`SPEC.md`, `PLAN.md`, `ROADMAP.md`, `specs/NN-*.md`). `decisions.md` links to that section and does not copy it. Tier three is not logged.
- **`interventions.md`** (`I-NN`, chronological) holds two kinds of entry. `REJECT`: output thrown away. `CORRECT`: output kept but changed in direction or substance.
- **`checks.md`** (`C-NN`, one table row each) holds every check the user answered, whether it passed or found something. See [Checks for the user](#checks-for-the-user).

Rules:

- When the user's prompt corrects, rejects or redirects earlier output, write the `interventions.md` entry before acting on it. Do the same when the hook reports a rejected tool call or interrupt that was a correction. A rejection that only meant "not now" is not one.
- Cite the prompt ID in every entry, and quote the user's own words briefly rather than paraphrasing them into a stronger claim. If the user gave no reason, write "not stated"; do not invent one.
- `Caught by` says who found it: the user, a test, the reviewer, or Claude checking its own claim. Checks Claude runs on itself count, but are labelled as such.
- For a decision, `Decided by` is `user` or `claude`. When the user overrides Claude's recommendation, record the recommendation too; that override is also a `CORRECT` entry.
- When the user says a phase of the work is done, close its row in `submission-docs/phases.md` with the last ID of each log, and open the next one.
- Only the main session writes these logs. Subagents return their decisions and findings, and the orchestrating skill logs them.
- Keep entries short: a heading line and three or four labelled list items (`- **What:** ...`), so GitHub does not merge them into one paragraph.

### Checks for the user

End a reply with a numbered **Checks for you:** list only when the reply:

- produced something the user is about to accept (a spec, code, a migration, a log entry), or
- states a fact from outside the repo that could be wrong (an API's behaviour, a library flag, a limit).

There is no fixed number of items. Every check must be worth the user's time, and an important one is never dropped to keep the list short. Checks still open from earlier replies go into the same list, never into a separate numbered one, so each number means one thing. Each item is concrete: a command to run, a `file:line` to read, or a claim to check and where. Otherwise leave the section out. A choice the user has to make is not a check: ask it outside the list.

The user answers by number, for example "Check 1, 2 done" or "Check 3: the threshold is wrong for crypto". Log each answered check as a row in `checks.md`:

- Restate what the check was, since "check 2" alone means nothing in the log. Link to the prompt whose reply listed it and to the prompt that answered it.
- A plain "done" is `OK`. That row is the whole record; nothing goes in `interventions.md`.
- A finding gets the result `Finding: <the user's words, short> → I-NN`, plus an `interventions.md` entry that holds the details and cites the `C-NN`. A finding that needs discussion is answered first, and both are logged once it is resolved.
- A check the user has not mentioned yet is not logged as passed.
