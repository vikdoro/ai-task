# Demo samples

Made-up source responses for the offline local demo, in the same shape as the real ones. The app replays them by default (`SAMPLES_DIR` unset): one round per `npm run poll:once`, then the last round again. See [`RUNNING.md`](../RUNNING.md#2-try-it-with-no-keys).

- Round 1: one event of each kind clears its bar (a tropical cyclone, a stock index fund up 3.6%, a major news story).
- Round 2: four new ones clear (an earthquake, bitcoin up 9.2%, gold down 3.4%, a second news story). The cyclone and the first story repeat and are not sent again.
- Round 3: a quiet round, with nothing new over its bar.

Every round also holds events below their bar. Names, places and figures are generic and describe no real event. The real responses recorded during development are in `spikes/samples/`, which is gitignored.
