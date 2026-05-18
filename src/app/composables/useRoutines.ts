import { db, type Routine } from '@/app/db/schema';
import { useLiveQuery, runWithToast } from '@/app/db/live';
import type { Ref } from 'vue';

export interface UseRoutines {
  routines: Ref<Routine[]>;
  createRoutine: (name: string) => Promise<string | undefined>;
  renameRoutine: (id: string, name: string) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  duplicateRoutine: (id: string) => Promise<string | undefined>;
  moveRoutine: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export function useRoutines(): UseRoutines {
  const routines = useLiveQuery<Routine[]>(
    () => db.routines.orderBy('order').toArray(),
    [],
  );

  async function createRoutine(name: string): Promise<string | undefined> {
    return runWithToast(async () => {
      const id = crypto.randomUUID();
      const count = await db.routines.count();
      await db.routines.add({
        id,
        name: name.trim(),
        order: count,
        createdAt: Date.now(),
      });
      return id;
    }, 'Erro ao criar rotina');
  }

  async function renameRoutine(id: string, name: string): Promise<void> {
    await runWithToast(
      () => db.routines.update(id, { name: name.trim() }),
      'Erro ao renomear rotina',
    );
  }

  async function deleteRoutine(id: string): Promise<void> {
    await runWithToast(async () => {
      await db.transaction('rw', db.routines, db.exercises, async () => {
        await db.exercises.where('routineId').equals(id).delete();
        await db.routines.delete(id);
      });
    }, 'Erro ao excluir rotina');
  }

  async function duplicateRoutine(id: string): Promise<string | undefined> {
    return runWithToast(async () => {
      const newId = crypto.randomUUID();
      await db.transaction('rw', db.routines, db.exercises, async () => {
        const original = await db.routines.get(id);
        if (!original) throw new Error('Rotina não encontrada');
        const count = await db.routines.count();
        await db.routines.add({
          id: newId,
          name: `${original.name} (cópia)`,
          order: count,
          createdAt: Date.now(),
        });
        const exercises = await db.exercises.where('routineId').equals(id).toArray();
        await db.exercises.bulkAdd(
          exercises.map((ex) => ({
            ...ex,
            id: crypto.randomUUID(),
            routineId: newId,
          })),
        );
      });
      return newId;
    }, 'Erro ao duplicar rotina');
  }

  async function moveRoutine(id: string, direction: 'up' | 'down'): Promise<void> {
    await runWithToast(async () => {
      await db.transaction('rw', db.routines, async () => {
        const all = await db.routines.orderBy('order').toArray();
        const idx = all.findIndex((r) => r.id === id);
        if (idx === -1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= all.length) return;
        const a = all[idx];
        const b = all[swapIdx];
        await db.routines.update(a.id, { order: b.order });
        await db.routines.update(b.id, { order: a.order });
      });
    }, 'Erro ao reordenar rotina');
  }

  return {
    routines,
    createRoutine,
    renameRoutine,
    deleteRoutine,
    duplicateRoutine,
    moveRoutine,
  };
}
