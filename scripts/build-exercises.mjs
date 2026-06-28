import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { translateCategory, translateEquipment, translateMuscle }
  from '../src/app/data/i18n-vocab.ts';

export function toSlim(raw, translations) {
  const tr = translations[raw.id] ?? {};
  return {
    id: raw.id,
    nome: tr.nome ?? raw.name,
    categoria: translateCategory(raw.category),
    equipamento: translateEquipment(raw.equipment),
    alvo: translateMuscle(raw.target),
    musculo: translateMuscle(raw.muscle_group),
    passos: tr.passos ?? raw.instruction_steps?.en ?? [],
    image: `exercises/${raw.image}`,
    gif: `exercises/${raw.gif_url}`,
  };
}

function main() {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const raw = JSON.parse(readFileSync(`${here}data/exercises.raw.json`, 'utf8'));
  const translations = JSON.parse(
    readFileSync(`${here}data/translations.pt.json`, 'utf8'),
  );
  const slim = raw.map((e) => toSlim(e, translations));
  writeFileSync(
    `${here}../src/app/data/exercises.slim.json`,
    JSON.stringify(slim),
  );
  console.log(`wrote ${slim.length} exercises`);
}

if (import.meta.main) main();
