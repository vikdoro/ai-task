<script setup lang="ts">
import type { AdminAlerts } from '../../../lib/admin.ts';

defineProps<{ alerts: AdminAlerts | null }>();
</script>

<template>
  <section class="alerts-fired">
    <h2>Alerts fired</h2>
    <p>{{ alerts && alerts.total > 0 ? alerts.countLine : 'No alerts fired yet.' }}</p>
    <table v-if="alerts && alerts.total > 0">
      <thead>
        <tr>
          <th>Cleared bar at (UTC)</th>
          <th>Kind</th>
          <th>What</th>
          <th>Alert</th>
          <th>Email</th>
          <th>Slack</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in alerts.rows" :key="`${row.kind} ${row.sourceId}`">
          <td>{{ row.clearedAt }}</td>
          <td>{{ row.kind }}</td>
          <td>{{ row.what }}</td>
          <td>{{ row.alert }}</td>
          <td>{{ row.email }}</td>
          <td>{{ row.slack }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
