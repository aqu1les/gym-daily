<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, MoreVertical, ChevronUp, ChevronDown, Play, X } from 'lucide-vue-next';
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
import { useActiveSession } from '@/app/stores/activeSession';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { toast } from 'vue-sonner';

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
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">GymDaily</h1>
        <p class="text-sm text-muted-foreground">Suas rotinas de treino</p>
      </div>
      <Button size="icon" @click="openCreate" aria-label="Nova rotina">
        <Plus class="size-5" />
      </Button>
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
        class="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
      >
        <button
          type="button"
          class="flex-1 text-left"
          @click="openEditor(routine.id)"
        >
          <div class="font-medium">{{ routine.name }}</div>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @select="onDelete(routine.id, routine.name)">
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    </ul>

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
