import { db, type SetEntry, type WorkoutSession } from '@/app/db/schema';
import { useLiveQuery, runWithToast } from '@/app/db/live';
import type { Ref } from 'vue';

export interface LastSetWeights {
  weightKg: number;
  weightKgSecondary?: number;
}

export interface UseHistory {
  sessions: Ref<WorkoutSession[]>;
  deleteSession: (id: string) => Promise<void>;
  lastSetFor: (exerciseId: string, setNumber: number) => Promise<LastSetWeights | undefined>;
}

export function useHistory(): UseHistory {
  const sessions = useLiveQuery<WorkoutSession[]>(
    () => db.sessions.orderBy('startedAt').reverse().toArray(),
    [],
  );

  async function deleteSession(id: string): Promise<void> {
    await runWithToast(() => db.sessions.delete(id), 'Erro ao excluir sessão');
  }

  async function lastSetFor(
    exerciseId: string,
    setNumber: number,
  ): Promise<LastSetWeights | undefined> {
    const recent = await db.sessions
      .orderBy('startedAt')
      .reverse()
      .filter((s) => s.finishedAt !== undefined)
      .limit(20)
      .toArray();
    for (const session of recent) {
      const match = session.entries.find(
        (e: SetEntry) => e.exerciseId === exerciseId && e.setNumber === setNumber && e.done,
      );
      if (match) {
        return {
          weightKg: match.weightKg,
          weightKgSecondary: match.weightKgSecondary,
        };
      }
    }
    return undefined;
  }

  return { sessions, deleteSession, lastSetFor };
}
