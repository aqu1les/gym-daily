import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  db,
  type Exercise,
  type SetEntry,
  type WorkoutSession,
} from '@/app/db/schema';
import { useHistory } from '@/app/composables/useHistory';
import { toast } from 'vue-sonner';

export interface ActiveExerciseView {
  exercise: Exercise;
  entries: SetEntry[];
}

export const useActiveSession = defineStore(
  'active-session',
  () => {
    const sessionId = ref<string | null>(null);
    const routineId = ref<string | null>(null);
    const startedAt = ref<number | null>(null);
    const exercises = ref<Exercise[]>([]);
    const entries = ref<SetEntry[]>([]);
    const currentIndex = ref(0);
    /** Display-name substitutions for this session only (originalId -> alternative name). */
    const substitutions = ref<Record<string, string>>({});

    const isActive = computed(() => sessionId.value !== null);

    const currentExercise = computed<Exercise | null>(
      () => exercises.value[currentIndex.value] ?? null,
    );

    const currentDisplayName = computed<string>(() => {
      const ex = currentExercise.value;
      if (!ex) return '';
      return substitutions.value[ex.id] ?? ex.name;
    });

    const currentEntries = computed<SetEntry[]>(() => {
      const ex = currentExercise.value;
      if (!ex) return [];
      return entries.value
        .filter((e) => e.exerciseId === ex.id)
        .sort((a, b) => a.setNumber - b.setNumber);
    });

    const totalSets = computed(() => entries.value.length);
    const doneSets = computed(() => entries.value.filter((e) => e.done).length);

    async function start(targetRoutineId: string): Promise<boolean> {
      try {
        const list = await db.exercises
          .where('routineId')
          .equals(targetRoutineId)
          .sortBy('order');
        if (list.length === 0) {
          toast.error('Rotina sem exercícios');
          return false;
        }

        const { lastSetFor } = useHistory();
        const newEntries: SetEntry[] = [];
        for (const ex of list) {
          for (let n = 1; n <= ex.sets; n++) {
            const last = await lastSetFor(ex.id, n);
            newEntries.push({
              exerciseId: ex.id,
              setNumber: n,
              weightKg: last?.weightKg ?? 0,
              weightKgSecondary: last?.weightKgSecondary,
              done: false,
            });
          }
        }

        sessionId.value = crypto.randomUUID();
        routineId.value = targetRoutineId;
        startedAt.value = Date.now();
        exercises.value = list;
        entries.value = newEntries;
        currentIndex.value = 0;
        substitutions.value = {};
        return true;
      } catch (err) {
        console.error(err);
        toast.error('Erro ao iniciar treino');
        return false;
      }
    }

    function setWeight(exerciseId: string, setNumber: number, weightKg: number): void {
      const entry = entries.value.find(
        (e) => e.exerciseId === exerciseId && e.setNumber === setNumber,
      );
      if (entry) entry.weightKg = weightKg;
    }

    function setWeightSecondary(
      exerciseId: string,
      setNumber: number,
      weightKg: number,
    ): void {
      const entry = entries.value.find(
        (e) => e.exerciseId === exerciseId && e.setNumber === setNumber,
      );
      if (entry) entry.weightKgSecondary = weightKg;
    }

    function toggleDone(exerciseId: string, setNumber: number): boolean {
      const entry = entries.value.find(
        (e) => e.exerciseId === exerciseId && e.setNumber === setNumber,
      );
      if (!entry) return false;
      entry.done = !entry.done;
      entry.doneAt = entry.done ? Date.now() : undefined;
      return entry.done;
    }

    function next(): void {
      if (currentIndex.value < exercises.value.length - 1) {
        currentIndex.value++;
      }
    }

    function prev(): void {
      if (currentIndex.value > 0) currentIndex.value--;
    }

    function goTo(index: number): void {
      if (index >= 0 && index < exercises.value.length) {
        currentIndex.value = index;
      }
    }

    function substitute(originalId: string, alternativeName: string): void {
      substitutions.value[originalId] = alternativeName;
    }

    function clearSubstitution(originalId: string): void {
      delete substitutions.value[originalId];
    }

    function reset(): void {
      sessionId.value = null;
      routineId.value = null;
      startedAt.value = null;
      exercises.value = [];
      entries.value = [];
      currentIndex.value = 0;
      substitutions.value = {};
    }

    async function finish(): Promise<boolean> {
      if (!sessionId.value || !routineId.value || !startedAt.value) {
        return false;
      }
      const session: WorkoutSession = {
        id: sessionId.value,
        routineId: routineId.value,
        startedAt: startedAt.value,
        finishedAt: Date.now(),
        entries: entries.value.map((e) => ({ ...e })),
      };
      try {
        await db.sessions.add(session);
        reset();
        return true;
      } catch (err) {
        console.error(err);
        toast.error('Erro ao salvar treino');
        return false;
      }
    }

    function hasStaleSession(maxAgeMs: number = 12 * 60 * 60 * 1000): boolean {
      if (!startedAt.value) return false;
      return Date.now() - startedAt.value > maxAgeMs;
    }

    return {
      sessionId,
      routineId,
      startedAt,
      exercises,
      entries,
      currentIndex,
      substitutions,
      isActive,
      currentExercise,
      currentDisplayName,
      currentEntries,
      totalSets,
      doneSets,
      start,
      setWeight,
      setWeightSecondary,
      toggleDone,
      next,
      prev,
      goTo,
      substitute,
      clearSubstitution,
      reset,
      finish,
      hasStaleSession,
    };
  },
  {
    persist: {
      key: 'gymdaily-active-session',
      pick: [
        'sessionId',
        'routineId',
        'startedAt',
        'exercises',
        'entries',
        'currentIndex',
        'substitutions',
      ],
    },
  },
);
