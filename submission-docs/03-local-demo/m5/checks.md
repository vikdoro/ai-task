# Checks · Local demo: M5

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-87 | M5 message wording, `05-alerts-delivered.md:133-168` | [P-194](prompts/prompts.md#p-194) | [P-195](prompts/prompts.md#p-195) | OK |
| C-88 | M5 journey-run steps, `05-alerts-delivered.md:265-280`, and that `.env` holds `RESEND_API_KEY`, `DEMO_USER_EMAIL`, `SLACK_WEBHOOK_URL` | [P-194](prompts/prompts.md#p-194) | [P-195](prompts/prompts.md#p-195) | OK |
| C-89 | The two edited M3 tests, `tests/unit/poll-once.test.ts:36-37,46-47` and `tests/e2e/admin.test.ts:89` | [P-199](prompts/prompts.md#p-199) | [P-204](prompts/prompts.md#p-204) | OK |
| C-90 | `lib/storage/schema.ts`: the new `alerts_fired` and `deliveries` tables | [P-199](prompts/prompts.md#p-199) | [P-204](prompts/prompts.md#p-204) | OK |
| C-91 | The "M5 journey run" section at the end of `feature-design/local-demo/findings/delivery.md` | [P-202](prompts/prompts.md#p-202) | [P-204](prompts/prompts.md#p-204) | OK |
| C-92 | PM-17 and the v7 changelog line in `feature-design/product-spec.md` | [P-202](prompts/prompts.md#p-202) | [P-204](prompts/prompts.md#p-204) | OK |
| C-93 | The full M5 diff | [P-199](prompts/prompts.md#p-199), [P-202](prompts/prompts.md#p-202) | [P-204](prompts/prompts.md#p-204) | OK |
| C-94 | `CLAUDE.md`: the new "Reading, to save tokens" section and the "Way of working" changes | [P-206](prompts/prompts.md#p-206) | [P-207](prompts/prompts.md#p-207) | OK |
| C-95 | The new Reading sections in the planner, product-designer, executor, reviewer and explainer agent files | [P-206](prompts/prompts.md#p-206) | [P-207](prompts/prompts.md#p-207) | OK |
