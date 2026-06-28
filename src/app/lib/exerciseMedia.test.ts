import { test, expect } from 'bun:test';
import { normalize, diceCoefficient } from '@/app/lib/exerciseMedia';

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
