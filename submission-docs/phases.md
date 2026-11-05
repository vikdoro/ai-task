# Phases

The work in order. Each phase has its own folder holding its four logs: `prompts/prompts.md`, `decisions.md`, `interventions.md` and `checks.md`. IDs run on across phases, and the ranges below say which folder holds an ID. A phase ends when the user says so; its ranges are filled in then. Roadmap milestones from `feature-design/local-demo/roadmap.md` become phases of their own, under `03-local-demo/`.

The last row is the open phase, and the prompt hook writes there. Each row's Prompts cell starts with its first prompt ID, which the hook reads to split the prompt log, so keep that format.

| Phase | Folder | What | Prompts | Decisions | Interventions | Checks |
|---|---|---|---|---|---|---|
| Setup | [`01-setup/`](01-setup/) | Agent workflow, prompt logging, process logs, Node tooling, README | [P-001](01-setup/prompts/prompts.md#p-001) – [P-034](01-setup/prompts/prompts.md#p-034), plus [`prompts-elsewhere/`](01-setup/prompts/prompts-elsewhere/prompts.md) | D-01 – D-11 | I-01 – I-11 | C-01 – C-26 |
| Feature design | [`02-feature-design-dropped/`](02-feature-design-dropped/) | Design team agents and `/design`; stage 1 run, then dropped (I-19) | [P-035](02-feature-design-dropped/prompts/prompts.md#p-035) – [P-056](02-feature-design-dropped/prompts/prompts.md#p-056) | D-12 – D-26 | I-12 – I-18 | C-27 – C-35 |
| Local demo: spec and roadmap | [`03-local-demo/00-spec-and-roadmap/`](03-local-demo/00-spec-and-roadmap/) | Non-technical product spec, roadmap to a local demo of one journey with real sources, email and Slack | [P-057](03-local-demo/00-spec-and-roadmap/prompts/prompts.md#p-057) – [P-070](03-local-demo/00-spec-and-roadmap/prompts/prompts.md#p-070) | D-27 – D-34 | I-19 – I-26 | C-36 – C-43 |
| M1 | [`03-local-demo/m1/`](03-local-demo/m1/) | Try the data sources | [P-071](03-local-demo/m1/prompts/prompts.md#p-071) – [P-107](03-local-demo/m1/prompts/prompts.md#p-107) | D-35 – D-52 | I-27 – I-34 | C-44 – C-53 |
| M2 | [`03-local-demo/m2/`](03-local-demo/m2/) | Try email and Slack delivery | [P-108](03-local-demo/m2/prompts/prompts.md#p-108) – [P-143](03-local-demo/m2/prompts/prompts.md#p-143) | D-53 – D-61 | I-35 – I-39 | C-54 – C-64 |
| M3 | [`03-local-demo/m3/`](03-local-demo/m3/) | Events in and the admin view, with the tech stack calls before it | [P-144](03-local-demo/m3/prompts/prompts.md#p-144) – [P-173](03-local-demo/m3/prompts/prompts.md#p-173) | D-62 – D-71 | I-40 – I-45 | C-65 – C-75 |
| M4 | [`03-local-demo/m4/`](03-local-demo/m4/) | Set up the alert; opened with the split of these logs into phase folders | [P-174](03-local-demo/m4/prompts/prompts.md#p-174) – [P-191](03-local-demo/m4/prompts/prompts.md#p-191) | D-72 – D-84 | I-46 – I-49 | C-76 – C-86 |
| M5 | [`03-local-demo/m5/`](03-local-demo/m5/) | Alerts delivered, the journey complete | from [P-192](03-local-demo/m5/prompts/prompts.md#p-192) | from D-85 | from I-50 | from C-87 |
