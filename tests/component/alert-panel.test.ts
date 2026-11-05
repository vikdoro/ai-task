import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import AlertPanel from '../../app/components/alert/Panel.vue';
import type { AlertState } from '../../lib/alert.ts';

const ADDRESS = 'fake-user@example.invalid';
const NONE: AlertState = { exists: false, email: { ticked: false, available: true, address: ADDRESS }, slack: { ticked: false, available: true } };
const SET: AlertState = { exists: true, email: { ticked: true, available: true, address: ADDRESS }, slack: { ticked: false, available: true } };
const BOTH: AlertState = { exists: true, email: { ticked: true, available: true, address: ADDRESS }, slack: { ticked: true, available: true } };
const ZERO: AlertState = { exists: true, email: { ticked: false, available: true, address: ADDRESS }, slack: { ticked: false, available: true } };

const INTRO = 'You have no alert set up. Choose where to hear about important breaking news, market movements and natural disasters.';
const SAVE_FAIL = 'Your alert could not be saved. Please try again.';
const DELETE_FAIL = 'Your alert could not be deleted. It is unchanged. Please try again.';
const CONFIRM = 'Delete your alert? Nothing more will be sent until you set up a new one.';

class HttpError extends Error {
  constructor(status: number, data: unknown) {
    super(`HTTP ${status}`);
    Object.assign(this, { status, statusCode: status, data });
  }
}

// $fetch is a Nuxt auto-import, so the API is mocked through it.
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
mockNuxtImport('$fetch', () => fetchMock);

function stubFetch(impl: (url: string, opts: { method?: string; body?: unknown }) => unknown) {
  fetchMock.mockImplementation(async (url: string, opts: { method?: string; body?: unknown } = {}) => impl(url, opts));
  return fetchMock;
}

afterEach(() => {
  fetchMock.mockReset();
});

const button = (w: VueWrapper, label: string) => {
  const b = w.findAll('button').find((x) => x.text() === label);
  if (!b) throw new Error(`no button ${label}`);
  return b;
};
const hasButton = (w: VueWrapper, label: string) => w.findAll('button').some((x) => x.text() === label);
const box = (w: VueWrapper, name: 'email' | 'slack') => w.get<HTMLInputElement>(`input[name="${name}"]`);
const label = (w: VueWrapper, name: 'email' | 'slack') => w.get(`label[data-channel="${name}"]`).text();

describe('AC-15 no alert', () => {
  it('AC-15 shows the intro, both channels unticked and Save alert', () => {
    const w = mount(AlertPanel, { props: { initial: NONE } });
    expect(w.text()).toContain(INTRO);
    expect(label(w, 'email')).toBe(`Email (${ADDRESS})`);
    expect(label(w, 'slack')).toBe('Slack (demo channel)');
    expect(box(w, 'email').element.checked).toBe(false);
    expect(box(w, 'slack').element.checked).toBe(false);
    expect(box(w, 'email').element.disabled).toBe(false);
    expect(hasButton(w, 'Save alert')).toBe(true);
    expect(hasButton(w, 'Delete alert')).toBe(false);
    expect(w.text()).not.toContain('Your alert is set up.');
  });

  it('AC-15 a channel whose key is not set shows (not set up) and is disabled', () => {
    const w = mount(AlertPanel, { props: { initial: { exists: false, email: { ticked: false, available: false, address: null }, slack: { ticked: false, available: false } } } });
    expect(label(w, 'email')).toBe('Email (not set up)');
    expect(label(w, 'slack')).toBe('Slack (not set up)');
    expect(box(w, 'email').element.disabled).toBe(true);
    expect(box(w, 'slack').element.disabled).toBe(true);
  });

  it('AC-15 Save alert with nothing ticked shows Pick at least one channel. and saves nothing', async () => {
    const f = stubFetch(() => NONE);
    const w = mount(AlertPanel, { props: { initial: NONE } });
    await button(w, 'Save alert').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('Pick at least one channel.');
    expect(f).not.toHaveBeenCalled();
  });
});

