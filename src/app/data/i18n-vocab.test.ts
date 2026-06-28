import { test, expect } from 'bun:test';
import { translateCategory, translateEquipment, translateMuscle } from '@/app/data/i18n-vocab';

test('traduz categorias conhecidas', () => {
  expect(translateCategory('upper legs')).toBe('pernas (superior)');
  expect(translateCategory('chest')).toBe('peito');
});

test('traduz equipamentos conhecidos', () => {
  expect(translateEquipment('body weight')).toBe('peso corporal');
  expect(translateEquipment('dumbbell')).toBe('halteres');
});

test('traduz músculos conhecidos', () => {
  expect(translateMuscle('hamstrings')).toBe('posteriores de coxa');
});

test('devolve o input em termo desconhecido', () => {
  expect(translateCategory('zzz')).toBe('zzz');
});
