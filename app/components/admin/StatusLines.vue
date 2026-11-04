<script setup lang="ts">
defineProps<{ lines: string[] }>();
</script>

<template>
  <ul class="status-lines">
    <li v-for="line in lines" :key="line">{{ line }}</li>
  </ul>
</template>
