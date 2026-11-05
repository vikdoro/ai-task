# Interventions · Local demo: M5

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-50 · CORRECT · [P-193](prompts/prompts.md#p-193)
- **Claude did:** recommended showing J-01 with two runs: the samples journey run, and the 60-minute live run deferred from M3 (D-71).
- **Caught by:** user, in the M5 interview.
- **Why wrong:** not stated. The user picked "Journey run only".
- **Changed:** M5 is shown with the samples journey run alone, and the live run stays deferred. See D-90.

### I-51 · CORRECT · [P-200](prompts/prompts.md#p-200)
- **Claude did:** M5 sends one alert per source event ID, as the spec says. In the journey run, two Event Registry events with the same headline (eng-12155091, eng-12157638) sent two identical-looking alerts.
- **Caught by:** user, in the J-01 journey run: "Why Alaska news appear twice?"
- **Why wrong:** not a defect against the spec. Event Registry split one story into two events. To the user it reads as a duplicate.
- **Changed:** M5 code unchanged. The case is recorded in the journey record, and a merge rule goes to the product spec's Later section. See D-95.
