# Checks · Local demo: M4

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-76 | `phases.md`'s milestone ranges are right, mainly M1 ending at P-107 and M2 at P-143 | [P-175](prompts/prompts.md#p-175) | [P-176](prompts/prompts.md#p-176) | OK |
| C-77 | Cross-phase links resolve, such as those in `03-local-demo/m3/decisions.md` and the dropped documents' `README.md` | [P-175](prompts/prompts.md#p-175) | [P-176](prompts/prompts.md#p-176) | OK |
| C-78 | The `prompt_log.py` diff, which finds each phase by the first link and first `P-NNN` in its `phases.md` row | [P-175](prompts/prompts.md#p-175) | [P-176](prompts/prompts.md#p-176) | OK |
| C-79 | The prompt hook names `03-local-demo/m4/` in its reminder and writes P-176 into `03-local-demo/m4/prompts/prompts.md` | [P-175](prompts/prompts.md#p-175) | [P-177](prompts/prompts.md#p-177) | OK |
| C-80 | The M4 spec's in-app wording (lines 89–114), including no extra message when no channel is ticked (D-78) | [P-180](prompts/prompts.md#p-180) | [P-183](prompts/prompts.md#p-183) | OK |
| C-81 | M4 spec AC-6 and AC-3: a stored value keeps its channel available, and each save refreshes the stored values from a key that is set | [P-180](prompts/prompts.md#p-180) | [P-183](prompts/prompts.md#p-183) | OK |
| C-82 | M4 spec AC-18: storing the webhook URL in the gitignored `data/*.db` `alert` table is acceptable | [P-180](prompts/prompts.md#p-180) | [P-183](prompts/prompts.md#p-183) | OK |
| C-83 | `.env` already has `DEMO_USER_EMAIL` and `SLACK_WEBHOOK_URL` from M2, as the hand check's step 1 assumes | [P-180](prompts/prompts.md#p-180) | [P-183](prompts/prompts.md#p-183) | OK |
| C-84 | M4 hand check: set up, change, untick both, Keep alert then delete, and `/admin` shows no email address | [P-187](prompts/prompts.md#p-187) | [P-188](prompts/prompts.md#p-188) | Finding: "redirected to http://localhost:3000/hu/ which is then a 404" → I-49 |
| C-85 | `lib/storage/schema.ts:28-36`: the `alert` table's single-row `id INTEGER PRIMARY KEY CHECK (id = 1)` column, which is not in the spec's column list | [P-187](prompts/prompts.md#p-187) | [P-188](prompts/prompts.md#p-188) | OK |
| C-86 | The full M4 diff, including `vitest.config.ts`'s two test groups | [P-187](prompts/prompts.md#p-187) | [P-188](prompts/prompts.md#p-188) | OK |