describe('AC-16 an alert exists', () => {
  it('AC-16 shows set up, covers, the channels ticked as stored, Save and Delete', () => {
    const w = mount(AlertPanel, { props: { initial: SET } });
    expect(w.text()).toContain('Your alert is set up.');
    expect(w.text()).toContain('Covers: Breaking news, Market movements, Natural disasters');
    expect(w.text()).not.toContain(INTRO);
    expect(label(w, 'email')).toBe(`Email (${ADDRESS})`);
    expect(label(w, 'slack')).toBe('Slack (demo channel)');
    expect(box(w, 'email').element.checked).toBe(true);
    expect(box(w, 'slack').element.checked).toBe(false);
    expect(hasButton(w, 'Save alert')).toBe(true);
    expect(hasButton(w, 'Delete alert')).toBe(true);
  });

  it('AC-16 a channel that is not available shows (not set up) and is disabled', () => {
    const w = mount(AlertPanel, { props: { initial: { ...SET, slack: { ticked: false, available: false } } } });
    expect(label(w, 'slack')).toBe('Slack (not set up)');
    expect(box(w, 'slack').element.disabled).toBe(true);
  });

  it('AC-16 an alert with zero channels shows both unticked and no other message', () => {
    const w = mount(AlertPanel, { props: { initial: ZERO } });
    expect(box(w, 'email').element.checked).toBe(false);
    expect(box(w, 'slack').element.checked).toBe(false);
    expect(w.text()).toContain('Your alert is set up.');
    expect(w.find('[role="status"]').exists() ? w.get('[role="status"]').text() : '').toBe('');
  });
});

describe('AC-17 saving', () => {
  it('AC-17 a first setup shows Alert saved. and then the AC-16 view', async () => {
    const f = stubFetch(() => SET);
    const w = mount(AlertPanel, { props: { initial: NONE } });
    await box(w, 'email').setValue(true);
    await button(w, 'Save alert').trigger('click');
    await flushPromises();
    expect(f).toHaveBeenCalledWith('/api/alert', expect.objectContaining({ method: 'PUT', body: { email: true, slack: false } }));
    expect(w.text()).toContain('Alert saved.');
    expect(w.text()).toContain('Your alert is set up.');
    expect(hasButton(w, 'Delete alert')).toBe(true);
    expect(box(w, 'email').element.checked).toBe(true);
  });

  it('AC-17 a change shows Alert saved. and the saved state', async () => {
    stubFetch(() => BOTH);
    const w = mount(AlertPanel, { props: { initial: SET } });
    await box(w, 'slack').setValue(true);
    await button(w, 'Save alert').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('Alert saved.');
    expect(box(w, 'email').element.checked).toBe(true);
    expect(box(w, 'slack').element.checked).toBe(true);
  });

  it('AC-17 a change to zero channels is sent and saved', async () => {
    const f = stubFetch(() => ZERO);
    const w = mount(AlertPanel, { props: { initial: SET } });
    await box(w, 'email').setValue(false);
    await button(w, 'Save alert').trigger('click');
    await flushPromises();
    expect(f).toHaveBeenCalledWith('/api/alert', expect.objectContaining({ method: 'PUT', body: { email: false, slack: false } }));
    expect(w.text()).toContain('Alert saved.');
    expect(w.text()).toContain('Your alert is set up.');
  });

  it('AC-17 a server refusal with Pick at least one channel. shows that reason', async () => {
    stubFetch(() => {
      throw new HttpError(400, { reason: 'Pick at least one channel.' });
    });
    const w = mount(AlertPanel, { props: { initial: NONE } });
    await box(w, 'slack').setValue(true);
    await button(w, 'Save alert').trigger('click');
    await flushPromises();
    expect(w.text()).toContain('Pick at least one channel.');
    expect(w.text()).not.toContain(SAVE_FAIL);
  });

  it('AC-17 a failed save (non-2xx) shows the failure and keeps the ticks', async () => {
    stubFetch(() => {
      throw new HttpError(500, {});
    });
    const w = mount(AlertPanel, { props: { initial: SET } });
    await box(w, 'slack').setValue(true);
    await button(w, 'Save alert').trigger('click');
    await flushPromises();
    expect(w.text()).toContain(SAVE_FAIL);
    expect(w.text()).not.toContain('Alert saved.');
    expect(box(w, 'email').element.checked).toBe(true);
    expect(box(w, 'slack').element.checked).toBe(true);
  });

  it('AC-17 a failed save (network error) shows the failure and keeps the ticks', async () => {
    stubFetch(() => {
      throw new TypeError('fetch failed');
    });
    const w = mount(AlertPanel, { props: { initial: NONE } });
    await box(w, 'email').setValue(true);
    await button(w, 'Save alert').trigger('click');
    await flushPromises();
    expect(w.text()).toContain(SAVE_FAIL);
    expect(w.text()).toContain(INTRO);
    expect(box(w, 'email').element.checked).toBe(true);
  });
});

