<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { Download, Upload } from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';
import { downloadBackup, importDatabase } from '@/app/db/backup';
import { useActiveSession } from '@/app/stores/activeSession';
import { toast } from 'vue-sonner';

const session = useActiveSession();
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const busy = ref(false);

async function onExport(): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  try {
    await downloadBackup();
    toast.success('Backup baixado');
  } catch (err) {
    console.error(err);
    toast.error('Erro ao exportar');
  } finally {
    busy.value = false;
  }
}

function pickImport(): void {
  fileInput.value?.click();
}

async function onImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  const proceed = confirm(
    'Importar este backup vai SOBRESCREVER todos os dados atuais (treinos, exercícios e histórico). Continuar?',
  );
  if (!proceed) return;

  busy.value = true;
  try {
    session.reset();
    await importDatabase(file);
    toast.success('Dados importados. Recarregando...');
    setTimeout(() => window.location.reload(), 800);
  } catch (err) {
    console.error(err);
    toast.error('Arquivo inválido ou erro ao importar');
    busy.value = false;
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold">Configurações</h1>
      <p class="text-sm text-muted-foreground">Backup e restauração local</p>
    </header>

    <section class="rounded-lg border border-border bg-card p-4 space-y-3">
      <div>
        <h2 class="font-medium">Backup</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          Exporta todos os treinos, exercícios e sessões como um arquivo JSON.
        </p>
      </div>
      <Button class="w-full" :disabled="busy" @click="onExport">
        <Download class="size-4" />
        Exportar dados
      </Button>
    </section>

    <section class="rounded-lg border border-border bg-card p-4 mt-4 space-y-3">
      <div>
        <h2 class="font-medium">Restaurar</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          Importa um arquivo de backup. <strong class="text-destructive">Sobrescreve</strong> todos os dados atuais.
        </p>
      </div>
      <Button class="w-full" variant="secondary" :disabled="busy" @click="pickImport">
        <Upload class="size-4" />
        Importar dados
      </Button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="onImport"
      />
    </section>
  </div>
</template>
