# What was built and why

The work ran in two phases, each in its own folder.

## `local-demo/`: finding the limits

The local demo was built to find out what the data sources and the delivery methods allow before committing to a real product. It tried the data sources (GDACS, Twelve Data, Event Registry) and the two delivery methods (email and Slack) to learn their limits: what each returns, how often it can be called, what it costs, and what can go wrong. Then it joined them into one journey on a single machine: events come in, a user sets up an alert, and the alert is delivered.

What it learned is in [`local-demo/findings/`](local-demo/findings/). This phase is done and frozen.

## `mvp/`: towards the first release

The MVP builds on the local demo's code and findings towards a first release that real people can use online. The [product spec](product-spec.md) says what it must do, and the [roadmap](mvp/roadmap.md) splits it into six milestones: sign-in, going online, per-user alerts, polling windows, a dark design, and a final check.

The roadmap is approved, but none of its milestones has been built yet.
