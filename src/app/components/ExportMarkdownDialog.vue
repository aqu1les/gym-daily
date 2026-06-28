<script setup lang="ts">
import { watch } from 'vue';
import { Copy } from 'lucide-vue-next';
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { toast } from 'vue-sonner';

const props = withDefaults(
  defineProps<{
    open: boolean;
    markdown: string;
    title?: string;
    description?: string;
  }>(),
  {
    title: 'Exportar markdown',
    description: 'Copie e cole numa plataforma de LLM. Já tentamos copiar pra você.',
  },
);

const emit = defineEmits<{ 'update:open': [boolean] }>();

async function copy(): Promise<void> {
  try {
    if (!navigator.clipboard?.writeText) {
      toast.info('Copie o texto manualmente');
      return;
    }
    await navigator.clipboard.writeText(props.markdown);
    toast.success('Markdown copiado');
  } catch {
    toast.info('Copie o texto manualmente');
  }
}

// Tenta copiar automaticamente ao abrir (dentro do gesto que abriu o dialog).
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.markdown) void copy();
  },
);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <textarea
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
        <Button type="button" @click="copy">
          <Copy class="size-4" />
          Copiar
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
