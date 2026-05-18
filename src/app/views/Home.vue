<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Play,
  X,
  Share2,
  ClipboardPaste,
} from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useRoutines } from '@/app/composables/useRoutines';
import { useNextRoutineId } from '@/app/composables/useNextRoutineId';
import { useActiveSession } from '@/app/stores/activeSession';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { toast } from 'vue-sonner';
import {
  exportRoutineCode,
  decodeRoutineCode,
  importRoutineFromPreview,
  type ImportPreview,
} from '@/app/lib/share';

const router = useRouter();
const {
  routines,
  createRoutine,
  renameRoutine,
  deleteRoutine,
  duplicateRoutine,
  moveRoutine,
} = useRoutines();

const session = useActiveSession();
const { isActive, routineId: activeRoutineId, doneSets, totalSets } = storeToRefs(session);

const nextRoutineId = useNextRoutineId(routines);
const showSuggestion = computed(() => !isActive.value && nextRoutineId.value !== null);

const activeRoutineName = computed(() => {
  const id = activeRoutineId.value;
  if (!id) return '';
  return routines.value.find((r) => r.id === id)?.name ?? 'Treino em andamento';
});

function resumeSession(): void {
  if (!activeRoutineId.value) return;
  router.push({ name: 'session', params: { routineId: activeRoutineId.value } });
}

function discardSession(): void {
  if (!confirm('Descartar treino em andamento? O progresso será perdido.')) return;
  session.reset();
  toast.success('Treino descartado');
}

type DialogMode = 'create' | { mode: 'rename'; id: string };

const dialogOpen = ref(false);
const dialogMode = ref<DialogMode>('create');
const nameInput = ref('');

function openCreate(): void {
  dialogMode.value = 'create';
  nameInput.value = '';
  dialogOpen.value = true;
}

function openRename(id: string, currentName: string): void {
  dialogMode.value = { mode: 'rename', id };
  nameInput.value = currentName;
  dialogOpen.value = true;
}

async function submitDialog(): Promise<void> {
  const name = nameInput.value.trim();
  if (!name) {
    toast.error('Nome obrigatório');
    return;
  }
  if (dialogMode.value === 'create') {
    const id = await createRoutine(name);
    if (id) {
      toast.success('Rotina criada');
      dialogOpen.value = false;
    }
  } else {
    await renameRoutine(dialogMode.value.id, name);
    toast.success('Rotina renomeada');
    dialogOpen.value = false;
  }
}

async function onDuplicate(id: string): Promise<void> {
  const newId = await duplicateRoutine(id);
  if (newId) toast.success('Rotina duplicada');
}

async function onDelete(id: string, name: string): Promise<void> {
  if (!confirm(`Excluir a rotina "${name}"? Todos os exercícios serão removidos.`)) return;
  await deleteRoutine(id);
  toast.success('Rotina excluída');
}

function openSession(id: string): void {
  router.push({ name: 'session', params: { routineId: id } });
}

function openEditor(id: string): void {
  router.push({ name: 'routine', params: { id } });
}

async function onShare(id: string): Promise<void> {
  try {
    const code = await exportRoutineCode(id);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      toast.success('Código copiado para a área de transferência');
    } else {
      importCodeInput.value = code;
      importDialogOpen.value = true;
      toast.info('Copie o código abaixo manualmente');
    }
  } catch (err) {
    console.error(err);
    toast.error('Erro ao gerar código');
  }
}

const importDialogOpen = ref(false);
const importCodeInput = ref('');
const importPreview = ref<ImportPreview | null>(null);
const importError = ref<string | null>(null);

function openImport(): void {
  importCodeInput.value = '';
  importPreview.value = null;
  importError.value = null;
  importDialogOpen.value = true;
}

async function pasteFromClipboard(): Promise<void> {
  try {
    if (!navigator.clipboard?.readText) {
      toast.error('Cole o código manualmente');
      return;
    }
    const text = await navigator.clipboard.readText();
    importCodeInput.value = text;
    parseImport();
  } catch {
    toast.error('Permissão negada — cole manualmente');
  }
}

function parseImport(): void {
  importError.value = null;
  importPreview.value = null;
  const code = importCodeInput.value.trim();
  if (!code) return;
  try {
    importPreview.value = decodeRoutineCode(code);
  } catch (err) {
    importError.value = err instanceof Error ? err.message : 'Código inválido';
  }
}

