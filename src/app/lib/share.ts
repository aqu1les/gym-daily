import { db } from '@/app/db/schema';

interface RoutineExportV1 {
  v: 1;
  routine: { name: string };
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    isCombo: boolean;
    comboName?: string;
    alternatives: string[];
  }>;
}

const PREFIX = 'gd1:';

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function exportRoutineCode(routineId: string): Promise<string> {
  const routine = await db.routines.get(routineId);
  if (!routine) throw new Error('Rotina não encontrada');
  const exercises = await db.exercises
    .where('routineId')
    .equals(routineId)
    .sortBy('order');
  const data: RoutineExportV1 = {
    v: 1,
    routine: { name: routine.name },
    exercises: exercises.map((e) => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.restSeconds,
      isCombo: e.isCombo,
      comboName: e.comboName,
      alternatives: [...e.alternatives],
    })),
  };
  return PREFIX + utf8ToBase64(JSON.stringify(data));
}

export interface ImportPreview {
  name: string;
  exerciseCount: number;
  payload: RoutineExportV1;
}

export function decodeRoutineCode(code: string): ImportPreview {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX)) {
    throw new Error('Código inválido');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(base64ToUtf8(trimmed.slice(PREFIX.length)));
  } catch {
    throw new Error('Código corrompido');
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { v?: unknown }).v !== 1
  ) {
    throw new Error('Versão não suportada');
  }
  const data = parsed as RoutineExportV1;
  return {
    name: data.routine.name,
    exerciseCount: data.exercises.length,
    payload: data,
  };
}

export async function importRoutineFromPreview(
  preview: ImportPreview,
): Promise<string> {
  const routineId = crypto.randomUUID();
  await db.transaction('rw', db.routines, db.exercises, async () => {
    const count = await db.routines.count();
    await db.routines.add({
      id: routineId,
      name: preview.payload.routine.name,
      order: count,
      createdAt: Date.now(),
    });
    await db.exercises.bulkAdd(
      preview.payload.exercises.map((e, i) => ({
        id: crypto.randomUUID(),
        routineId,
        order: i,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.restSeconds,
        isCombo: e.isCombo,
        comboName: e.comboName,
        alternatives: [...e.alternatives],
      })),
    );
  });
  return routineId;
}
