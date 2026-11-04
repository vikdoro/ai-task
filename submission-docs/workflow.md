# Agentic workflow

A spec-driven way of working for Claude Code, adapted for this repo from the
`flow` plugin (v0.1.0). The agents are in `.claude/agents/`, the skills in
`.claude/skills/` and the templates in `.claude/templates/`. It is a
product designer who interviews the user, a build pipeline of four
subagents, one orchestrating skill, and a few rules about who may decide
what. A three-role `/design` skill was tried and dropped; see
[I-19](03-local-demo/00-spec-and-roadmap/interventions.md) and [D-27](03-local-demo/00-spec-and-roadmap/decisions.md). It assumes you know Claude Code subagents,
and skills.

## The idea

Two levels, planned once and built slice by slice:

```
original-brief.md ──product-designer──▶ feature-design/product-spec.md ──user + Claude──▶ feature-design/local-demo/roadmap.md
                      (interview)                                          (toward the local demo)

feature-design/local-demo/roadmap.md ──/build M3──▶ feature-design/local-demo/milestones/NN-title.md ─▶ code + tests ─▶ review ─▶ walkthrough
                                              planner             executor        reviewer   explainer
```

The current phase is a local demo: one user journey that tries real
external data sources and email and Slack delivery, to learn about the data
and the services before planning further. Every session starts with no
memory, so the spec and the roadmap are what carry intent from one milestone
to the next. The user approves both, and everyone else treats them as fixed.

## Roles

| Agent | Runs in | Does | Tools | Must not |
|---|---|---|---|---|
| `product-designer` | before the roadmap | Interviews the user and writes the short, mostly non-technical product spec | Read, Grep, Glob, Write | Name technologies; decide tier one |
| `planner` | `/build` stage 1 | Interviews the user, writes `feature-design/local-demo/milestones/NN-title.md` from a roadmap milestone | Read, Grep, Glob, Write | Write code; edit the design documents |
| `executor` | `/build` stage 2 | Implements one spec test-first; proves it with the spec's verification command | All | Touch files outside the spec; decide tier one questions; commit |
| `reviewer` | `/build` stage 3 | Checks the diff against the spec: files, verification, criteria, scope | Read, Grep, Glob, Bash | Edit anything; see the executor's report before its own check |
| `explainer` | `/build` stage 4 | Walks the user through the shape of the code and each judgment call, with quoted lines | Read, Grep, Glob, Bash | Defend the executor's choices |

The `cto` and `eng-lead` agents from the dropped `/design` skill are still in
`.claude/agents/`, unused in this phase.

The user is the product manager: they answer tier-one questions and approve
the spec, the roadmap and each milestone.

The `build` skill is an orchestrator. They hold no domain
logic: they spawn the agents in order, relay each report, run the user
interview through AskUserQuestion, and decide where the turn ends.

## Decision tiers

Every decision is sorted by how hard it is to reverse and whether it encodes
knowledge only the user has.

1. **Ask first.** Data model and storage shape; anything that deletes,
   migrates or could wipe data; scope (a feature, a dependency, a server);
   business rules the agent cannot know; anything the brief reads two ways.
   Agents never decide these. They return the question with a recommended
   default.
2. **Decide and log.** Reversible choices where any reasonable answer works.
   The agent picks, carries on and records it with a one-line reason.
3. **Just do it.** Implementation detail below the spec; the diff is the
   record.

The user reviews the log of tier two, not each moment. Tier one is the only
place the pipeline stops for input, which is what keeps it fast.

## Approval gates

The user stays in the loop at every stage. Every tier-one question is put to
the user; no default is taken without confirmation. The spec and the roadmap
each stop for approval; `/build` after the spec, after a passing review,
and after the walkthrough. The `flow` plugin also has `checkpoint` and `auto`
modes that skip some of these; they are left out here (see
[D-09](01-setup/decisions.md#d-09--process--one-autonomy-level-the-user-approves-every-stage)).

## Rules that make it hold together

- **Locked, but living.** The approved spec and roadmap are fixed. A
  planner that finds one wrong stops and asks; the `product-designer`
  revises the spec, and the main session revises the roadmap with the user.
- **Post-MVP is an answer.** Any question can be answered "1 post-MVP, MVP
  should be X"; the deferred option goes in the spec's Later section.
- **Behaviour before code.** The planner writes acceptance criteria before it
  reads the repo, then reconciles paths and names. Reconciliation may not
  change a criterion; if it would, the question goes back to the user.
- **Checkable criteria.** Each acceptance criterion must be provable by
  running something or reading one place.
- **Red before green.** The executor's tests must fail before the
  implementation and pass after. Both outputs go in its report, which has no
  evaluative language.
- **Independent review.** The reviewer gets the spec path only, runs the
  verification itself, and reads the executor's report last.
- **Bounded retries.** Two fix rounds after a FAIL; a third ends the turn with
  the note that the spec is probably wrong.
- **Preflight.** Every agent checks that the files it expects exist and stops
  to ask when one is missing, instead of inventing it.
- **The user commits.** Agents never commit or push. The user reads the full
  diff first.

## Documents

| File | Written by | Holds |
|---|---|---|
| `original-brief.md` | the assessor | The brief as given; kept out of git |
| `feature-design/product-spec.md` | product-designer | Problem, users, goals, journeys, the local demo, later, non-goals, open questions |
| `feature-design/local-demo/roadmap.md` | the user with Claude | Ordered milestones toward the local demo, and a traceability table |
| `feature-design/local-demo/milestones/NN-title.md` | planner | One milestone: criteria, allowed files, verification |
| `feature-design/templates/TEMPLATE.md`, `feature-design/templates/ROADMAP-TEMPLATE.md` | `/setup` | Formats for the above; yours to edit per repo |

How decisions, corrections and checks are recorded is in
[`process-logs.md`](process-logs.md).

## Using it

```
/setup                 once per repo
(ask Claude)           product-designer interview, then the spec; approve it
(ask Claude)           draft the roadmap together; approve it
/build M1              per milestone; approve the spec, then the walkthrough
```
