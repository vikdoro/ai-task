<script setup lang="ts">
import type { AdminAlerts, AdminEvents, AdminSources } from '../../lib/admin.ts';

useHead({ title: 'Admin: events in' });

const { data: sources, refresh: refreshSources } = await useFetch<AdminSources>('/api/admin/sources');
const { data: events, refresh: refreshEvents } = await useFetch<AdminEvents>('/api/admin/events');
const { data: alerts, refresh: refreshAlerts } = await useFetch<AdminAlerts>('/api/admin/alerts');

// Fetch the data again every 60 seconds, without reloading the page (AC-18, M5 AC-17).
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    refreshSources();
    refreshEvents();
    refreshAlerts();
  }, 60_000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <main class="admin">
    <h1>Admin: events in</h1>
    <p v-if="events && events.total === 0">Waiting for the first event.</p>
    <AdminStatusLines :lines="sources?.lines ?? []" />
    <AdminEventsTable v-if="events && events.total > 0" :events="events" />
    <AdminAlertsFired :alerts="alerts ?? null" />
  </main>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 1.5rem;
  color: #1a1a1a;
  background: #fff;
}
.admin table {
  border-collapse: collapse;
  font-size: 0.875rem;
}
.admin th,
.admin td {
  border-bottom: 1px solid #ddd;
  padding: 0.25rem 0.5rem;
  text-align: left;
  vertical-align: top;
}
</style>
