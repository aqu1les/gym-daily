<script setup lang="ts">
defineProps<{ routineId: string }>();
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6">
    <h1 class="text-xl font-semibold mb-2">Sessão de treino</h1>
    <p class="text-sm text-muted-foreground">Rotina: {{ routineId }}</p>
  </div>
</template>
