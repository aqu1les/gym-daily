<script setup lang="ts">
import { ref, watch, onBeforeUnmount, useTemplateRef } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

const props = withDefaults(
  defineProps<{
    open: boolean;
    markdown: string;
    title?: string;
    description?: string;
  }>(),
  {
    title: 'Exportar markdown',
    description: 'Copie e cole numa plataforma de LLM.',
  },
);

const emit = defineEmits<{ 'update:open': [boolean] }>();

const copied = ref(false);
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea');
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function selectAll(): void {
  textarea.value?.focus();
  textarea.value?.select();
}

async function copy(): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    selectAll(); // sem clipboard: seleciona para copiar manualmente
    return;
  }
  try {
    await navigator.clipboard.writeText(props.markdown);
    copied.value = true;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => emit('update:open', false), 900);
  } catch {
    selectAll();
  }
}

// Reseta o feedback sempre que o dialog reabre.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      copied.value = false;
      clearTimeout(closeTimer);
    }
  },
);

onBeforeUnmount(() => clearTimeout(closeTimer));
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <textarea
        ref="textarea"
        :value="markdown"
        readonly
        rows="14"
        spellcheck="false"
        class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm font-mono whitespace-pre resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        @focus="(e: FocusEvent) => (e.target as HTMLTextAreaElement).select()"
      />
      <DialogFooter>
        <Button type="button" variant="ghost" @click="emit('update:open', false)">
          Fechar
        </Button>
        <Button type="button" :disabled="copied" @click="copy">
          <Check v-if="copied" class="size-4" />
          <Copy v-else class="size-4" />
          {{ copied ? 'Copiado!' : 'Copiar' }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
