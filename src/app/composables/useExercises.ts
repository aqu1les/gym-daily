import { db, type Exercise } from '@/app/db/schema';
import { useLiveQuery, runWithToast } from '@/app/db/live';
import type { Ref } from 'vue';

export type ExerciseDraft = Omit<Exercise, 'id' | 'routineId' | 'order'>;

export interface UseExercises {
  exercises: Ref<Exercise[]>;
  addExercise: (draft: ExerciseDraft) => Promise<string | undefined>;
  updateExercise: (id: string, patch: Partial<ExerciseDraft>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  moveExercise: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export function useExercises(routineId: string): UseExercises {
  const exercises = useLiveQuery<Exercise[]>(
    () =>
      db.exercises
        .where('routineId')
        .equals(routineId)
        .sortBy('order'),
    [],
  );

  async function addExercise(draft: ExerciseDraft): Promise<string | undefined> {
    return runWithToast(async () => {
      const id = crypto.randomUUID();
      const count = await db.exercises.where('routineId').equals(routineId).count();
      await db.exercises.add({
        id,
        routineId,
        order: count,
        ...draft,
      });
      return id;
    }, 'Erro ao adicionar exercício');
  }

  async function updateExercise(id: string, patch: Partial<ExerciseDraft>): Promise<void> {
    await runWithToast(
      () => db.exercises.update(id, patch),
      'Erro ao atualizar exercício',
    );
  }

  async function deleteExercise(id: string): Promise<void> {
    await runWithToast(() => db.exercises.delete(id), 'Erro ao excluir exercício');
  }

  async function moveExercise(id: string, direction: 'up' | 'down'): Promise<void> {
    await runWithToast(async () => {
      await db.transaction('rw', db.exercises, async () => {
        const all = await db.exercises.where('routineId').equals(routineId).sortBy('order');
        const idx = all.findIndex((e) => e.id === id);
        if (idx === -1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= all.length) return;
        const a = all[idx];
        const b = all[swapIdx];
        await db.exercises.update(a.id, { order: b.order });
        await db.exercises.update(b.id, { order: a.order });
      });
    }, 'Erro ao reordenar exercício');
  }

  return {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    moveExercise,
  };
}
