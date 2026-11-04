# Agentic workflow

A spec-driven way of working for Claude Code, adapted for this repo from the
`flow` plugin (v0.1.0). The agents are in `.claude/agents/`, the skills in
`.claude/skills/` and the templates in `.claude/templates/`. It is a design
team of three role agents, a build pipeline of four subagents, two
orchestrating skills, and a few rules about who may decide what. It assumes you know Claude Code subagents,
and skills.

## The idea

Two levels, planned once and built slice by slice:

```
original-brief.md ──/design──▶ feature-design/            (once per app, five stages)
                                 frame ─▶ requirements ─▶ stack ─▶ design ─▶ roadmap

feature-design/roadmap.md ──/build M3──▶ feature-design/milestones/NN-title.md ─▶ code + tests ─▶ review ─▶ walkthrough
                                              planner             executor        reviewer   explainer
```

Planning the whole app up front, then building it in thin vertical slices,
is the usual industry order. What agents change is that every session starts
with no memory, so the app-level documents are the only thing that carries
intent from one milestone to the next. Each is written by one owner,
reviewed by the other two roles, approved by the user, and treated as fixed
by everyone else.

## Roles

| Agent | Runs in | Does | Tools | Must not |
|---|---|---|---|---|
| `product-designer` | `/design` | Owns the product spec, assumptions and wireframes; reviews the rest for whether it works as a product | Read, Grep, Glob, Write | Edit another role's document; decide tier one |
| `eng-lead` | `/design` | Owns the requirements, event model, data model and API; reviews the rest for ambiguity, coverage and testability | Read, Grep, Glob, Write, WebSearch, WebFetch | Edit another role's document; decide tier one |
| `cto` | `/design` | Owns the tech stack and sources, high-level design and roadmap; reviews the rest for cost, complexity, security, operations and deadline | Read, Grep, Glob, Write, WebSearch, WebFetch | Edit another role's document; decide tier one |
| `planner` | `/build` stage 1 | Interviews the user, writes `feature-design/milestones/NN-title.md` from a roadmap milestone | Read, Grep, Glob, Write | Write code; edit the design documents |
| `executor` | `/build` stage 2 | Implements one spec test-first; proves it with the spec's verification command | All | Touch files outside the spec; decide tier one questions; commit |
| `reviewer` | `/build` stage 3 | Checks the diff against the spec: files, verification, criteria, scope | Read, Grep, Glob, Bash | Edit anything; see the executor's report before its own check |
| `explainer` | `/build` stage 4 | Walks the user through the shape of the code and each judgment call, with quoted lines | Read, Grep, Glob, Bash | Defend the executor's choices |

The user is the product manager of the design team: they answer tier-one
questions, settle disagreements between roles and approve each stage.

The two skills (`design`, `build`) are orchestrators. They hold no domain
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
the user; no default is taken without confirmation. `/design` stops for
approval after every stage; `/build` after the spec, after a passing review,
and after the walkthrough. The `flow` plugin also has `checkpoint` and `auto`
modes that skip some of these; they are left out here (see
[D-09](decisions.md#d-09--process--one-autonomy-level-the-user-approves-every-stage)).

## Rules that make it hold together

- **One owner per design document, two independent reviewers.** Only its
  owner edits a document. The reviewers see neither the author's report nor
  each other's findings, and check against criteria that can fail it. One
  review round, a second only if a blocker remains, then the user decides.
  Reviews are kept in `feature-design/reviews/`.
- **Locked, but living.** Approved documents are fixed. A planner or role
  that finds one wrong stops and asks; the change goes through
  `/design revise`, which bumps the version and re-reviews what depends on
  it.
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
| `feature-design/product-spec.md`, `assumptions.md`, `wireframes.md` | product-designer | Problem, users, scope, non-goals; each ambiguity and the reading chosen; low-fi screens |
| `feature-design/functional-requirements.md`, `non-functional-requirements.md`, `event-model.md`, `data-model.md`, `api.md` | eng-lead | Numbered requirements with acceptance criteria; event sources, detection and dedup; entities; endpoints |
| `feature-design/tech-stack.md`, `high-level-design.md`, `roadmap.md` | cto | Stack, auth and data sources; components and data flow; ordered milestones and a traceability table |
| `feature-design/reviews/` | the reviewing roles | Each review's findings and verdict, per stage and round |
| `feature-design/milestones/NN-title.md` | planner | One milestone: criteria, allowed files, verification |
| `feature-design/templates/TEMPLATE.md`, `feature-design/templates/ROADMAP-TEMPLATE.md` | `/setup` | Formats for the above; yours to edit per repo |

How decisions, corrections and checks are recorded is in
[`process-logs.md`](process-logs.md).

## Using it

```
/setup                 once per repo
/design                one stage per run; approve each, five in all
/design revise <doc> <change>   change an approved document
/build M1              per milestone; approve the spec, then the walkthrough
```
