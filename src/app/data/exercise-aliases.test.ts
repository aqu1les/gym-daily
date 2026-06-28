// src/app/data/exercise-aliases.test.ts
import { test, expect } from 'bun:test';
import { ALIASES } from '@/app/data/exercise-aliases';
import { catalogById } from '@/app/data/exercise-catalog';
import { normalize } from '@/app/lib/exerciseMedia';

const USER_NAMES = [
  'Remada curvada com barra','Crucifixo invertido','Hip Thrust','Mesa flexora',
  'Extensora','Flexora','Elevação lateral','Elevação frontal','Panturrilha sentado',
  'Supino inclinado com halteres','Rosca alternada','Triceps francês','Stiff com barra',
  'Leg Press','Desenvolvimento maquina','Crucifixo inclinado','Rosca martelo','Smith',
  'Puxada neutra','Triceps corda','Rosca na polia','Rosca na polia baixa',
  'Supino inclinado com barra','Leg press horizontal','Agachamento Hack','Triceps testa',
  'Puxada frontal','Panturrilha','Supino reto','Desenvolvimento Arnold','Remada polia baixa',
];

test('todo nome do usuário tem alias', () => {
  const missing = USER_NAMES.filter((n) => !(normalize(n) in ALIASES));
  expect(missing).toEqual([]);
});

test('todo alias aponta p/ id existente no catálogo', () => {
  const broken = Object.entries(ALIASES).filter(([, id]) => !catalogById.has(id));
  expect(broken).toEqual([]);
});

test('chaves de alias estão normalizadas', () => {
  const bad = Object.keys(ALIASES).filter((k) => normalize(k) !== k);
  expect(bad).toEqual([]);
});
