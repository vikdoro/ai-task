import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ModeError, parseDeliveryMode, parsePolling, resolveConfig } from '../../lib/config.ts';
import { whenPolling } from '../../lib/runtime.ts';
import { ROOT } from '../helpers.ts';

describe('M5 AC-14 DELIVERY_MODE', () => {
  it('AC-14 unset, empty or fake is fake; live is live', () => {
    expect(parseDeliveryMode(undefined)).toBe('fake');
    expect(parseDeliveryMode('')).toBe('fake');
    expect(parseDeliveryMode('fake')).toBe('fake');
    expect(parseDeliveryMode('live')).toBe('live');
  });

  it('AC-14 any other value is refused with a message naming the allowed values', () => {
    expect(() => parseDeliveryMode('foo')).toThrow(ModeError);
    expect(() => parseDeliveryMode('foo')).toThrow(/DELIVERY_MODE.*"fake".*"live"/);
    expect(() => parseDeliveryMode('LIVE')).toThrow(/DELIVERY_MODE.*"fake".*"live"/);
  });

  it('AC-14 it is independent of SOURCE_MODE', () => {
    const env = { SOURCE_MODE: 'samples', DELIVERY_MODE: 'live' };
    expect(resolveConfig(env, '/x').mode).toBe('samples');
    expect(parseDeliveryMode(env.DELIVERY_MODE)).toBe('live');
    expect(resolveConfig({ SOURCE_MODE: 'live', DELIVERY_MODE: 'foo' }, '/x').mode).toBe('live');
  });
});

describe('M5 AC-15 POLLING', () => {
  it('AC-15 unset, empty or on is on; off is off', () => {
    expect(parsePolling(undefined)).toBe('on');
    expect(parsePolling('')).toBe('on');
    expect(parsePolling('on')).toBe('on');
    expect(parsePolling('off')).toBe('off');
  });

  it('AC-15 any other value is refused with a message naming the allowed values', () => {
    expect(() => parsePolling('foo')).toThrow(ModeError);
    expect(() => parsePolling('foo')).toThrow(/POLLING.*"on".*"off"/);
  });

  it('AC-15 poll:once ignores POLLING: resolveConfig does not read it', () => {
    expect(() => resolveConfig({ POLLING: 'foo' }, '/x')).not.toThrow();
  });

  it('AC-15 with POLLING=off a scheduled task runs no poll; on or unset, it does', async () => {
    let polls = 0;
    const poll = async () => ++polls;
    expect(await whenPolling(poll, { POLLING: 'off' })).toEqual({ result: 'polling off' });
    expect(polls).toBe(0);
    expect(await whenPolling(poll, { POLLING: 'on' })).toEqual({ result: 1 });
    expect(await whenPolling(poll, {})).toEqual({ result: 2 });
  });

  it('AC-15 each scheduled task wraps its pollSource call in whenPolling, and the plugin checks POLLING', () => {
    for (const s of ['gdacs', 'twelvedata', 'eventregistry']) {
      const src = readFileSync(join(ROOT, `server/tasks/poll/${s}.ts`), 'utf8');
      expect(src).toContain(`whenPolling(async () => pollSource('${s}', await getPollContext()))`);
    }
    const plugin = readFileSync(join(ROOT, 'server/plugins/polling.ts'), 'utf8');
    expect(plugin).toMatch(/serverPolling\(\)/);
    expect(plugin).toMatch(/serverDeliveryMode\(\)/);
  });
});
