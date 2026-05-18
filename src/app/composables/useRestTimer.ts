import { computed, ref, type Ref, type ComputedRef } from 'vue';
import { useIntervalFn } from '@vueuse/core';
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
  const { trigger: triggerHaptic } = useWebHaptics();

  const progress = computed(() => {
    if (total.value === 0) return 0;
    return Math.max(0, Math.min(1, remaining.value / total.value));
  });

  const interval = useIntervalFn(
    () => {
      if (remaining.value <= 1) {
        remaining.value = 0;
        isRunning.value = false;
        interval.pause();
        triggerHaptic('success');
        playBeep();
        return;
      }
      remaining.value--;
    },
    1000,
    { immediate: false },
  );

  function start(seconds: number): void {
    if (seconds <= 0) return;
    total.value = seconds;
    remaining.value = seconds;
    isRunning.value = true;
    interval.resume();
  }

  function add(seconds: number): void {
    if (!isRunning.value && remaining.value === 0) return;
    remaining.value = Math.max(0, remaining.value + seconds);
    total.value = Math.max(total.value, remaining.value);
  }

  function skip(): void {
    remaining.value = 0;
    isRunning.value = false;
    interval.pause();
  }

  function reset(): void {
    remaining.value = 0;
    total.value = 0;
    isRunning.value = false;
    interval.pause();
  }

  return { remaining, total, isRunning, progress, start, add, skip, reset };
}
