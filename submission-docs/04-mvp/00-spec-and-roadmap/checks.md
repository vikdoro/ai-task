# Checks · MVP: spec and roadmap

Every check the user ran on Claude's output, in order. Claude lists checks at the end of a reply under **Checks for you**, and the user answers them by number. An `OK` row is the whole record. For a finding, the row links to the [`interventions.md`](interventions.md) entry that holds the details. Rules are in [`CLAUDE.md`](../../CLAUDE.md#checks-for-the-user).

| ID | Check | Listed in | Answered in | Result |
|---|---|---|---|---|
| C-97 | `.claude/agents/product-designer.md:47-50`: the Chosen services exception to the no-technologies rule | [P-208](../../03-local-demo/m5/prompts/prompts.md#p-208) | [P-209](prompts/prompts.md#p-209) | OK |
| C-98 | `feature-design/local-demo/findings/delivery.md:30`: without a verified domain, the email provider only sends to the account's own address | [P-212](prompts/prompts.md#p-212) | [P-216](prompts/prompts.md#p-216) | OK |
| C-99 | `nuxt-auth-utils` gives sealed-cookie sessions in Nuxt 4 without a separate session store | [P-212](prompts/prompts.md#p-212) | [P-216](prompts/prompts.md#p-216) | Skipped: "I will skip the sealed-cookie check for now"; still open |
| C-100 | `decisions.md` D-102 to D-106 record what the user agreed | [P-213](prompts/prompts.md#p-213) | [P-216](prompts/prompts.md#p-216) | OK |
| C-101 | Repo-wide grep finds no trace of the redacted domain | [P-215](prompts/prompts.md#p-215) | [P-216](prompts/prompts.md#p-216) | OK |
| C-102 | `nuxt-auth-utils` gives sealed-cookie sessions in Nuxt 4 without a separate session store (skipped at C-99) | [P-212](prompts/prompts.md#p-212) | [P-219](prompts/prompts.md#p-219) | OK |
| C-103 | `decisions.md` D-107 to D-117 and `interventions.md` I-54 to I-57 record what the user agreed | [P-218](prompts/prompts.md#p-218) | [P-219](prompts/prompts.md#p-219) | OK |
| C-104 | `feature-design/product-spec.md` "This phase" and "Shippable when" describe the MVP the user means to ship | [P-221](prompts/prompts.md#p-221) | [P-223](prompts/prompts.md#p-223) | OK |
| C-105 | `feature-design/product-spec.md` "Later" (PM-01 to PM-13) holds every option the user deferred | [P-221](prompts/prompts.md#p-221) | [P-223](prompts/prompts.md#p-223) | OK |
| C-106 | `feature-design/product-spec.md` "Chosen services": the tech stack line matches the code | [P-221](prompts/prompts.md#p-221) | [P-223](prompts/prompts.md#p-223) | OK |
| C-107 | Fly.io: a small always-on machine with a 1 GB volume costs a few dollars a month on pay-as-you-go, and a card is required | [P-223](prompts/prompts.md#p-223) | [P-224](prompts/prompts.md#p-224) | OK |
| C-108 | "About 120 news tokens a day": one hourly news search at 5 tokens (`nuxt.config.ts:13`, `CLAUDE.md` § Live data calls) | [P-223](prompts/prompts.md#p-223) | [P-224](prompts/prompts.md#p-224) | OK; the user asked Claude to pick a faster news interval for the 3-hour window → D-125 |
| C-109 | `feature-design/product-spec.md` G-02, G-03, J-01 steps 5–6, "Checking windows" and "Shippable when" say what the user decided | [P-225](prompts/prompts.md#p-225) | [P-227](prompts/prompts.md#p-227) | OK |
| C-110 | `feature-design/mvp/roadmap.md` M1 and M2 "Done when" lines are acceptable proof | [P-225](prompts/prompts.md#p-225) | [P-227](prompts/prompts.md#p-227) | OK |
| C-111 | Secrets scan before push (`git grep` for Slack webhooks, Resend keys, Slack tokens, gmail) | [P-229](prompts/prompts.md#p-229) | [P-230](prompts/prompts.md#p-230) | OK: the one real-looking Slack URL, in M2 prompts, is the test fake `hooks.slack.com/triggers/TFAKE/1/fakefake`. The rest are placeholders, test fakes and the deliberately public commit email |
