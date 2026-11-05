import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../helpers.ts';

const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

describe('M5 AC-24 the delivery modules are plain TS', () => {
  const dir = join(ROOT, 'lib/delivery');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.ts')) : [];
  it('AC-24 lib/delivery holds the matching, messages, senders and storage', () => {
    for (const f of ['match.ts', 'message.ts', 'email.ts', 'slack.ts', 'store.ts']) expect(files).toContain(f);
  });
  it('AC-24 they import only relative .ts paths, node: modules or db0, and use no enum, namespace or parameter properties', () => {
    for (const f of files) {
      const src = readFileSync(join(dir, f), 'utf8');
      for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|^import\s+['"]([^'"]+)['"]/gm)) {
        const spec = m[1] ?? m[2] ?? m[3];
        expect(spec.startsWith('.') ? spec.endsWith('.ts') : spec.startsWith('node:') || spec === 'db0' || spec.startsWith('db0/'), `${f}: ${spec}`).toBe(true);
      }
      expect(src, f).not.toMatch(/\benum\s+\w+|\bnamespace\s+\w+|constructor\s*\([^)]*\b(public|private|protected|readonly)\s/);
    }
  });
});

describe('M5 AC-17 the admin page refreshes the alerts', () => {
  it('AC-17 /admin fetches /api/admin/alerts and refreshes it every 60 seconds with the other two', () => {
    const page = readFileSync(join(ROOT, 'app/pages/admin.vue'), 'utf8');
    expect(page).toContain("'/api/admin/alerts'");
    expect(page).toMatch(/setInterval\(\(\) => \{[^}]*refreshAlerts\(\)[^}]*\}, 60_000\)/);
  });
  it('AC-17 the route is GET only by its file name', () => {
    expect(readdirSync(join(ROOT, 'server/api/admin')).sort()).toEqual(['alerts.get.ts', 'events.get.ts', 'sources.get.ts']);
  });
});

describe('M5 AC-26 untouched paths', () => {
  it('AC-26 no diff to nuxt.config.ts, .env.example, the product spec, the roadmap or spikes/', () => {
    expect(git('diff', 'HEAD', '--stat', '--', 'nuxt.config.ts', '.env.example', 'feature-design/local-demo/product-spec.md', 'feature-design/local-demo/roadmap.md', 'spikes')).toBe('');
    expect(git('status', '--porcelain', '--', 'spikes', 'data')).toBe('');
  });
});

describe('M5 AC-27 the journey-run record', () => {
  it('AC-27 findings/delivery.md ends with an "M5 journey run" section', () => {
    const text = readFileSync(join(ROOT, 'feature-design/local-demo/findings/delivery.md'), 'utf8');
    const at = text.lastIndexOf('\n## M5 journey run');
    expect(at).toBeGreaterThan(0);
    expect(text.slice(at + 1)).not.toMatch(/\n## /);
  });
});
