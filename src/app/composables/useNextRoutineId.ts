import { computed, type ComputedRef, type Ref } from 'vue';
import { db, type Routine, type WorkoutSession } from '@/app/db/schema';
import { useLiveQuery } from '@/app/db/live';

/**
 * Returns the routineId that should be suggested as the next workout.
 *
 * Heuristic: take the most recently finished session, find its routine
 * in the current ordered list, and return the next one (wrapping at the
 * end). Falls back to the first routine when there is no history yet, or
 * when the last session's routine was deleted.
 */
export function useNextRoutineId(routines: Ref<Routine[]>): ComputedRef<string | null> {
  const lastFinished = useLiveQuery<WorkoutSession | undefined>(
    async () => {
      const recent = await db.sessions
        .orderBy('startedAt')
        .reverse()
        .filter((s) => s.finishedAt !== undefined)
        .limit(1)
        .toArray();
      return recent[0];
    },
    undefined,
  );

  return computed(() => {
    if (routines.value.length === 0) return null;
    const last = lastFinished.value;
    if (!last) return routines.value[0].id;
    const lastIdx = routines.value.findIndex((r) => r.id === last.routineId);
    if (lastIdx === -1) return routines.value[0].id;
    const nextIdx = (lastIdx + 1) % routines.value.length;
    return routines.value[nextIdx].id;
  });
}
