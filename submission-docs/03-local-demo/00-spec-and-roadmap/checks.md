# Checks · Local demo: spec and roadmap

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-36 | `submission-docs/dropped-documents/` holds the spec, assumptions, README and four reviews | [P-057](prompts/prompts.md#p-057) | [P-058](prompts/prompts.md#p-058) | OK |
| C-37 | I-19 and D-27 quote the user's reasons as meant | [P-057](prompts/prompts.md#p-057) | [P-058](prompts/prompts.md#p-058) | OK |
| C-38 | The new "Way of working" and "Approval gates" in `CLAUDE.md` describe the intended process | [P-058](prompts/prompts.md#p-058) | [P-061](prompts/prompts.md#p-061) | Finding: "I can't see the suggested local-demo (or similar) subfolder" → I-23 |
| C-39 | The `product-designer` agent's spec outline is the shape of spec the user wants | [P-058](prompts/prompts.md#p-058) | [P-063](prompts/prompts.md#p-063) | OK |
| C-40 | The drafted "Wording users see" in the product spec is approved | [P-062](prompts/prompts.md#p-062) | [P-063](prompts/prompts.md#p-063) | Finding: "drop wording suggestion, make it dependent on the data source for now" → I-24 |
| C-41 | The `local-demo/` roadmap and milestone paths read correctly in `CLAUDE.md`, `/build` and the planner | [P-062](prompts/prompts.md#p-062) | [P-063](prompts/prompts.md#p-063) | OK |
| C-42 | What the product spec leaves open (OQ-01 bars and coverage, OQ-07 wording) and defers (PM-12 to PM-15) matches what the demo should teach | [P-065](prompts/prompts.md#p-065) | [P-066](prompts/prompts.md#p-066) | OK |
| C-43 | The M1 and M2 "Done when" lines in the local-demo roadmap describe an acceptable finish | [P-067](prompts/prompts.md#p-067) | [P-068](prompts/prompts.md#p-068) | OK |
