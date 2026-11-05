# Plan of attack

Written at the end, looking back. The plan I started from is in [`first-notes.md`](process-logs/first-notes.md); how it changed is below, with each turn linked to the decision or correction that caused it. The phases and their log ranges are in [`phases.md`](process-logs/phases.md).

## Deliverables

1. **A way of working with the AI, and a record of it.** Agents with fixed roles, decision tiers that say what the AI may decide alone, and four logs (prompts, decisions, interventions, checks) written as the work happens. The brief judges the process, so the process needed a record from the first prompt.
2. **A product spec per phase**, short and non-technical, from an interview with me as product manager. It settles what the brief leaves open.
3. **A roadmap per phase**, split into milestones small enough to review one diff at a time.
4. **Working code per milestone**, test-first, with a review against its spec before I read the diff and commit.
5. **Findings** on the data sources and the delivery channels, so the next phase builds on evidence, not guesses.

## Order, and why

| # | Phase | Why at this point |
|---|---|---|
| 1 | [Setup](process-logs/01-setup/) | The logging and the approval gates had to exist before any design work, or the early decisions would go unrecorded. |
| 2 | [Feature design](process-logs/02-feature-design-dropped/), dropped | The first plan: three roles (product designer, CTO, eng lead) writing and cross-reviewing one design before any code. |
| 3 | [Local demo](process-logs/03-local-demo/), M1 to M5 | Try the sources (M1) and channels (M2) first, then join them into one journey: events in, alert set up, alert delivered (M3 to M5). |
| 4 | [MVP spec and roadmap](process-logs/04-mvp/00-spec-and-roadmap/) | A new spec built on what the demo found, toward a release two people can use online. |
| 5 | [Submission polish](process-logs/05-submission-polish/) | Tidy the record so a reader can follow it. |

## How the plan changed

- **Design first, then build, became try first, then design.** The three-role design ran one stage and two review rounds. It produced a 62-decision spec that still guessed at the sources' limits and the thresholds. I dropped it and built a local demo to learn those limits first ([I-19](process-logs/03-local-demo/00-spec-and-roadmap/interventions.md), D-27).
- **Spikes became throwaway scripts.** M1 and M2 were meant to be app modules. I made them scripts, so learning about the sources would not lock in code ([I-26](process-logs/03-local-demo/00-spec-and-roadmap/interventions.md), D-34).
- **Importance is set from the data.** The AI proposed thresholds before any source had been fetched. Each time, I deferred the bar until M1 had real responses ([I-14](process-logs/02-feature-design-dropped/interventions.md), [I-21](process-logs/03-local-demo/00-spec-and-roadmap/interventions.md)).
- **No live calls without my say.** After M1, every agent works on saved samples, because one news source's free allowance never renews ([I-33](process-logs/03-local-demo/m1/interventions.md), D-49).
- **The walkthrough became optional.** The explainer step slowed every milestone, so it runs only when I ask for it ([I-38](process-logs/03-local-demo/m2/interventions.md), D-59).

## Where it stopped

The local demo is complete: one journey on one machine, with all three kinds of event, email and Slack. The MVP spec and its six-milestone roadmap are approved, but none of those milestones is built. With the time box spent, I chose to finish the record of how I worked rather than start M1 and leave it half done. What I'd change next time is in [`reflections.md`](reflections.md).
