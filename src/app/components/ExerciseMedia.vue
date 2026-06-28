<script setup lang="ts">
import { computed, ref } from 'vue';
import { resolveExerciseMedia } from '@/app/lib/exerciseMedia';
import { useExerciseLinks } from '@/app/composables/useExerciseLinks';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';
import type { SlimExercise } from '@/app/data/exercise-catalog';

const props = defineProps<{ names: string[] }>();
const emit = defineEmits<{ 'request-link': [name: string] }>();

const { links } = useExerciseLinks();

interface Slide { name: string; ex: SlimExercise | null }
const slides = computed<Slide[]>(() =>
  props.names.filter(Boolean).map((name) => ({
    name,
    ex: resolveExerciseMedia(name, links.value),
  })),
);

const hasAny = computed(() => slides.value.some((s) => s.ex));
const fullscreenGif = ref<string | null>(null);
</script>

<template>
  <div v-if="hasAny" class="mb-3">
    <div class="flex gap-2 overflow-x-auto snap-x snap-mandatory rounded-lg">
      <div
        v-for="slide in slides"
        :key="slide.name"
        class="snap-center shrink-0 w-full"
      >
        <button
          v-if="slide.ex"
          type="button"
          class="block w-full"
          @click="fullscreenGif = slide.ex.gif"
        >
          <img
            :src="slide.ex.gif"
            :alt="slide.ex.nome"
            loading="lazy"
            class="w-full rounded-lg bg-muted aspect-video object-contain"
          />
          <span class="mt-1 block text-xs text-muted-foreground text-center">
            {{ slide.ex.nome }}
          </span>
        </button>
        <button
          v-else
          type="button"
          class="flex w-full aspect-video items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground"
          @click="emit('request-link', slide.name)"
        >
          Vincular GIF de "{{ slide.name }}"
        </button>
      </div>
    </div>

    <Dialog :open="!!fullscreenGif" @update:open="(o: boolean) => { if (!o) fullscreenGif = null }">
      <DialogContent class="max-w-lg p-2">
        <img v-if="fullscreenGif" :src="fullscreenGif" class="w-full rounded-lg" />
      </DialogContent>
    </Dialog>
  </div>
</template>
