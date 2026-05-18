<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useWakeLock } from '@vueuse/core';
import { useWebHaptics } from 'web-haptics/vue';
import { ChevronLeft, ChevronRight, Check, X, Repeat } from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import RestTimer from '@/app/components/RestTimer.vue';
import AlternativesSheet from '@/app/components/AlternativesSheet.vue';
import { useActiveSession } from '@/app/stores/activeSession';
import { useRestTimer } from '@/app/composables/useRestTimer';
import { toast } from 'vue-sonner';

const props = defineProps<{ routineId: string }>();
const router = useRouter();

const session = useActiveSession();
const {
  currentExercise,
  currentDisplayName,
  currentEntries,
  currentIndex,
  exercises,
  doneSets,
  totalSets,
} = storeToRefs(session);

const timer = useRestTimer();
const { trigger: triggerHaptic } = useWebHaptics();
const { isSupported: wakeLockSupported, request: requestWakeLock, release: releaseWakeLock } =
  useWakeLock();

const altSheetOpen = ref(false);

onMounted(async () => {
  const needsStart =
    !session.isActive || session.routineId !== props.routineId;
  if (needsStart) {
    if (session.isActive) session.reset();
    const ok = await session.start(props.routineId);
    if (!ok) {
      router.replace({ name: 'home' });
      return;
    }
  } else {
    await session.refreshExercises();
  }
  if (wakeLockSupported.value) {
    try {
      await requestWakeLock('screen');
    } catch (err) {
      console.warn('wake lock failed', err);
    }
  }
});

onBeforeUnmount(() => {
  void releaseWakeLock();
  timer.reset();
});

const progressPct = computed(() => {
  if (totalSets.value === 0) return 0;
  return Math.round((doneSets.value / totalSets.value) * 100);
});

const exerciseNumber = computed(() => currentIndex.value + 1);
const exerciseCount = computed(() => exercises.value.length);
const isLast = computed(() => currentIndex.value === exerciseCount.value - 1);
const isFirst = computed(() => currentIndex.value === 0);

const isSubstituted = computed(() => {
  const ex = currentExercise.value;
  if (!ex) return false;
  return ex.id in session.substitutions;
});

function onToggle(setNumber: number): void {
  const ex = currentExercise.value;
  if (!ex) return;
  const nowDone = session.toggleDone(ex.id, setNumber);
  if (nowDone) {
    triggerHaptic('nudge');
    if (ex.restSeconds > 0) timer.start(ex.restSeconds);
  }
}

function onWeightInput(setNumber: number, value: string): void {
  const ex = currentExercise.value;
  if (!ex) return;
  const num = Number(value);
  session.setWeight(ex.id, setNumber, Number.isFinite(num) ? num : 0);
}

function onWeightSecondaryInput(setNumber: number, value: string): void {
  const ex = currentExercise.value;
  if (!ex) return;
  const num = Number(value);
  session.setWeightSecondary(ex.id, setNumber, Number.isFinite(num) ? num : 0);
}

function pickAlternative(name: string): void {
  const ex = currentExercise.value;
  if (!ex) return;
  session.substitute(ex.id, name);
  toast.success(`Trocado para "${name}" só neste treino`);
}

function resetSubstitution(): void {
  const ex = currentExercise.value;
  if (!ex) return;
  session.clearSubstitution(ex.id);
  toast.success('Voltou ao exercício original');
}

async function onFinish(): Promise<void> {
  if (doneSets.value === 0) {
    if (!confirm('Nenhuma série marcada. Finalizar mesmo assim?')) return;
  }
  const ok = await session.finish();
  if (ok) {
    triggerHaptic('success');
    toast.success('Treino salvo');
    router.replace({ name: 'home' });
  }
}

function onAbort(): void {
  if (!confirm('Descartar este treino? Nada será salvo.')) return;
  triggerHaptic('error');
  session.reset();
  router.replace({ name: 'home' });
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-3 pb-[calc(7rem+env(safe-area-inset-bottom))] flex flex-col min-h-full">
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
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold leading-tight">
            {{ currentDisplayName }}
            <span v-if="currentExercise.isCombo && currentExercise.comboName" class="text-muted-foreground font-normal">
              + {{ currentExercise.comboName }}
            </span>
          </h2>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ currentExercise.sets }} × {{ currentExercise.reps }} · descanso {{ currentExercise.restSeconds }}s
          </p>
          <p v-if="isSubstituted" class="text-xs text-primary mt-1">
            Substituindo: {{ currentExercise.name }}
          </p>
        </div>
        <Button
          v-if="currentExercise.alternatives.length > 0 || isSubstituted"
          size="sm"
          variant="ghost"
          @click="altSheetOpen = true"
        >
          <Repeat class="size-4" />
          Trocar
        </Button>
      </div>
    </section>

    <section v-if="currentExercise" class="space-y-2 flex-1">
      <div
        class="grid gap-2 items-center text-xs text-muted-foreground px-1"
        :class="currentExercise.isCombo ? 'grid-cols-[2rem_1fr_1fr_2.5rem]' : 'grid-cols-[2rem_1fr_2.5rem]'"
      >
        <span>#</span>
        <span>{{ currentExercise.isCombo ? 'Peso A (kg)' : 'Peso (kg)' }}</span>
        <span v-if="currentExercise.isCombo">Peso B (kg)</span>
        <span class="text-center">Feito</span>
      </div>
      <div
        v-for="entry in currentEntries"
        :key="entry.setNumber"
        class="grid gap-2 items-center"
        :class="currentExercise.isCombo ? 'grid-cols-[2rem_1fr_1fr_2.5rem]' : 'grid-cols-[2rem_1fr_2.5rem]'"
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
        <Input
          v-if="currentExercise.isCombo"
          type="number"
          inputmode="decimal"
          step="0.5"
          min="0"
          :model-value="entry.weightKgSecondary ?? 0"
          :disabled="entry.done"
          @update:model-value="(v: string | number) => onWeightSecondaryInput(entry.setNumber, String(v))"
        />
        <button
          type="button"
          class="size-10 justify-self-center rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
          :class="entry.done
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'bg-transparent border-border text-transparent hover:border-primary/60'"
          :aria-pressed="entry.done"
          :aria-label="`Marcar série ${entry.setNumber} como ${entry.done ? 'não feita' : 'feita'}`"
          @click="onToggle(entry.setNumber)"
        >
          <Check class="size-5" :stroke-width="3" />
        </button>
      </div>
    </section>

    <div class="fixed bottom-0 inset-x-0 z-30 pb-[env(safe-area-inset-bottom)]">
      <RestTimer
        :remaining="timer.remaining"
        :total="timer.total"
        :is-running="timer.isRunning"
        :progress="timer.progress"
        @add="timer.add"
        @skip="timer.skip"
      />
      <div class="border-t border-border bg-background/95 backdrop-blur">
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
      </div>
    </div>

    <AlternativesSheet
      v-if="currentExercise"
      v-model:open="altSheetOpen"
      :original-name="currentExercise.name"
      :active-name="currentDisplayName"
      :alternatives="currentExercise.alternatives"
      @pick="pickAlternative"
      @reset="resetSubstitution"
    />
  </div>
</template>
