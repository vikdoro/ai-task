# Checks · Local demo: M4

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-76 | `phases.md`'s milestone ranges are right, mainly M1 ending at P-107 and M2 at P-143 | [P-175](prompts/prompts.md#p-175) | [P-176](prompts/prompts.md#p-176) | OK |
| C-77 | Cross-phase links resolve, such as those in `03-local-demo/m3/decisions.md` and the dropped documents' `README.md` | [P-175](prompts/prompts.md#p-175) | [P-176](prompts/prompts.md#p-176) | OK |
| C-78 | The `prompt_log.py` diff, which finds each phase by the first link and first `P-NNN` in its `phases.md` row | [P-175](prompts/prompts.md#p-175) | [P-176](prompts/prompts.md#p-176) | OK |
| C-79 | The prompt hook names `03-local-demo/m4/` in its reminder and writes P-176 into `03-local-demo/m4/prompts/prompts.md` | [P-175](prompts/prompts.md#p-175) | [P-177](prompts/prompts.md#p-177) | OK |
