Status: approved
Version: 1
Updated: 2026-11-04

# Roadmap

Leads from `feature-design/product-spec.md` to the local demo. Drafted by the user with Claude in the main session, at `feature-design/local-demo/roadmap.md`. Each milestone is specced just in time by the planner into `feature-design/local-demo/milestones/NN-title.md`.

The first two milestones are about learning, not features: what the sources and the delivery services really do. Their code is throwaway scripts; what they leave behind is the findings notes and samples. M3 to M5 build the app properly, test-first, on what they find.

## Milestones

### M1: Try the data sources

- Goal: For each kind of event (breaking news, market movements, natural disasters), try one or two candidate sources and pick one. Fetch real data from each and keep samples. Write down what each returns: fields, how significance is expressed, how updates and duplicates show up, how fresh the data is, and the limits and terms of its free use.
- Depends on: none
- Why here: OQ-01 (coverage and bar per kind), OQ-07 (wording) and DEC-26 (one source per kind) all wait on seeing real data. It is the biggest unknown.
- Done when: one command fetches from the chosen source for each kind and saves the samples, and a findings note proposes coverage and a bar for each kind, for the user to settle OQ-01.
- Spec: not yet written

### M2: Try email and Slack delivery

- Goal: Send a test message to the demo user's own email address through a delivery service, and to their Slack through an incoming webhook. Record each outcome, and what a failure looks like on each channel.
- Depends on: none (can run alongside M1)
- Why here: the second unknown. FR-09 needs to know which failure reasons the services give, and the service choice affects setup.
- Done when: one command sends a test message to each channel and prints delivered or failed, with the reason. A findings note records the service's limits and its failure cases.
- Spec: not yet written

### M3: Events in and the admin view

Poll the three chosen sources, store events, apply each kind's bar from OQ-01, and show them in the read-only admin view (FR-07, FR-10).

### M4: Set up the alert

The demo user's screen: set up the alert, change channels, delete it (FR-01 to FR-03, FR-11).

### M5: Alerts delivered, the journey complete

Match events that clear their bar to the alert, deliver once per channel with the approved wording (OQ-07), and show alerts fired and deliveries in the admin view (FR-05, FR-06, FR-08, FR-09). J-01 runs end to end.

## Traceability

Every in-scope item of the local demo in `product-spec.md` maps to at least one milestone.

| Spec item | Milestone |
|---|---|
| OQ-01 coverage and bar per kind | M1 (proposed), M3 (applied) |
| OQ-07 wording users see | M5, informed by M1 and M2 |
| FR-01, FR-02, FR-03, FR-11 | M4 |
| FR-05, FR-06 | M5 |
| FR-07, FR-10 | M3 |
| FR-08, FR-09 | M5, informed by M2 |
| J-01 | M5 |

## Decisions

- Two learning milestones come first, before any feature. Decided by the user (P-067), as recommended: the spec's open questions all wait on real data.
- M1 and M2 are throwaway scripts plus findings notes. The real source fetchers and channel senders are built in M3 and M5. Decided by the user (P-067); Claude had recommended keeping them as test-first app modules.
- M1 and M2 scripts live in `spikes/` at the repo root, and their findings notes and samples in `feature-design/local-demo/findings/`. Being throwaway, they have no unit tests: their verification is running the script and checking its output. Decided by Claude, accepted by the user (P-069).
- The web framework and storage are chosen in M3's spec; M1 and M2 need only the Node toolchain (D-05). Decided by the user (P-067), as recommended.

## Change log

- v1 (2026-11-04): first draft, approved by the user (P-069).
