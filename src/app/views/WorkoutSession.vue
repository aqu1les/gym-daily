<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useActiveSession } from '@/app/stores/activeSession';
import { toast } from 'vue-sonner';

const props = defineProps<{ routineId: string }>();
const router = useRouter();

const session = useActiveSession();
const { currentExercise, currentEntries, currentIndex, orderedExercises, doneSets, totalSets } =
  storeToRefs(session);

onMounted(async () => {
  const needsStart =
    !session.isActive || session.routineId !== props.routineId;
  if (needsStart) {
    if (session.isActive) session.reset();
    const ok = await session.start(props.routineId);
    if (!ok) {
      router.replace({ name: 'home' });
    }
  }
});

const progressPct = computed(() => {
  if (totalSets.value === 0) return 0;
  return Math.round((doneSets.value / totalSets.value) * 100);
});

const exerciseNumber = computed(() => currentIndex.value + 1);
const exerciseCount = computed(() => orderedExercises.value.length);
const isLast = computed(() => currentIndex.value === exerciseCount.value - 1);
const isFirst = computed(() => currentIndex.value === 0);

function onToggle(setNumber: number): void {
  const ex = currentExercise.value;
  if (!ex) return;
  session.toggleDone(ex.id, setNumber);
}

function onWeightInput(setNumber: number, value: string): void {
  const ex = currentExercise.value;
  if (!ex) return;
  const num = Number(value);
  session.setWeight(ex.id, setNumber, Number.isFinite(num) ? num : 0);
}

async function onFinish(): Promise<void> {
  if (doneSets.value === 0) {
    if (!confirm('Nenhuma série marcada. Finalizar mesmo assim?')) return;
  }
  const ok = await session.finish();
  if (ok) {
    toast.success('Treino salvo');
    router.replace({ name: 'home' });
  }
}

function onAbort(): void {
  if (!confirm('Descartar este treino? Nada será salvo.')) return;
  session.reset();
  router.replace({ name: 'home' });
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-3 pb-24 flex flex-col min-h-dvh">
    <header class="flex items-center gap-2 mb-3">
      <Button size="icon-sm" variant="ghost" @click="onAbort" aria-label="Descartar">
        <X class="size-4" />
      </Button>
      <div class="flex-1 min-w-0">
        <div class="text-xs text-muted-foreground">
          Exercício {{ exerciseNumber }} de {{ exerciseCount }}
        </div>
        <div class="h-1.5 mt-1 rounded-full bg-secondary overflow-hidden">
          <div class="h-full bg-primary transition-all" :style="{ width: `${progressPct}%` }" />
        </div>
      </div>
      <Button size="sm" variant="secondary" @click="onFinish">
        <Check class="size-4" />
        Finalizar
      </Button>
    </header>

    <section v-if="currentExercise" class="rounded-lg border border-border bg-card p-4 mb-4">
      <h2 class="text-lg font-semibold leading-tight">{{ currentExercise.name }}</h2>
      <p class="text-sm text-muted-foreground mt-0.5">
        {{ currentExercise.sets }} × {{ currentExercise.reps }} · descanso {{ currentExercise.restSeconds }}s
      </p>
    </section>

    <section v-if="currentExercise" class="space-y-2 flex-1">
      <div class="grid grid-cols-[2rem_1fr_3rem] gap-2 items-center text-xs text-muted-foreground px-1">
        <span>#</span>
        <span>Peso (kg)</span>
        <span class="text-center">Feito</span>
      </div>
      <div
        v-for="entry in currentEntries"
        :key="entry.setNumber"
        class="grid grid-cols-[2rem_1fr_3rem] gap-2 items-center"
      >
        <span class="text-sm tabular-nums text-muted-foreground">{{ entry.setNumber }}</span>
        <Input
          type="number"
          inputmode="decimal"
          step="0.5"
          min="0"
          :model-value="entry.weightKg"
          :disabled="entry.done"
          @update:model-value="(v: string | number) => onWeightInput(entry.setNumber, String(v))"
        />
        <button
          type="button"
          class="h-9 w-12 rounded-md border border-border flex items-center justify-center transition-colors"
          :class="entry.done ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'"
          :aria-pressed="entry.done"
          :aria-label="`Marcar série ${entry.setNumber} como ${entry.done ? 'não feita' : 'feita'}`"
          @click="onToggle(entry.setNumber)"
        >
          <Check v-if="entry.done" class="size-4" />
        </button>
      </div>
    </section>

    <footer class="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur">
      <div class="max-w-md mx-auto px-4 py-2 grid grid-cols-2 gap-2">
        <Button variant="secondary" :disabled="isFirst" @click="session.prev()">
          <ChevronLeft class="size-4" />
          Anterior
        </Button>
        <Button :disabled="isLast" @click="session.next()">
          Próximo
          <ChevronRight class="size-4" />
        </Button>
      </div>
    </footer>
  </div>
</template>
