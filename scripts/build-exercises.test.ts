import { test, expect } from 'bun:test';
import { toSlim } from './build-exercises.mjs';

const raw = {
  id: '0001', name: '3/4 sit-up', category: 'waist', equipment: 'body weight',
  target: 'abs', muscle_group: 'abs',
  instruction_steps: { en: ['Lie down.', 'Sit up.'] },
  image: 'images/0001-x.jpg', gif_url: 'videos/0001-x.gif',
};
const tr = { '0001': { nome: 'Abdominal 3/4', passos: ['Deite.', 'Suba.'] } };

test('toSlim monta entrada PT com paths reescritos', () => {
  expect(toSlim(raw, tr)).toEqual({
    id: '0001',
    nome: 'Abdominal 3/4',
    categoria: 'abdômen',
    equipamento: 'peso corporal',
    alvo: 'abdômen',
    musculo: 'abdômen',
    passos: ['Deite.', 'Suba.'],
    image: '/exercises/images/0001-x.jpg',
    gif: '/exercises/videos/0001-x.gif',
  });
});

test('toSlim cai no nome/passos EN quando não há tradução', () => {
  const s = toSlim(raw, {});
  expect(s.nome).toBe('3/4 sit-up');
  expect(s.passos).toEqual(['Lie down.', 'Sit up.']);
});
