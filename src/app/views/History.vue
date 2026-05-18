<script setup lang="ts">
import { computed, ref } from 'vue';
import { db, type Exercise } from '@/app/db/schema';
import { useLiveQuery } from '@/app/db/live';
import { useHistory } from '@/app/composables/useHistory';
import { Button } from '@/app/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';
import { ChevronDown, Trash2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const { sessions, deleteSession } = useHistory();

const allExercises = useLiveQuery<Exercise[]>(() => db.exercises.toArray(), []);
const allRoutines = useLiveQuery(
  () => db.routines.toArray(),
  [] as { id: string; name: string }[],
);

const exerciseById = computed<Record<string, Exercise>>(() =>
  Object.fromEntries(allExercises.value.map((e) => [e.id, e])),
);

const routineNameById = computed<Record<string, string>>(() =>
  Object.fromEntries(allRoutines.value.map((r) => [r.id, r.name])),
);

const expanded = ref<Record<string, boolean>>({});

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(start: number, end?: number): string {
  if (!end) return '—';
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}min`;
}

async function onDelete(id: string): Promise<void> {
  if (!confirm('Excluir esta sessão do histórico?')) return;
  await deleteSession(id);
  toast.success('Sessão excluída');
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6">
    <header class="mb-4">
      <h1 class="text-2xl font-semibold">Histórico</h1>
      <p class="text-sm text-muted-foreground">Treinos finalizados</p>
    </header>

    <div
      v-if="sessions.length === 0"
      class="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground"
    >
      Nenhum treino finalizado ainda.
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="s in sessions"
        :key="s.id"
        class="rounded-lg border border-border bg-card"
      >
        <Collapsible v-model:open="expanded[s.id]">
          <div class="flex items-center gap-2 p-3">
            <CollapsibleTrigger class="flex-1 text-left min-w-0 flex items-center gap-2">
              <ChevronDown
                class="size-4 text-muted-foreground transition-transform shrink-0"
                :class="expanded[s.id] ? 'rotate-180' : ''"
              />
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">
                  {{ routineNameById[s.routineId] ?? 'Treino excluído' }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ formatDate(s.startedAt) }} · {{ formatDuration(s.startedAt, s.finishedAt) }}
                  · {{ s.entries.filter((e) => e.done).length }}/{{ s.entries.length }} séries
                </div>
              </div>
            </CollapsibleTrigger>
            <Button size="icon-sm" variant="ghost" class="text-destructive" @click="onDelete(s.id)" aria-label="Excluir sessão">
              <Trash2 class="size-4" />
            </Button>
          </div>
          <CollapsibleContent>
            <div class="border-t border-border px-3 py-2 space-y-3">
              <template
                v-for="(group, exId) in s.entries.reduce<Record<string, typeof s.entries>>((acc, e) => {
                  (acc[e.exerciseId] ??= []).push(e);
                  return acc;
                }, {})"
                :key="exId"
              >
                <div>
                  <div class="text-sm font-medium">
                    {{ exerciseById[exId]?.name ?? 'Exercício excluído' }}
                    <span
                      v-if="exerciseById[exId]?.isCombo && exerciseById[exId]?.comboName"
                      class="text-muted-foreground font-normal"
                    >
                      + {{ exerciseById[exId]?.comboName }}
                    </span>
                  </div>
                  <ul class="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    <li v-for="entry in group" :key="entry.setNumber" class="flex items-center gap-2 tabular-nums">
                      <span class="w-6">{{ entry.setNumber }}.</span>
                      <span :class="entry.done ? '' : 'opacity-50'">
                        {{ entry.weightKg }}kg<template v-if="entry.weightKgSecondary !== undefined"> + {{ entry.weightKgSecondary }}kg</template>
                        <template v-if="!entry.done"> (pulada)</template>
                      </span>
                    </li>
                  </ul>
                </div>
              </template>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </li>
    </ul>
  </div>
</template>
