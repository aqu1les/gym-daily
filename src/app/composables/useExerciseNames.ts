import { computed, type ComputedRef } from 'vue';
import { db } from '@/app/db/schema';
import { useLiveQuery } from '@/app/db/live';

/** Distinct exercise names used across all routines, plus all alternatives. */
export function useExerciseNames(): ComputedRef<string[]> {
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  return computed(() => {
    const set = new Set<string>();
    for (const ex of exercises.value) {
      if (ex.name) set.add(ex.name);
      for (const alt of ex.alternatives) {
        if (alt) set.add(alt);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  });
}