describe('AC-17 deleting', () => {
  it('AC-17 Delete alert asks first; nothing is deleted until Delete is pressed', async () => {
    const f = stubFetch(() => NONE);
    const w = mount(AlertPanel, { props: { initial: SET } });
    await button(w, 'Delete alert').trigger('click');
    expect(w.text()).toContain(CONFIRM);
    expect(hasButton(w, 'Delete')).toBe(true);
    expect(hasButton(w, 'Keep alert')).toBe(true);
    expect(f).not.toHaveBeenCalled();
  });

  it('AC-17 Keep alert returns to the AC-16 view with the alert unchanged', async () => {
    const f = stubFetch(() => NONE);
    const w = mount(AlertPanel, { props: { initial: SET } });
    await button(w, 'Delete alert').trigger('click');
    await button(w, 'Keep alert').trigger('click');
    expect(f).not.toHaveBeenCalled();
    expect(w.text()).not.toContain(CONFIRM);
    expect(w.text()).toContain('Your alert is set up.');
    expect(box(w, 'email').element.checked).toBe(true);
    expect(box(w, 'slack').element.checked).toBe(false);
    expect(hasButton(w, 'Delete alert')).toBe(true);
  });

  it('AC-17 a successful delete shows Alert deleted. and then the AC-15 view with nothing ticked', async () => {
    const f = stubFetch(() => NONE);
    const w = mount(AlertPanel, { props: { initial: BOTH } });
    await button(w, 'Delete alert').trigger('click');
    await button(w, 'Delete').trigger('click');
    await flushPromises();
    expect(f).toHaveBeenCalledWith('/api/alert', expect.objectContaining({ method: 'DELETE' }));
    expect(w.text()).toContain('Alert deleted.');
    expect(w.text()).toContain(INTRO);
    expect(w.text()).not.toContain('Your alert is set up.');
    expect(box(w, 'email').element.checked).toBe(false);
    expect(box(w, 'slack').element.checked).toBe(false);
    expect(hasButton(w, 'Delete alert')).toBe(false);
  });

  it('AC-17 a failed delete shows the failure and the AC-16 view stays as it was', async () => {
    stubFetch(() => {
      throw new HttpError(500, {});
    });
    const w = mount(AlertPanel, { props: { initial: SET } });
    await button(w, 'Delete alert').trigger('click');
    await button(w, 'Delete').trigger('click');
    await flushPromises();
    expect(w.text()).toContain(DELETE_FAIL);
    expect(w.text()).toContain('Your alert is set up.');
    expect(w.text()).not.toContain(CONFIRM);
    expect(box(w, 'email').element.checked).toBe(true);
    expect(box(w, 'slack').element.checked).toBe(false);
    expect(hasButton(w, 'Delete alert')).toBe(true);
  });
});
