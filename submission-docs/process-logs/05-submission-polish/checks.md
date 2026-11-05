# Checks · Submission polish

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-112 | Reload the IDE's TypeScript server and confirm no TS errors remain after the `lib/poll.ts` fix | [P-235](prompts/prompts.md#p-235) | [P-236](prompts/prompts.md#p-236) | Finding: TS errors still flagged in `tests/` (`Panel.vue` not found, `responseType` 'text' vs 'json') → I-64 |
| C-113 | Restart the IDE's TS server and confirm `tests/component/alert-panel.test.ts` and `tests/e2e/admin.test.ts` are clean | [P-236](prompts/prompts.md#p-236) | [P-237](prompts/prompts.md#p-237) | Finding: `alert-panel.test.ts:4` still cannot find `Panel.vue` → I-65 |
| C-114 | Restart the TS server and confirm `tests/component/alert-panel.test.ts:4` is clean | [P-237](prompts/prompts.md#p-237) | [P-238](prompts/prompts.md#p-238) | OK |
| C-115 | Read the new `tests/shims-vue.d.ts` | [P-237](prompts/prompts.md#p-237) | [P-238](prompts/prompts.md#p-238) | OK |
| C-116 | Read the `lib/poll.ts` fix (`events` typed as `ParsedEvent[] \| undefined`) | [P-235](prompts/prompts.md#p-235), relisted in [P-238](prompts/prompts.md#p-238) | [P-239](prompts/prompts.md#p-239) | OK |
| C-117 | Read the test config changes: `tsconfig.json`, `tests/e2e/alerts.test.ts` and the new `tests/tsconfig.json` | [P-236](prompts/prompts.md#p-236), relisted in [P-238](prompts/prompts.md#p-238) | [P-239](prompts/prompts.md#p-239) | OK |
