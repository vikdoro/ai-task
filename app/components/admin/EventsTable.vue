<script setup lang="ts">
import type { AdminEvents } from '../../../lib/admin.ts';

defineProps<{ events: AdminEvents }>();
</script>

<template>
  <section>
    <p>{{ events.countLine }}</p>
    <table>
      <thead>
        <tr>
          <th>Received (UTC)</th>
          <th>Kind</th>
          <th>What</th>
          <th>Where</th>
          <th>Source time</th>
          <th>Measure</th>
          <th>Current</th>
          <th>Cleared bar</th>
          <th>Source ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in events.rows" :key="`${row.kind} ${row.sourceId}`">
          <td>{{ row.received }}</td>
          <td>{{ row.kind }}</td>
          <td>{{ row.what }}</td>
          <td>{{ row.where }}</td>
          <td>{{ row.sourceTime }}</td>
          <td>{{ row.measure }}</td>
          <td>{{ row.current }}</td>
          <td>{{ row.clearedBar }}</td>
          <td>{{ row.sourceId }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
