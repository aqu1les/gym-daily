import { test, expect } from 'bun:test';
import { buildShareUrlFromCode, extractShareCode, decodeRoutineCode } from '@/app/lib/share';

test('buildShareUrlFromCode monta URL com o código encodado', () => {
  const code = 'gd1:abc+/=';
  const url = buildShareUrlFromCode('https://gym.example', code);
  expect(url).toBe('https://gym.example/?import=gd1%3Aabc%2B%2F%3D');
});

test('extractShareCode decodifica e faz trim', () => {
  expect(extractShareCode(' gd1:abc ')).toBe('gd1:abc');
});

test('round-trip: URL -> query -> decode reconstrói o preview', () => {
  // Código gerado por exportRoutineCode (gd1: + base64 de um RoutineExportV1).
  const payload = {
    v: 1,
    routine: { name: 'Treino A' },
    exercises: [
      {
        name: 'Supino reto',
        sets: 3,
        reps: '8-12',
        restSeconds: 90,
        isCombo: false,
        alternatives: ['Supino inclinado'],
      },
    ],
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  const code = `gd1:${b64}`;

  const url = buildShareUrlFromCode('https://gym.example', code);
  const param = new URL(url).searchParams.get('import');
  expect(param).not.toBeNull();

  const preview = decodeRoutineCode(extractShareCode(param!));
  expect(preview.name).toBe('Treino A');
  expect(preview.exerciseCount).toBe(1);
});
