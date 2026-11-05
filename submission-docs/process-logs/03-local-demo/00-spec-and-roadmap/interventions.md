# Interventions · Local demo: spec and roadmap

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-19 · REJECT · [P-057](prompts/prompts.md#p-057)
- **Claude did:** built `/design` as a skill: three roles, five stages, cross-reviews and gates. Ran stage 1 through two review rounds. That produced a v0.3 product spec (62 decisions, 32 assumptions) and four review files.
- **Caught by:** user, at the stage 1 gate.
- **Why wrong:** "we are not ready for making this a skill … the resulting docs are too complicated."
- **Changed:** the `/design` skill is deleted. The stage 1 documents and reviews moved to [`dropped-documents/dropped-from-initial-design-skill/`](../../02-feature-design-dropped/dropped-documents/dropped-from-initial-design-skill/). The work restarts as a local-demo phase. See D-27.

### I-20 · CORRECT · [P-058](prompts/prompts.md#p-058)
- **Claude did:** suggested making three source limits the CTO found during the dropped review into roadmap questions for the demo: NewsAPI's and Alpha Vantage's free tiers, and Resend's quota and domain rule ([P-057](prompts/prompts.md#p-057)).
- **Caught by:** user.
- **Why wrong:** "we likely want different sources and service providers."
- **Changed:** dropped. The roadmap starts with no source or provider assumptions.

### I-21 · CORRECT · [P-059](prompts/prompts.md#p-059)
- **Claude did:** the product designer recommended product-defined levels chosen by the user, two magnitude levels (5.0+ and 6.0+), and a cap of 5 alerts per day.
- **Caught by:** user, in the interview.
- **Why wrong:** not stated.
- **Changed:** the product alone decides what is important, the bar is set once the source data has been seen, and there is no cap. See D-29.

### I-22 · CORRECT · [P-060](prompts/prompts.md#p-060)
- **Claude did:** the product designer recommended a pause link that pauses the whole alert, and no delete in this phase. Claude recommended bringing the draft spec back to the agreed outline of about two pages.
- **Caught by:** user.
- **Why wrong:** for the pause, "Drop the link for now, make it only editable through the site." For delete and the outline: not stated.
- **Changed:** no pause anywhere, delete allowed, and the spec keeps its structure. See D-30.

### I-23 · CORRECT · [P-061](prompts/prompts.md#p-061)
- **Claude did:** read "a local-demo phase in the feature-design folder" ([P-057](prompts/prompts.md#p-057)) as the phase living directly in `feature-design/`, and created no subfolder.
- **Caught by:** user, in check C-38.
- **Why wrong:** the user expected a subfolder: "I can't see the suggested local-demo (or similar) subfolder".
- **Changed:** the demo's roadmap and milestones move to `feature-design/local-demo/`. The product spec stays at the root of `feature-design/`. See D-31.

### I-24 · CORRECT · [P-063](prompts/prompts.md#p-063)
- **Claude did:** the product designer drafted every user-facing string in the product spec: the alert message, the in-app text, and the delete confirmation.
- **Caught by:** user, in check C-40.
- **Why wrong:** "drop wording suggestion, make it dependent on the data source for now."
- **Changed:** the drafted wording is removed. The spec says what each message must carry and leaves the wording open until the data sources are known.

### I-25 · CORRECT · [P-063](prompts/prompts.md#p-063)
- **Claude did:** on the product designer's recommendation, which the user accepted in [P-059](prompts/prompts.md#p-059), the spec covered natural disasters (earthquakes) only, with news and markets under Post-MVP.
- **Caught by:** user.
- **Why wrong:** "this will give us a fuller picture about the data we can work with with less things to pivot on later."
- **Changed:** the spec covers all three kinds of event from the brief: breaking news, market movements and natural disasters. See D-32.

### I-26 · CORRECT · [P-067](prompts/prompts.md#p-067)
- **Claude did:** recommended keeping the M1 and M2 code as test-first app modules.
- **Caught by:** user, while the roadmap was being drafted.
- **Why wrong:** not stated.
- **Changed:** M1 and M2 are throwaway scripts. The real fetchers and senders are built in M3 and M5. See D-34.

