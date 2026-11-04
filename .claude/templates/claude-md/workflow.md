## Way of working

Built with the `flow` workflow: five subagents (architect, planner, executor, reviewer, explainer), two orchestrating skills, specs in `specs/`.

- **Before kickoff, once per app: `/brief`.** A first interview about the product as a whole, tech stack included, that writes `brief.md`. You can write `brief.md` by hand instead.
- **App level, once per app: `/kickoff`.** The `architect` agent writes `SPEC.md` (what and why), `PLAN.md` (how) and `ROADMAP.md` (ordered milestones M1, M2, ... with a traceability table) from `brief.md`, one stage per turn. The roadmap format is `specs/ROADMAP-TEMPLATE.md`.
- **Milestone level, per slice: `/build M3`.** The `planner` reads the three app-level documents, treats them as fixed, and writes `specs/NN-title.md` (format: `specs/TEMPLATE.md`). The `executor` implements it test-first, the `reviewer` checks the diff against the spec, the `explainer` walks the user through the result.
- Only the architect edits `SPEC.md`, `PLAN.md` and `ROADMAP.md`. Any other agent that needs one changed raises it as a tier one question, and the user reruns `/kickoff`.
- Only the first two roadmap milestones are detailed. Later ones are one line each and get specced when their turn comes.
- The user reads the full diff and commits. Agents never commit or push.
- Every agent checks for the files it expects before starting. If one is missing it stops and asks, and does not invent it.

## Autonomy modes

`/kickoff` and `/build` take `--mode=guided|checkpoint|auto`. Default is `guided`. The orchestrator skills apply the mode; subagents only receive it as context ("mode: auto") and always return tier one questions with recommended defaults.

| Mode | Tier one questions | Approval gates |
|---|---|---|
| `guided` | Asked with AskUserQuestion | `/kickoff`: after every stage. `/build`: after the spec, then the walkthrough |
| `checkpoint` | Asked | `/kickoff`: only after the roadmap. `/build`: only the walkthrough |
| `auto` | Recommended default taken, flagged to the user as a default | None, except the walkthrough in `/build` |

Never relaxed, in any mode: stop and ask for anything that deletes, migrates or could wipe data, adds or cuts scope, adds a dependency or a server, or has no clear default because the brief reads two ways. The data model and storage shape are always asked. The reviewer's third FAIL still ends the turn. Agents never commit or push.

In `auto` and `checkpoint`, every default taken without confirmation is called out in the reply. Rejecting one goes back through the normal rejection path.

## Replies

The user sees only the orchestrator's final message each turn, so it carries what they need and nothing more:

- What happened and which files were written, with any stop or failure. Summarise subagent reports; do not paste them.
- Any choice made without the user that they might veto (Claude's tier-two choices, and any default taken without confirmation in `checkpoint` or `auto`), with the reason and, if it is hard to reverse, what it costs or locks in.
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
