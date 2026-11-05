# Checks · Local demo: M1

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-44 | The GDACS Orange/Red event list and the USGS significant-month feed return live JSON in a browser | [P-073](prompts/prompts.md#p-073) | [P-074](prompts/prompts.md#p-074) | OK |
| C-45 | The GDACS terms ask only for attribution | [P-073](prompts/prompts.md#p-073) | [P-074](prompts/prompts.md#p-074) | OK: the user asked Claude to check. The terms page has a disclaimer and no licence, and links its copyright to the EU Commission legal notice: CC BY 4.0, credit the source, third-party content excepted |
| C-46 | Twelve Data's Basic plan gives 800 credits a day | [P-075](prompts/prompts.md#p-075) | [P-077](prompts/prompts.md#p-077) | OK |
| C-47 | AI Studio shows the free daily request limit for Gemini Flash-Lite | [P-077](prompts/prompts.md#p-077) | [P-078](prompts/prompts.md#p-078) | OK |
| C-48 | The Secrets section in `CLAUDE.md` says what the user meant | [P-080](prompts/prompts.md#p-080) | [P-081](prompts/prompts.md#p-081) | OK |
| C-49 | The M1 spec's acceptance criteria describe an acceptable finish for a throwaway trial | [P-079](prompts/prompts.md#p-079) | [P-081](prompts/prompts.md#p-081) | OK |
| C-50 | The M1 findings' candidate bars and FR-06 tables are enough to choose bars at the walkthrough | [P-094](prompts/prompts.md#p-094) | [P-095](prompts/prompts.md#p-095) | OK: "bars seem fine" |
| C-51 | `.env.example` lists `TWELVE_DATA_API_KEY=` and `EVENT_REGISTRY_API_KEY=` with no values and no `GEMINI_API_KEY` | [P-094](prompts/prompts.md#p-094) | [P-095](prompts/prompts.md#p-095) | OK |
| C-52 | Event Registry's free allowance: 2,000 tokens or searches, and whether it renews | [P-094](prompts/prompts.md#p-094) | [P-095](prompts/prompts.md#p-095) | OK: 2,000 tokens that never renew |
| C-53 | FR-06, DEC-27, DEC-28 and OQ-10 in the product spec state the bars, the message contents and the remaining gap as meant | [P-099](prompts/prompts.md#p-099) | [P-101](prompts/prompts.md#p-101) | OK |
