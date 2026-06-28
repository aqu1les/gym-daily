import { test, expect } from 'bun:test';
import type { Exercise, SetEntry } from '@/app/db/schema';
import {
  fmtKg,
  keyOf,
  buildLastByKey,
  formatRoutineMarkdown,
  formatExerciseMarkdown,
  formatSessionMarkdown,
  type LastByKey,
} from '@/app/lib/markdown';
import type { WorkoutSession } from '@/app/db/schema';

function ex(partial: Partial<Exercise>): Exercise {
  return {
    id: 'e1',
    routineId: 'r1',
    order: 0,
    name: 'Supino reto',
    sets: 3,
    reps: '8-10',
    restSeconds: 90,
    isCombo: false,
    alternatives: [],
    ...partial,
  };
}

function entry(partial: Partial<SetEntry>): SetEntry {
  return {
    exerciseId: 'e1',
    setNumber: 1,
    weightKg: 0,
    done: false,
    ...partial,
  };
}

test('fmtKg: comma decimal, integers plain, real zero shown, only missing is dash', () => {
  expect(fmtKg(37.5)).toBe('37,5');
  expect(fmtKg(40)).toBe('40');
  expect(fmtKg(0)).toBe('0');
  expect(fmtKg(undefined)).toBe('–');
});

test('buildLastByKey: keeps most recent done set, ignores undone', () => {
  const sessions: WorkoutSession[] = [
    {
      id: 's2',
      routineId: 'r1',
      startedAt: 200,
      finishedAt: 250,
      entries: [
        { exerciseId: 'e1', setNumber: 1, weightKg: 45, done: true },
        { exerciseId: 'e1', setNumber: 2, weightKg: 99, done: false },
      ],
    },
    {
      id: 's1',
      routineId: 'r1',
      startedAt: 100,
      finishedAt: 150,
      entries: [
        { exerciseId: 'e1', setNumber: 1, weightKg: 40, done: true },
        { exerciseId: 'e1', setNumber: 2, weightKg: 40, done: true },
      ],
    },
  ];
  const map = buildLastByKey(sessions);
  // set 1: mais recente (s2) vence
  expect(map.get(keyOf('e1', 1))?.weightKg).toBe(45);
  // set 2: s2 não foi feito → cai para s1
  expect(map.get(keyOf('e1', 2))?.weightKg).toBe(40);
});

test('formatRoutineMarkdown: simple exercise with history and alternatives', () => {
  const exercises = [
    ex({ id: 'e1', sets: 3, alternatives: ['Supino halteres', 'Crucifixo'] }),
  ];
  const last: LastByKey = new Map([
    [keyOf('e1', 1), { weightKg: 40 }],
    [keyOf('e1', 2), { weightKg: 40 }],
    [keyOf('e1', 3), { weightKg: 37.5 }],
  ]);
  const md = formatRoutineMarkdown('Treino A', exercises, last);
  expect(md).toContain('# Treino A');
  expect(md).toContain('**1. Supino reto** — 3×8-10, descanso 90s');
  expect(md).toContain('- Último: 40 / 40 / 37,5 kg');
  expect(md).toContain('- Alternativas: Supino halteres, Crucifixo');
});

test('formatRoutineMarkdown: combo shows peso A and peso B', () => {
  const exercises = [
    ex({
      id: 'e2',
      name: 'Supino inclinado',
      isCombo: true,
      comboName: 'Crucifixo',
      sets: 3,
      reps: '12',
      restSeconds: 60,
    }),
  ];
  const last: LastByKey = new Map([
    [keyOf('e2', 1), { weightKg: 30, weightKgSecondary: 12 }],
    [keyOf('e2', 2), { weightKg: 30, weightKgSecondary: 12 }],
    [keyOf('e2', 3), { weightKg: 30, weightKgSecondary: 10 }],
  ]);
  const md = formatRoutineMarkdown('Treino A', exercises, last);
  expect(md).toContain('**1. Supino inclinado + Crucifixo** (combo)');
  expect(md).toContain('- 3×12, descanso 60s');
  expect(md).toContain('- Último peso A: 30 / 30 / 30 kg');
  expect(md).toContain('- Último peso B: 12 / 12 / 10 kg');
});

test('formatRoutineMarkdown: no history omits Último line', () => {
  const exercises = [ex({ id: 'e1', sets: 2, alternatives: [] })];
  const md = formatRoutineMarkdown('Treino A', exercises, new Map());
  expect(md).not.toContain('Último');
  expect(md).not.toContain('Alternativas');
});

test('formatRoutineMarkdown: partial history fills missing sets with dash', () => {
  const exercises = [ex({ id: 'e1', sets: 3 })];
  const last: LastByKey = new Map([[keyOf('e1', 1), { weightKg: 40 }]]);
  const md = formatRoutineMarkdown('Treino A', exercises, last);
  expect(md).toContain('- Último: 40 / – / – kg');
});

test('formatExerciseMarkdown: simple exercise with per-set table', () => {
  const e = ex({ id: 'e1', sets: 3 });
  const entries = [
    entry({ setNumber: 1, weightKg: 42.5, done: true }),
    entry({ setNumber: 2, weightKg: 42.5, done: true }),
    entry({ setNumber: 3, weightKg: 40, done: false }),
  ];
  const md = formatExerciseMarkdown(e, entries, 'Supino reto');
  expect(md).toContain('## 1. Supino reto — 3×8-10 · descanso 90s');
  expect(md).toContain('| Série | Peso | Feito |');
  expect(md).toContain('| 1 | 42,5 kg | ✅ |');
  expect(md).toContain('| 3 | 40 kg | ⬜ |');
});

test('formatExerciseMarkdown: combo shows Peso A and Peso B columns', () => {
  const e = ex({
    id: 'e2',
    name: 'Supino inclinado',
    isCombo: true,
    comboName: 'Crucifixo',
    sets: 2,
  });
  const entries = [
    entry({ exerciseId: 'e2', setNumber: 1, weightKg: 30, weightKgSecondary: 12, done: true }),
    entry({ exerciseId: 'e2', setNumber: 2, weightKg: 30, weightKgSecondary: 12, done: false }),
  ];
  const md = formatExerciseMarkdown(e, entries, 'Supino inclinado');
  expect(md).toContain('| Série | Peso A | Peso B | Feito |');
  expect(md).toContain('| 1 | 30 kg | 12 kg | ✅ |');
});

test('formatSessionMarkdown: header em andamento, substitution shows original', () => {
  const exercises = [
    ex({ id: 'e1', name: 'Supino reto', sets: 2 }),
  ];
  const entries = [
    entry({ setNumber: 1, weightKg: 42.5, done: true }),
    entry({ setNumber: 2, weightKg: 40, done: false }),
  ];
  const md = formatSessionMarkdown('Treino A', exercises, entries, { e1: 'Supino máquina' });
  expect(md).toContain('# Treino A (em andamento)');
  expect(md).toContain('## 1. Supino máquina — 2×8-10 · descanso 90s');
  expect(md).toContain('Original: Supino reto');
});
