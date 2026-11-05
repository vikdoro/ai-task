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
| C-118 | Read `submission-docs/feature-design/what-was-built-and-why.md` and confirm the local-demo wording, especially "joined them into one journey" | Request typed as a shell command, so the hook gave it no prompt ID; relisted in [P-240](prompts/prompts.md#p-240) and [P-241](prompts/prompts.md#p-241) | [P-242](prompts/prompts.md#p-242) | OK |
| C-119 | Run `npm run dev` and click through the app once with the `glob`/`minimatch` overrides (D-134) | [P-245](prompts/prompts.md#p-245) | [P-246](prompts/prompts.md#p-246) | OK |
| C-120 | Read the `package.json` and `package-lock.json` diff: only `glob`, `minimatch` and the `overrides` block change | [P-245](prompts/prompts.md#p-245) | [P-246](prompts/prompts.md#p-246) | OK |
| C-121 | Read the reason in `plan-of-attack.md`'s last paragraph ("With the time box spent…") and replace it if wrong | [P-248](prompts/prompts.md#p-248) | [P-249](prompts/prompts.md#p-249) | OK |
| C-122 | Cut or add picks in `highlights.md` | [P-248](prompts/prompts.md#p-248) | [P-249](prompts/prompts.md#p-249) | OK |
| C-123 | Confirm "Demo: one user" and the polling intervals in the `highlights.md` table | [P-248](prompts/prompts.md#p-248) | [P-249](prompts/prompts.md#p-249) | OK |
| C-124 | Read the `README.md` and `workflow.md` edits, and the `original-brief.md` note | [P-248](prompts/prompts.md#p-248) | [P-249](prompts/prompts.md#p-249) | Finding: "I edited the README.md, keep it as I left it" → I-66 |
