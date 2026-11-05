import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, cleanupTmp, tmpDir } from '../helpers.ts';

afterEach(cleanupTmp);

// The committed demo samples in samples/ (D-129), replayed by poll:once with no SAMPLES_DIR set.
function run(db: string) {
  const clean = { ...process.env };
  for (const k of ['SOURCE_MODE', 'SAMPLES_DIR', 'DB_PATH', 'DELIVERY_MODE', 'TWELVE_DATA_API_KEY', 'EVENT_REGISTRY_API_KEY']) delete clean[k];
  return spawnSync('node', ['--import', join(ROOT, 'tests/setup/no-network-child.mjs'), 'scripts/poll-once.ts'], {
    cwd: ROOT,
    env: { ...clean, DB_PATH: db },
    encoding: 'utf8',
  });
}

describe('demo samples', () => {
  it('replays samples/ by default: one event of each kind in round 1, four new in round 2, none in round 3', () => {
    const db = join(tmpDir(), 'demo.db');
    const rounds = [1, 2, 3].map(() => run(db));
    for (const r of rounds) {
      expect(r.stderr).toBe('');
      expect(r.status).toBe(0);
    }
    expect(rounds.map((r) => r.stdout.trim().split('\n'))).toEqual([
      ['gdacs ok 3 items, 1 made the cut', 'twelvedata ok 6 items, 1 made the cut', 'eventregistry ok 2 items, 1 made the cut', 'alerts: 0 sent, 3 not sent'],
      ['gdacs ok 2 items, 2 made the cut', 'twelvedata ok 6 items, 2 made the cut', 'eventregistry ok 2 items, 2 made the cut', 'alerts: 0 sent, 4 not sent'],
      ['gdacs ok 1 items, 1 made the cut', 'twelvedata ok 6 items, 0 made the cut', 'eventregistry ok 1 items, 0 made the cut', 'alerts: 0 sent, 0 not sent'],
    ]);
  });
});
