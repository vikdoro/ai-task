Status: approved
Version: 1
Updated: 2026-11-05

# Roadmap

Leads from `submission-docs/feature-design/product-spec.md` to the MVP. Drafted by the user with Claude in the main session, at `submission-docs/feature-design/mvp/roadmap.md`. Each milestone is specced just in time by the planner into `submission-docs/feature-design/mvp/milestones/NN-title.md`.

The MVP builds on the local demo's code. Sign-in comes first, since nothing goes online without it. Going online comes second, because the server, the verified sending domain and sign-in links from a real address are the biggest unknowns outside the repo. The design pass comes after the screens settle, so it is done once.

## Milestones

### M1: Sign-in

- Goal: A person signs in with an emailed link that works once and expires in 15 minutes. Only the allowed domain gets a link, and at most 5 accounts can exist; both limits are set in config. A seat is taken at an account's first link click. Admins are a list of addresses in config and take no seat. The user's screens and the admin view open only to someone signed in, and the admin view only to an admin. Refused and accepted addresses see the two approved messages. Starts the MVP's fresh database.
- Depends on: none
- Why here: every later milestone needs accounts, and the app can't go online without sign-in.
- Done when: `npm test` covers the accepted, refused, full, used-link and expired-link cases, and the admin-only view. Locally, the user signs in with a link sent to their own address. The domain's value lives only in `.env`, and `.env.example` lists the key names only.
- Spec: not yet written

### M2: Online

- Goal: The app runs on one always-on Fly.io machine, with the database on a volume, behind HTTPS at an address that isn't advertised. Sign-in links are sent from the user's verified sending domain and point at the online address. Secrets are set on the host, not in the repo. Source polling stays off on the server until M4 brings the polling windows.
- Depends on: M1
- Why here: the host, the verified domain and links from a real address can each fail in ways no local test shows. Finding out early leaves room to change course.
- Done when: the user signs in on the online address from an allowed address, and is still signed up after the machine restarts. The admin view shows every source as not polling. The user runs every deploy and every command that changes the host or the domain.
- Spec: not yet written

### M3: Per-user alerts on the channel registry

Each account gets its own alert: email to the login address, and Slack by a pasted link with step-by-step help. Change and delete work as in the demo. Each channel is a module in a registry, and an alert's channels are stored as rows. A test-only channel, hidden from users, is added without changing email or Slack. It comes here because delivery needs per-account alerts before anything goes out online.

### M4: Polling windows, signal and admin

A user's first alert setup opens a 3-hour window, and all sources poll only inside a window. News is polled every 10 minutes. The simple news merge is added. The admin view gets daily delivered and failed counts per channel. It comes after M3 because windows open on alert setup.

### M5: Dark design

One fixed dark theme with web-safe fonts, basic and modern, on the sign-in screens, the user's screens and the admin view.

### M6: Shippable check

J-01 to J-05 run online for both people, inside their polling windows, against the spec's "Shippable when".

## Traceability

Every in-scope item of the MVP in `product-spec.md` maps to at least one milestone.

| Spec item | Milestone |
|---|---|
| Sign-in, domain and seat rule, admins, approved sign-in messages (PD-01) | M1 |
| J-04 Refused sign-in | M1 |
| Online on one small always-on server (PD-11) | M2 |
| J-01 Sign in and set up the alert | M1 (sign-in), M3 (setup), M6 (end to end) |
| J-02 Change channels, J-03 Delete the alert | M3 |
| Alert email fixed to login email, Slack by pasted link (PD-04, PD-05) | M3 |
| Channels as separate parts, test-only channel (PD-01, PD-18) | M3 |
| Checking windows, recipients, news every 10 minutes (PD-19 to PD-23) | M4 |
| No source checked outside a window ("Shippable when") | M2 (polling off), M4 |
| Simple news merge (PD-06), G-03 | M4 |
| Daily counts per channel, counts only (PD-09, PD-10), G-04, J-05 | M4 |
| Basic modern dark look (PD-01) | M5 |
| G-01, G-02, "Shippable when" | M6 |

## Decisions

- Milestone order as above, decided by the user (D-121): sign-in before going online, and the design pass after the screens settle.
- Hosting on Fly.io, decided by the user (D-122): little upkeep for one always-on machine with a volume.
- A fresh database, decided by the user (D-123): demo data came from samples, and the demo's file is left untouched.
- Polling stays off on the server through M2 and M3, decided by Claude: no windows exist until M4, and no agent calls live sources until the user allows it.
- The user runs every deploy and every host or domain change, decided by Claude: these act outside the repo.
- News polled every 10 minutes inside a window, decided by Claude at the user's request (D-125): at most 450 of the news allowance's tokens over 5 windows.
