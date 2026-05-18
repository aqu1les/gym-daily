import { computed, ref, type Ref, type ComputedRef } from 'vue';
import { useIntervalFn, useEventListener } from '@vueuse/core';
import { useWebHaptics } from 'web-haptics/vue';

export interface UseRestTimer {
  remaining: Ref<number>;
  total: Ref<number>;
  isRunning: Ref<boolean>;
  progress: ComputedRef<number>;
  start: (seconds: number) => void;
  add: (seconds: number) => void;
  skip: () => void;
  reset: () => void;
}

function playBeep(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const beepAt = (offset: number, freq: number): void => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.3);
    };
    beepAt(0, 880);
    beepAt(0.18, 1175);
    setTimeout(() => void ctx.close(), 800);
  } catch (err) {
    console.warn('beep failed', err);
  }
}

export function useRestTimer(): UseRestTimer {
  const remaining = ref(0);
  const total = ref(0);
  const isRunning = ref(false);
  /** Absolute end time in epoch ms. Source of truth — survives background throttling. */
  const endsAt = ref<number | null>(null);
  const { trigger: triggerHaptic } = useWebHaptics();

  const progress = computed(() => {
    if (total.value === 0) return 0;
    return Math.max(0, Math.min(1, remaining.value / total.value));
  });

  function syncFromClock(): void {
    if (endsAt.value === null) return;
    const msLeft = endsAt.value - Date.now();
    if (msLeft <= 0) {
      const wasRunning = isRunning.value;
      remaining.value = 0;
      isRunning.value = false;
      endsAt.value = null;
      interval.pause();
      if (wasRunning) {
        triggerHaptic('success');
        playBeep();
      }
      return;
    }
    remaining.value = Math.ceil(msLeft / 1000);
  }

  const interval = useIntervalFn(syncFromClock, 1000, { immediate: false });

  useEventListener(
    typeof document !== 'undefined' ? document : null,
    'visibilitychange',
    () => {
      if (document.visibilityState === 'visible') syncFromClock();
    },
  );
  useEventListener(typeof window !== 'undefined' ? window : null, 'focus', syncFromClock);

  function start(seconds: number): void {
    if (seconds <= 0) return;
    total.value = seconds;
    remaining.value = seconds;
    endsAt.value = Date.now() + seconds * 1000;
    isRunning.value = true;
    interval.resume();
  }

  function add(seconds: number): void {
    if (endsAt.value === null) return;
    const newEnd = Math.max(Date.now(), endsAt.value + seconds * 1000);
    endsAt.value = newEnd;
    const newRemaining = Math.ceil((newEnd - Date.now()) / 1000);
    remaining.value = newRemaining;
    total.value = Math.max(total.value, newRemaining);
    triggerHaptic('nudge');
  }

  function skip(): void {
    remaining.value = 0;
    isRunning.value = false;
    endsAt.value = null;
    interval.pause();
    triggerHaptic('nudge');
  }

  function reset(): void {
    remaining.value = 0;
    total.value = 0;
    isRunning.value = false;
    endsAt.value = null;
    interval.pause();
  }

  return { remaining, total, isRunning, progress, start, add, skip, reset };
}
