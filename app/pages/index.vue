<script setup lang="ts">
import type { AlertState } from '../../lib/alert.ts';

useHead({ title: 'Your alert' });

const { data } = await useFetch<AlertState>('/api/alert');
</script>

<template>
  <main class="user">
    <h1>Your alert</h1>
    <AlertPanel v-if="data" :initial="data" />
  </main>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 1.5rem;
  color: #1a1a1a;
  background: #fff;
}
.user fieldset {
  border: none;
  padding: 0;
  margin: 0 0 1rem;
  display: grid;
  gap: 0.5rem;
}
.user button + button {
  margin-left: 0.5rem;
}
</style>
