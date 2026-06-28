<script setup lang="ts">
import { computed, ref } from 'vue';
import { resolveExerciseMedia } from '@/app/lib/exerciseMedia';
import { useExerciseLinks } from '@/app/composables/useExerciseLinks';
import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog';
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

const fullscreenEx = ref<SlimExercise | null>(null);
</script>

<template>
  <div v-if="slides.length" class="mb-3">
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
          @click="fullscreenEx = slide.ex"
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
        <button
          v-if="slide.ex"
          type="button"
          class="mt-1 block w-full text-xs text-muted-foreground underline text-center"
          @click.stop="emit('request-link', slide.name)"
        >
          trocar GIF
        </button>
      </div>
    </div>

    <Dialog :open="!!fullscreenEx" @update:open="(o: boolean) => { if (!o) fullscreenEx = null }">
      <DialogContent class="max-w-lg p-2">
        <DialogTitle class="sr-only">{{ fullscreenEx?.nome }}</DialogTitle>
        <img v-if="fullscreenEx" :src="fullscreenEx.gif" :alt="fullscreenEx.nome" class="w-full rounded-lg" />
      </DialogContent>
    </Dialog>
  </div>
</template>
