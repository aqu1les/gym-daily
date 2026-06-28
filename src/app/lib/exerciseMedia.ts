import { catalogById, type SlimExercise } from '@/app/data/exercise-catalog';
import { ALIASES } from '@/app/data/exercise-aliases';

export function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function diceCoefficient(a: string, b: string): number {
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return (2 * inter) / (ta.size + tb.size);
}

export function byId(id: string): SlimExercise | null {
  return catalogById.get(id) ?? null;
}

const FUZZY_THRESHOLD = 0.5;

export function resolveExerciseMedia(
  name: string,
  links: Map<string, string>,
): SlimExercise | null {
  const key = normalize(name);

  const linked = links.get(key);
  if (linked) return byId(linked);

  const alias = ALIASES[key];
  if (alias) return byId(alias);

  let bestId: string | null = null;
  let bestScore = 0;
  for (const aliasKey of Object.keys(ALIASES)) {
    const score = diceCoefficient(key, aliasKey);
    if (score > bestScore) {
      bestScore = score;
      bestId = ALIASES[aliasKey];
    }
  }
  return bestScore >= FUZZY_THRESHOLD && bestId ? byId(bestId) : null;
}
