# CLAUDE.md

<!-- flow:begin -->
## Way of working

Adapted from the `flow` workflow. Everything lives in `feature-design/`: the current phase's product spec and the templates in `templates/` at its root, and one subfolder per phase.

- `local-demo/` is done and frozen: its product spec (v7), roadmap, milestone specs and `findings/`. Nothing in it is edited, except to fix a path.
- `mvp/` is the current phase, a shippable MVP built on what the local demo found. It holds `roadmap.md` and `milestones/`, created when they are first written.

The phase steps:

- **Product spec, once per phase: the `product-designer` agent.** It interviews the user from `original-brief.md`, the frozen local-demo spec and the findings, and writes `feature-design/product-spec.md`, at most about 1,200 words. No role reviews it; the user approves it.
- **Roadmap: the user with Claude.** The main session drafts `feature-design/mvp/roadmap.md` with the user from the approved spec (format: `feature-design/templates/ROADMAP-TEMPLATE.md`).
- **Milestone level, per slice: `/build M3`.** The `planner` reads the spec and the roadmap, treats them as fixed, and writes `feature-design/mvp/milestones/NN-title.md` (format: `feature-design/templates/TEMPLATE.md`, at most about 1,500 words). The `executor` implements it test-first, the `reviewer` checks the diff against the spec, and, only when the user asks, the `explainer` walks the user through the result.
- The user is the product manager: they answer tier-one questions and approve the spec, the roadmap and each milestone.
- The spec and the roadmap are locked once approved. A change goes to the user as a tier one question; the `product-designer` revises the spec, the main session revises the roadmap with the user.
- Any answer can defer an option to post-MVP ("1 post-MVP, MVP should be X"). X is recorded, and the deferred option goes in the spec's Later section (D-20).
- Only the first two roadmap milestones are detailed. Later ones are one line each and get specced when their turn comes.
- The `cto` and `eng-lead` agents are not used in this phase.
- The user reads the full diff and commits. Agents never commit or push.
- Every agent checks for the files it expects before starting. If one is missing it stops and asks, and does not invent it.

## Reading, to save tokens

Subagents are slow and every file they open costs tokens. Each agent reads its own fixed list (in its agent file) and nothing more. It never reads:

- `submission-docs/`, `node_modules/`, `.nuxt/`, `.output/`, `data/`, or `package-lock.json`;
- `feature-design/local-demo/`, except a section that the current spec or roadmap cites by path and heading, read by its line range;
- a whole file in `spikes/samples/`. It reads one file at a time and only part of it.

It finds things with Grep or Glob before opening a file, and reads large files by line range. Grep and Glob skip `submission-docs/` and `spikes/samples/` through `.ignore`. Shell `grep -r` and `find` need `--exclude-dir` or `-prune` for both.

## Secrets

- API keys live in `.env` at the repo root, which is gitignored. Its key names, without values, are in `.env.example`.
- Claude's permission check blocks writing `.env`. No agent creates, edits or reads it, and none retries a blocked write. When a key is needed, ask the user to add it, giving a `!` command such as `! printf 'NAME=\n' >> .env`.
- Scripts read keys with `node --env-file-if-exists=.env`, and skip a source whose key is missing.

## Live data calls

- Until the user says otherwise (D-49), no agent calls an external data source live: not GDACS, Twelve Data or Event Registry. All development and verification run against the samples saved in `spikes/samples/` by M1.
- Event Registry's free allowance is 2,000 tokens that never renew, at 5 per search.
- `spikes/samples/` is gitignored, so it exists only on the user's machine. No agent deletes, moves or overwrites it.
- A step that seems to need a live call stops and asks the user.

## Approval gates

The user stays in the loop at every stage. Subagents return tier one questions with recommended defaults, and the orchestrator puts every one to the user with AskUserQuestion; no default is taken without confirmation.

- The product spec and the roadmap each end the turn for approval.
- `/build` ends the turn after the spec, then after the reviewer's PASS, and after a walkthrough if the user asks for one.
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

The main session keeps four process logs in `submission-docs/`, one set per phase folder (`01-setup/`, ..., `03-local-demo/m4/`), listed in `submission-docs/phases.md`. It writes only to the open phase's folder, the last row of `phases.md`, which the prompt hook names every turn. It opens logs by path only, and opens a closed phase's logs only when the user asks. Searches skip `submission-docs/` and `spikes/samples/`: Grep and Glob do so through `.ignore`, while shell `grep -r` and `find` need `--exclude-dir` or `-prune` for both. Their rules, including when a reply ends with **Checks for you:**, are in `submission-docs/CLAUDE.md`. The main session reads it once per session, before its first reply or log entry. Subagents never read `submission-docs/`: they return their decisions and findings, and the main session logs them.

IDs such as D-27 point to an entry in a phase folder's `decisions.md` and are there for the record. The rule as written in this file or in a spec is complete, so no agent looks an ID up.
