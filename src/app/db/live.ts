import { liveQuery, type Subscription } from 'dexie';
import { onScopeDispose, ref, shallowRef, type Ref } from 'vue';
import { toast } from 'vue-sonner';

export function useLiveQuery<T>(querier: () => T | Promise<T>, initial: T): Ref<T> {
  const value = shallowRef<T>(initial) as Ref<T>;
  const sub: Subscription = liveQuery(querier).subscribe({
    next: (v) => {
      value.value = v;
    },
    error: (err) => {
      console.error(err);
      toast.error('Erro ao consultar banco de dados');
    },
  });
  onScopeDispose(() => sub.unsubscribe());
  return value;
}

export function useLiveQueryRef<T>(querier: () => T | Promise<T>): Ref<T | undefined> {
  return useLiveQuery<T | undefined>(querier, undefined);
}

export async function runWithToast<T>(op: () => Promise<T>, errorMsg: string): Promise<T | undefined> {
  try {
    return await op();
  } catch (err) {
    console.error(err);
    toast.error(errorMsg);
    return undefined;
  }
}

export { ref };
