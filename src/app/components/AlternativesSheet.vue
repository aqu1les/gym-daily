<script setup lang="ts">
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { Check, RotateCcw } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  originalName: string;
  activeName: string;
  alternatives: string[];
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  pick: [name: string];
  reset: [];
}>();

function choose(name: string): void {
  emit('pick', name);
  emit('update:open', false);
}

function resetToOriginal(): void {
  emit('reset');
  emit('update:open', false);
}
</script>

<template>
  <Sheet :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <SheetContent side="bottom" class="rounded-t-xl">
      <SheetHeader>
        <SheetTitle>Trocar exercício</SheetTitle>
        <SheetDescription>
          A troca vale só para esta sessão. O treino salvo não é alterado.
        </SheetDescription>
      </SheetHeader>

      <div class="px-4 pb-4 pt-2 space-y-1">
        <button
          type="button"
          class="w-full flex items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-accent transition-colors"
          @click="resetToOriginal"
        >
          <RotateCcw class="size-4 text-muted-foreground" />
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ originalName }}</div>
            <div class="text-xs text-muted-foreground">Original</div>
          </div>
          <Check v-if="activeName === originalName" class="size-4 text-primary" />
        </button>

        <button
          v-for="alt in alternatives"
          :key="alt"
          type="button"
          class="w-full flex items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-accent transition-colors"
          @click="choose(alt)"
        >
          <div class="size-4" />
          <div class="flex-1 min-w-0 font-medium truncate">{{ alt }}</div>
          <Check v-if="activeName === alt" class="size-4 text-primary" />
        </button>

        <p
          v-if="alternatives.length === 0"
          class="px-3 py-6 text-center text-sm text-muted-foreground"
        >
          Nenhuma alternativa cadastrada para este exercício.
        </p>
      </div>
    </SheetContent>
  </Sheet>
</template>
