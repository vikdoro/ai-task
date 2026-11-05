<script setup lang="ts">
import type { AlertState } from '../../../lib/alert.ts';

const PICK_ONE = 'Pick at least one channel.';

const props = defineProps<{ initial: AlertState }>();

const alert = ref<AlertState>(props.initial);
const ticked = reactive({ email: props.initial.email.ticked, slack: props.initial.slack.ticked });
const message = ref('');
const confirming = ref(false);
const busy = ref(false);

function show(state: AlertState) {
  alert.value = state;
  ticked.email = state.email.ticked;
  ticked.slack = state.slack.ticked;
}

function reasonOf(err: unknown): string | undefined {
  const data = (err as { data?: { reason?: unknown } } | null)?.data;
  return typeof data?.reason === 'string' ? data.reason : undefined;
}

async function save() {
  message.value = '';
  // Setup needs at least one channel (AC-7); a change may have none (AC-8).
  if (!alert.value.exists && !ticked.email && !ticked.slack) {
    message.value = PICK_ONE;
    return;
  }
  busy.value = true;
  try {
    show(await $fetch<AlertState>('/api/alert', { method: 'PUT', body: { email: ticked.email, slack: ticked.slack } }));
    message.value = 'Alert saved.';
  } catch (err) {
    message.value = reasonOf(err) === PICK_ONE ? PICK_ONE : 'Your alert could not be saved. Please try again.';
  } finally {
    busy.value = false;
  }
}

function askDelete() {
  message.value = '';
  confirming.value = true;
}

async function confirmDelete() {
  busy.value = true;
  try {
    show(await $fetch<AlertState>('/api/alert', { method: 'DELETE' }));
    message.value = 'Alert deleted.';
  } catch {
    message.value = 'Your alert could not be deleted. It is unchanged. Please try again.';
  } finally {
    confirming.value = false;
    busy.value = false;
  }
}
</script>

<template>
  <section class="alert-panel">
    <p v-if="message" role="status">{{ message }}</p>

    <div v-if="confirming">
      <p>Delete your alert? Nothing more will be sent until you set up a new one.</p>
      <button type="button" :disabled="busy" @click="confirmDelete">Delete</button>
      <button type="button" :disabled="busy" @click="confirming = false">Keep alert</button>
    </div>

    <div v-else>
      <template v-if="alert.exists">
        <p>Your alert is set up.</p>
        <p>Covers: Breaking news, Market movements, Natural disasters</p>
      </template>
      <p v-else>You have no alert set up. Choose where to hear about important breaking news, market movements and natural disasters.</p>

      <fieldset>
        <label data-channel="email">
          <input v-model="ticked.email" type="checkbox" name="email" :disabled="!alert.email.available" />
          {{ alert.email.available ? `Email (${alert.email.address})` : 'Email (not set up)' }}
        </label>
        <label data-channel="slack">
          <input v-model="ticked.slack" type="checkbox" name="slack" :disabled="!alert.slack.available" />
          {{ alert.slack.available ? 'Slack (demo channel)' : 'Slack (not set up)' }}
        </label>
      </fieldset>

      <button type="button" :disabled="busy" @click="save">Save alert</button>
      <button v-if="alert.exists" type="button" :disabled="busy" @click="askDelete">Delete alert</button>
    </div>
  </section>
</template>
