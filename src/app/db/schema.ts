import Dexie, { type EntityTable } from 'dexie';

export interface Routine {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}

export interface Exercise {
  id: string;
  routineId: string;
  order: number;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  isCombo: boolean;
  comboName?: string;
  alternatives: string[];
}

export interface SetEntry {
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  weightKgSecondary?: number;
  reps?: number;
  done: boolean;
  doneAt?: number;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  startedAt: number;
  finishedAt?: number;
  entries: SetEntry[];
}

export class GymDailyDB extends Dexie {
  routines!: EntityTable<Routine, 'id'>;
  exercises!: EntityTable<Exercise, 'id'>;
  sessions!: EntityTable<WorkoutSession, 'id'>;

  constructor() {
    super('gymdaily');
    this.version(1).stores({
      routines: 'id, order, createdAt',
      exercises: 'id, routineId, order',
      sessions: 'id, routineId, startedAt, [routineId+startedAt]',
    });
  }
}

export const db = new GymDailyDB();
