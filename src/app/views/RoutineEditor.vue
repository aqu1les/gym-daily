<script setup lang="ts">
defineProps<{ id: string }>();
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6">
    <h1 class="text-xl font-semibold mb-2">Editor de rotina</h1>
    <p class="text-sm text-muted-foreground">Rotina: {{ id }}</p>
  </div>
</template>