async function confirmImport(): Promise<void> {
  if (!importPreview.value) return;
  try {
    await importRoutineFromPreview(importPreview.value);
    toast.success(`Rotina "${importPreview.value.name}" importada`);
    importDialogOpen.value = false;
  } catch (err) {
    console.error(err);
    toast.error('Erro ao importar');
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">GymDaily</h1>
        <p class="text-sm text-muted-foreground">Suas rotinas de treino</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button size="icon" aria-label="Nova rotina ou importar">
            <Plus class="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @select="openCreate">
            <Plus class="size-4" />
            Nova rotina
          </DropdownMenuItem>
          <DropdownMenuItem @select="openImport">
            <ClipboardPaste class="size-4" />
            Importar código
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>

    <button
      v-if="isActive"
      type="button"
      class="w-full mb-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-left flex items-center gap-3 hover:bg-primary/15 transition-colors"
      @click="resumeSession"
    >
      <Play class="size-5 text-primary shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="font-medium truncate">Continuar: {{ activeRoutineName }}</div>
        <div class="text-xs text-muted-foreground">
          {{ doneSets }} de {{ totalSets }} séries marcadas
        </div>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Descartar treino em andamento"
        @click.stop="discardSession"
      >
        <X class="size-4" />
      </Button>
    </button>

    <div
      v-if="routines.length === 0"
      class="rounded-lg border border-dashed border-border p-8 text-center"
    >
      <p class="text-sm text-muted-foreground mb-4">Nenhuma rotina ainda.</p>
      <Button variant="secondary" @click="openCreate">
        <Plus class="size-4" />
        Criar primeira rotina
      </Button>
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="(routine, idx) in routines"
        :key="routine.id"
        class="flex items-center gap-2 rounded-lg border p-3 transition-colors"
        :class="showSuggestion && routine.id === nextRoutineId
          ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
          : 'border-border bg-card'"
      >
        <button
          type="button"
          class="flex-1 text-left min-w-0"
          @click="openEditor(routine.id)"
        >
          <div class="font-medium truncate">{{ routine.name }}</div>
          <div
            v-if="showSuggestion && routine.id === nextRoutineId"
            class="text-xs text-primary mt-0.5"
          >
            Próximo treino
          </div>
        </button>

        <Button size="icon-sm" variant="ghost" :disabled="idx === 0" @click="moveRoutine(routine.id, 'up')" aria-label="Mover para cima">
          <ChevronUp class="size-4" />
        </Button>
        <Button size="icon-sm" variant="ghost" :disabled="idx === routines.length - 1" @click="moveRoutine(routine.id, 'down')" aria-label="Mover para baixo">
          <ChevronDown class="size-4" />
        </Button>

        <Button size="icon-sm" variant="default" @click="openSession(routine.id)" aria-label="Iniciar treino">
          <Play class="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="icon-sm" variant="ghost" aria-label="Mais ações">
              <MoreVertical class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="openRename(routine.id, routine.name)">
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem @select="onDuplicate(routine.id)">
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem @select="onShare(routine.id)">
              <Share2 class="size-4" />
              Compartilhar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @select="onDelete(routine.id, routine.name)">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    </ul>

    <Dialog v-model:open="importDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar rotina</DialogTitle>
          <DialogDescription>
            Cole o código gerado por outro celular. Uma nova rotina será criada (não sobrescreve nada).
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-3">
          <div class="space-y-1.5">
            <Label for="import-code">Código</Label>
            <textarea
              id="import-code"
              v-model="importCodeInput"
              rows="4"
              placeholder="gd1:..."
              autocomplete="off"
              spellcheck="false"
              class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm font-mono break-all resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              @input="parseImport"
            />
            <Button type="button" variant="ghost" size="sm" @click="pasteFromClipboard">
              <ClipboardPaste class="size-4" />
              Colar do clipboard
            </Button>
          </div>
          <div
            v-if="importPreview"
            class="rounded-md border border-border bg-card p-3 text-sm"
          >
            <div class="font-medium">{{ importPreview.name }}</div>
            <div class="text-xs text-muted-foreground">
              {{ importPreview.exerciseCount }} exercício{{ importPreview.exerciseCount === 1 ? '' : 's' }}
            </div>
          </div>
          <p v-if="importError" class="text-xs text-destructive">{{ importError }}</p>
          <DialogFooter>
            <Button type="button" variant="ghost" @click="importDialogOpen = false">Cancelar</Button>
            <Button type="button" :disabled="!importPreview" @click="confirmImport">
              Importar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ dialogMode === 'create' ? 'Nova rotina' : 'Renomear rotina' }}
          </DialogTitle>
          <DialogDescription>
            {{ dialogMode === 'create' ? 'Dê um nome para sua rotina (ex: Treino A, PPL Push).' : 'Atualize o nome da rotina.' }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitDialog" class="space-y-3">
          <div class="space-y-1.5">
            <Label for="routine-name">Nome</Label>
            <Input
              id="routine-name"
              v-model="nameInput"
              placeholder="Treino A"
              autofocus
              autocomplete="off"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" @click="dialogOpen = false">Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
