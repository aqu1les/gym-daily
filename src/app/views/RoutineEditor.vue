<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { db, type Exercise } from '@/app/db/schema';
import { useLiveQuery } from '@/app/db/live';
import { useExercises, type ExerciseDraft } from '@/app/composables/useExercises';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Plus,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Play,
} from 'lucide-vue-next';
import ExerciseSheet from '@/app/components/ExerciseSheet.vue';
import { toast } from 'vue-sonner';

const props = defineProps<{ id: string }>();
const router = useRouter();

const routine = useLiveQuery(() => db.routines.get(props.id), undefined);
const { exercises, addExercise, updateExercise, deleteExercise, moveExercise } = useExercises(
  props.id,
);

const sheetOpen = ref(false);
const editing = ref<Exercise | undefined>(undefined);

function openCreate(): void {
  editing.value = undefined;
  sheetOpen.value = true;
}

function openEdit(ex: Exercise): void {
  editing.value = ex;
  sheetOpen.value = true;
}

async function onSave(draft: ExerciseDraft): Promise<void> {
  if (editing.value) {
    await updateExercise(editing.value.id, draft);
    toast.success('Exercício atualizado');
  } else {
    await addExercise(draft);
    toast.success('Exercício adicionado');
  }
  sheetOpen.value = false;
}

async function onDelete(ex: Exercise): Promise<void> {
  if (!confirm(`Excluir "${ex.name}"?`)) return;
  await deleteExercise(ex.id);
  toast.success('Exercício excluído');
}

function startSession(): void {
  if (exercises.value.length === 0) {
    toast.error('Adicione exercícios antes de iniciar');
    return;
  }
  router.push({ name: 'session', params: { routineId: props.id } });
}

const title = computed(() => routine.value?.name ?? 'Treino');
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-4">
    <header class="flex items-center gap-2 mb-4">
      <Button size="icon-sm" variant="ghost" @click="router.back()" aria-label="Voltar">
        <ArrowLeft class="size-4" />
      </Button>
      <h1 class="text-xl font-semibold flex-1 truncate">{{ title }}</h1>
      <Button size="icon-sm" variant="ghost" @click="openCreate" aria-label="Adicionar exercício">
        <Plus class="size-5" />
      </Button>
      <Button size="sm" @click="startSession">
        <Play class="size-4" />
        Iniciar
      </Button>
    </header>

    <div
      v-if="exercises.length === 0"
      class="rounded-lg border border-dashed border-border p-8 text-center"
    >
      <p class="text-sm text-muted-foreground mb-4">Nenhum exercício ainda.</p>
      <Button variant="secondary" @click="openCreate">
        <Plus class="size-4" />
        Adicionar exercício
      </Button>
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="(ex, idx) in exercises"
        :key="ex.id"
        class="rounded-lg border border-border bg-card p-3"
      >
        <div class="flex items-start gap-2">
          <button type="button" class="flex-1 text-left min-w-0" @click="openEdit(ex)">
            <div class="font-medium truncate">
              {{ ex.name }}
              <span v-if="ex.isCombo && ex.comboName" class="text-muted-foreground">
                + {{ ex.comboName }}
              </span>
            </div>
            <div class="text-xs text-muted-foreground mt-0.5">
              {{ ex.sets }} × {{ ex.reps }} · descanso {{ ex.restSeconds }}s
              <span v-if="ex.alternatives.length"> · {{ ex.alternatives.length }} alt.</span>
            </div>
          </button>

          <div class="flex flex-col gap-1">
            <Button size="icon-sm" variant="ghost" :disabled="idx === 0" @click="moveExercise(ex.id, 'up')" aria-label="Mover para cima">
              <ChevronUp class="size-4" />
            </Button>
            <Button size="icon-sm" variant="ghost" :disabled="idx === exercises.length - 1" @click="moveExercise(ex.id, 'down')" aria-label="Mover para baixo">
              <ChevronDown class="size-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button size="icon-sm" variant="ghost" aria-label="Mais ações">
                <MoreVertical class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="openEdit(ex)">Editar</DropdownMenuItem>
              <DropdownMenuItem class="text-destructive" @select="onDelete(ex)">
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>
    </ul>

    <ExerciseSheet v-model:open="sheetOpen" :exercise="editing" @save="onSave" />
  </div>
</template>
