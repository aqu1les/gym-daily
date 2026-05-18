<script setup lang="ts">
import { computed } from 'vue';
import { Plus, Minus, SkipForward } from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';

const props = defineProps<{
  remaining: number;
  total: number;
  isRunning: boolean;
  progress: number;
}>();

const emit = defineEmits<{
  add: [seconds: number];
  skip: [];
}>();

const formatted = computed(() => {
  const s = Math.max(0, props.remaining);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
});

const visible = computed(() => props.isRunning || props.remaining > 0);
</script>

<template>
  <Transition
    enter-active-class="transition duration-200"
    leave-active-class="transition duration-200"
    enter-from-class="translate-y-full opacity-0"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="visible"
      class="border-t border-border bg-card/95 backdrop-blur"
      role="timer"
      :aria-label="`Descanso: ${formatted}`"
    >
      <div class="h-1 bg-secondary overflow-hidden">
        <div class="h-full bg-primary transition-all duration-1000 ease-linear" :style="{ width: `${progress * 100}%` }" />
      </div>
      <div class="max-w-md mx-auto px-4 py-2 flex items-center gap-3">
        <div class="text-2xl font-semibold tabular-nums flex-1">{{ formatted }}</div>
        <Button size="icon-sm" variant="ghost" @click="emit('add', -15)" aria-label="Reduzir 15 segundos">
          <Minus class="size-4" />
        </Button>
        <Button size="icon-sm" variant="ghost" @click="emit('add', 15)" aria-label="Adicionar 15 segundos">
          <Plus class="size-4" />
        </Button>
        <Button size="icon-sm" variant="secondary" @click="emit('skip')" aria-label="Pular descanso">
          <SkipForward class="size-4" />
        </Button>
      </div>
    </div>
  </Transition>
</template>
