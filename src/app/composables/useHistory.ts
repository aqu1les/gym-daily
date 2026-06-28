import { db, type WorkoutSession } from '@/app/db/schema';
import { useLiveQuery, runWithToast } from '@/app/db/live';
import { buildLastByKey, keyOf, type LastWeights } from '@/app/lib/markdown';
import type { Ref } from 'vue';

export interface UseHistory {
  sessions: Ref<WorkoutSession[]>;
  deleteSession: (id: string) => Promise<void>;
  lastSetFor: (exerciseId: string, setNumber: number) => Promise<LastWeights | undefined>;
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
  ): Promise<LastWeights | undefined> {
    const recent = await db.sessions
      .orderBy('startedAt')
      .reverse()
      .filter((s) => s.finishedAt !== undefined)
      .limit(20)
      .toArray();
    return buildLastByKey(recent).get(keyOf(exerciseId, setNumber));
  }

  return { sessions, deleteSession, lastSetFor };
}
