import { db } from '@/app/db/schema';
import type { Exercise, SetEntry, WorkoutSession } from '@/app/db/schema';

/** Último peso registrado para uma série (peso B opcional para combos). */
export interface LastWeights {
  weightKg: number;
  weightKgSecondary?: number;
}

/** Mapa (exerciseId#setNumber) -> último peso registrado. */
export type LastByKey = Map<string, LastWeights>;

export function keyOf(exerciseId: string, setNumber: number): string {
  return `${exerciseId}#${setNumber}`;
}

/**
 * Varre as sessões (que devem vir da mais recente para a mais antiga) e
 * retorna o último peso registrado por série (exerciseId#setNumber),
 * considerando apenas séries marcadas como feitas. Fonte única usada tanto
 * pelo export quanto pelo pré-preenchimento de pesos (useHistory.lastSetFor).
 */
export function buildLastByKey(sessions: WorkoutSession[]): LastByKey {
  const map: LastByKey = new Map();
  for (const session of sessions) {
    for (const e of session.entries) {
      if (!e.done) continue;
      const k = keyOf(e.exerciseId, e.setNumber);
      if (!map.has(k)) {
        map.set(k, { weightKg: e.weightKg, weightKgSecondary: e.weightKgSecondary });
      }
    }
  }
  return map;
}

/** Peso em pt-BR: vírgula decimal, inteiros sem casas, ausente → "–". */
export function fmtKg(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '–';
  return String(n).replace('.', ',');
}

function comboTitle(ex: Exercise, displayName: string): string {
  if (ex.isCombo && ex.comboName) return `${displayName} + ${ex.comboName}`;
  return displayName;
}

function setsReps(ex: Exercise, sep = ' · '): string {
  return `${ex.sets}×${ex.reps}${sep}descanso ${ex.restSeconds}s`;
}

/** Monta as linhas de uma tabela markdown a partir de cabeçalhos e linhas. */
function mdTable(headers: string[], rows: string[][]): string[] {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((cells) => `| ${cells.join(' | ')} |`),
  ];
}

const doneMark = (done: boolean): string => (done ? '✅' : '⬜');

/** Estilo 1 — Lista. Plano da rotina + último desempenho. */
export function formatRoutineMarkdown(
  routineName: string,
  exercises: Exercise[],
  lastByKey: LastByKey,
): string {
  const lines: string[] = [`# ${routineName}`, ''];

  exercises.forEach((ex, idx) => {
    const n = idx + 1;
    const isCombo = !!(ex.isCombo && ex.comboName);
    if (isCombo) {
      lines.push(`**${n}. ${comboTitle(ex, ex.name)}** (combo)`);
      lines.push(`- ${setsReps(ex, ', ')}`);
    } else {
      lines.push(`**${n}. ${ex.name}** — ${setsReps(ex, ', ')}`);
    }

    const primary: string[] = [];
    const secondary: string[] = [];
    let hasPrimary = false;
    let hasSecondary = false;
    for (let s = 1; s <= ex.sets; s++) {
      const last = lastByKey.get(keyOf(ex.id, s));
      if (last) {
        hasPrimary = true;
        if (last.weightKgSecondary !== undefined) hasSecondary = true;
      }
      primary.push(fmtKg(last?.weightKg));
      secondary.push(fmtKg(last?.weightKgSecondary));
    }

    if (isCombo) {
      if (hasPrimary) lines.push(`- Último peso A: ${primary.join(' / ')} kg`);
      if (hasSecondary) lines.push(`- Último peso B: ${secondary.join(' / ')} kg`);
    } else if (hasPrimary) {
      lines.push(`- Último: ${primary.join(' / ')} kg`);
    }

    if (ex.alternatives.length > 0) {
      lines.push(`- Alternativas: ${ex.alternatives.join(', ')}`);
    }

    lines.push('');
  });

  return lines.join('\n').trimEnd() + '\n';
}

/** Estilo 3 — Híbrido. Bloco `##` de um exercício com tabela de séries. */
export function formatExerciseMarkdown(
  exercise: Exercise,
  entries: SetEntry[],
  displayName: string,
  position: number = 1,
): string {
  const lines: string[] = [];
  const prefix = `${position}. `;
  lines.push(`## ${prefix}${comboTitle(exercise, displayName)} — ${setsReps(exercise)}`);

  if (exercise.alternatives.length > 0) {
    lines.push(`Alternativas: ${exercise.alternatives.join(', ')}`);
  }
  if (displayName !== exercise.name) {
    lines.push(`Original: ${exercise.name}`);
  }
  lines.push('');

  const sorted = [...entries].sort((a, b) => a.setNumber - b.setNumber);
  const headers = exercise.isCombo
    ? ['Série', 'Peso A', 'Peso B', 'Feito']
    : ['Série', 'Peso', 'Feito'];
  const rows = sorted.map((e) => {
    const cells = [String(e.setNumber), `${fmtKg(e.weightKg)} kg`];
    if (exercise.isCombo) cells.push(`${fmtKg(e.weightKgSecondary)} kg`);
    cells.push(doneMark(e.done));
    return cells;
  });
  lines.push(...mdTable(headers, rows));

  return lines.join('\n');
}

/** Estilo 3 — Híbrido. Sessão inteira em andamento. */
export function formatSessionMarkdown(
  routineName: string,
  exercises: Exercise[],
  entries: SetEntry[],
  substitutions: Record<string, string>,
): string {
  const blocks: string[] = [`# ${routineName} (em andamento)`, ''];
  exercises.forEach((ex, idx) => {
    const displayName = substitutions[ex.id] ?? ex.name;
    const exEntries = entries.filter((e) => e.exerciseId === ex.id);
    blocks.push(formatExerciseMarkdown(ex, exEntries, displayName, idx + 1));
    blocks.push('');
  });
  return blocks.join('\n').trimEnd() + '\n';
}

/**
 * Carrega a rotina, seus exercícios e o último peso registrado por série
 * (varrendo as ~20 sessões finalizadas mais recentes, igual ao useHistory),
 * e formata como markdown (Estilo 1).
 */
export async function buildRoutineMarkdown(routineId: string): Promise<string> {
  const routine = await db.routines.get(routineId);
  if (!routine) throw new Error('Treino não encontrado');

  const exercises = await db.exercises
    .where('routineId')
    .equals(routineId)
    .sortBy('order');

  const recent = await db.sessions
    .orderBy('startedAt')
    .reverse()
    .filter((s) => s.finishedAt !== undefined)
    .limit(20)
    .toArray();

  return formatRoutineMarkdown(routine.name, exercises, buildLastByKey(recent));
}
