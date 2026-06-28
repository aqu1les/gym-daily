<!-- src/app/components/ExerciseLinkSheet.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { catalogAll } from '@/app/data/exercise-catalog';
import { useExerciseLinks } from '@/app/composables/useExerciseLinks';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/app/components/ui/sheet';
import { Input } from '@/app/components/ui/input';
import { normalize } from '@/app/lib/exerciseMedia';

const props = defineProps<{ open: boolean; name: string }>();
const emit = defineEmits<{ 'update:open': [boolean] }>();

const { link } = useExerciseLinks();
const query = ref('');

watch(() => props.open, (o) => { if (o) query.value = props.name; });

const results = computed(() => {
  const q = normalize(query.value);
  if (!q) return [];
  return catalogAll.filter((e) => normalize(e.nome).includes(q)).slice(0, 30);
});

async function choose(id: string): Promise<void> {
  await link(props.name, id);
  emit('update:open', false);
}
</script>

<template>
  <Sheet :open="open" @update:open="(o: boolean) => emit('update:open', o)">
    <SheetContent side="bottom" class="max-h-[85vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>Vincular GIF de "{{ name }}"</SheetTitle>
      </SheetHeader>
      <Input v-model="query" placeholder="Buscar exercício..." class="my-3" />
      <ul class="space-y-2">
        <li v-for="ex in results" :key="ex.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left"
            @click="choose(ex.id)"
          >
            <img :src="ex.image" :alt="ex.nome" loading="lazy" class="size-12 rounded object-cover bg-muted" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{{ ex.nome }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{ ex.alvo }} · {{ ex.equipamento }}</span>
            </span>
          </button>
        </li>
      </ul>
    </SheetContent>
  </Sheet>
</template>
