import { test, expect } from 'bun:test';
import { normalize, diceCoefficient, resolveExerciseMedia } from '@/app/lib/exerciseMedia';
import { ALIASES } from '@/app/data/exercise-aliases';

test('normalize remove acento, caixa e pontuação', () => {
  expect(normalize('Elevação Lateral')).toBe('elevacao lateral');
  expect(normalize('Tríceps  testa!')).toBe('triceps testa');
});

test('diceCoefficient 1.0 para tokens idênticos', () => {
  expect(diceCoefficient('leg press', 'leg press')).toBe(1);
});

test('diceCoefficient alto p/ superset de tokens', () => {
  expect(diceCoefficient('leg press horizontal', 'leg press')).toBeGreaterThan(0.5);
});

test('diceCoefficient 0 sem tokens comuns', () => {
  expect(diceCoefficient('supino reto', 'puxada frontal')).toBe(0);
});

test('resolver: vínculo manual tem prioridade', () => {
  const links = new Map([['supino reto', ALIASES['leg press']]]);
  const r = resolveExerciseMedia('Supino reto', links);
  expect(r?.id).toBe(ALIASES['leg press']);
});

test('resolver: cai no alias curado', () => {
  const r = resolveExerciseMedia('Supino reto', new Map());
  expect(r?.id).toBe(ALIASES['supino reto']);
});

test('resolver: fuzzy resolve variação PT', () => {
  const r = resolveExerciseMedia('Leg press 45 horizontal', new Map());
  expect(r?.id).toBe(ALIASES['leg press horizontal']);
});

test('resolver: null quando nada bate', () => {
  expect(resolveExerciseMedia('xyz inexistente abc', new Map())).toBeNull();
});
