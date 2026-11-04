# Agentic workflow

A spec-driven way of working for Claude Code, adapted for this repo from the
`flow` plugin (v0.1.0). The agents are in `.claude/agents/`, the skills in
`.claude/skills/` and the templates in `.claude/templates/`. It is a pipeline of five subagents, two orchestrating skills, and a few
rules about who may decide what. It assumes you know Claude Code subagents,
and skills.

## The idea

Two levels, planned once and built slice by slice:

```
brief.md ──/kickoff──▶ SPEC.md ─▶ PLAN.md ─▶ ROADMAP.md      (once per app)
                              what       how        M1, M2, M3 ...

ROADMAP.md ──/build M3──▶ specs/NN-title.md ─▶ code + tests ─▶ review ─▶ walkthrough
                               planner              executor        reviewer   explainer
```

Planning the whole app up front, then building it in thin vertical slices,
is the usual industry order. What agents change is that every session starts
with no memory, so the app-level documents are the only thing that carries
intent from one milestone to the next. They are therefore written once, by
one agent, and treated as fixed by everyone else.

## Roles

| Agent | Runs in | Does | Tools | Must not |
|---|---|---|---|---|
| `architect` | `/kickoff` | Writes `SPEC.md`, `PLAN.md`, `ROADMAP.md`, one stage per turn | Read, Grep, Glob, Write | Write code or milestone specs; edit an earlier stage's document |
| `planner` | `/build` stage 1 | Interviews the user, writes `specs/NN-title.md` from a roadmap milestone | Read, Grep, Glob, Write | Write code; edit the three app-level documents |
| `executor` | `/build` stage 2 | Implements one spec test-first; proves it with the spec's verification command | All | Touch files outside the spec; decide tier one questions; commit |
| `reviewer` | `/build` stage 3 | Checks the diff against the spec: files, verification, criteria, scope | Read, Grep, Glob, Bash | Edit anything; see the executor's report before its own check |
| `explainer` | `/build` stage 4 | Walks the user through the shape of the code and each judgment call, with quoted lines | Read, Grep, Glob, Bash | Defend the executor's choices |

The two skills (`kickoff`, `build`) are orchestrators. They hold no domain
logic: they spawn the agents in order, relay each report, run the user
interview through AskUserQuestion, and decide where the turn ends.
`/brief` is a third skill that runs no agents: it interviews the user
about the product as a whole, tech stack included, and writes `brief.md`.

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

## Autonomy modes

`--mode=guided|checkpoint|auto` on `/kickoff` and `/build`.

| Mode | Tier-one questions | Gates |
|---|---|---|
| `guided` (default) | Asked | `kickoff`: after every stage. `build`: after the spec, then the walkthrough |
| `checkpoint` | Asked | `kickoff`: only after the roadmap. `build`: only the walkthrough |
| `auto` | Recommended default taken, flagged to the user as a default | None, except the walkthrough |

Never relaxed: data loss or migration, scope, new dependencies, genuinely
two-way briefs, the data model in `kickoff`, the reviewer's third FAIL, and
the ban on committing. In `checkpoint` and `auto`, every default taken
without confirmation is called out in the reply, with a request to review it.

## Rules that make it hold together

- **One owner for the app-level documents.** Only the architect edits
  `SPEC.md`, `PLAN.md`, `ROADMAP.md`. A planner that finds one wrong stops
  and asks, and the user reruns `/kickoff`.
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
| `brief.md` | You | What you want, in your words |
| `SPEC.md` | architect | What and why; rules you confirmed; Decisions at the end |
| `PLAN.md` | architect | How: layout, data model, tests, coverage of the spec |
| `ROADMAP.md` | architect | Ordered milestones and a traceability table |
| `specs/NN-title.md` | planner | One milestone: criteria, allowed files, verification |
| `specs/TEMPLATE.md`, `specs/ROADMAP-TEMPLATE.md` | `/setup` | Formats for the above; yours to edit per repo |

How decisions, corrections and checks are recorded is in
[`process-logs.md`](process-logs.md).

## Using it

```
/setup                 once per repo
/brief                 interview about the product and tech stack, writes brief.md
/kickoff               then approve SPEC.md, PLAN.md, ROADMAP.md
/build M1              per milestone; add --mode=checkpoint or --mode=auto when rules are settled
```
