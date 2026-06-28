import { ref } from 'vue';
import { db } from '@/app/db/schema';
import { normalize } from '@/app/lib/exerciseMedia';

const links = ref<Map<string, string>>(new Map());
let loaded = false;

async function load(): Promise<void> {
  if (loaded) return;
  const rows = await db.exerciseLinks.toArray();
  links.value = new Map(rows.map((r) => [r.normName, r.datasetId]));
  loaded = true;
}

export function useExerciseLinks() {
  void load().catch((e) => console.error('[useExerciseLinks] load failed', e));

  async function link(name: string, datasetId: string): Promise<void> {
    const normName = normalize(name);
    await db.exerciseLinks.put({ normName, datasetId, linkedAt: Date.now() });
    const next = new Map(links.value);
    next.set(normName, datasetId);
    links.value = next;
  }

  async function unlink(name: string): Promise<void> {
    const normName = normalize(name);
    await db.exerciseLinks.delete(normName);
    const next = new Map(links.value);
    next.delete(normName);
    links.value = next;
  }

  return { links, link, unlink };
}
