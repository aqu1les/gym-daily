<script setup lang="ts">
import { computed, ref } from 'vue';
import { Input } from '@/app/components/ui/input';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    suggestions: string[];
    placeholder?: string;
    id?: string;
    autocomplete?: string;
    maxResults?: number;
    /** Hide suggestions that exactly equal these strings (case-insensitive). */
    exclude?: string[];
  }>(),
  { maxResults: 8, exclude: () => [] },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  pick: [value: string];
  /** Fired when user presses Enter without picking from the list. */
  submit: [value: string];
}>();

const open = ref(false);
const activeIndex = ref(-1);
const rootEl = ref<HTMLDivElement | null>(null);

const normalized = (s: string): string => s.trim().toLowerCase();

const filtered = computed<string[]>(() => {
  const q = normalized(props.modelValue);
  const excludeSet = new Set(props.exclude.map(normalized));
  let pool = props.suggestions.filter((s) => !excludeSet.has(normalized(s)));
  if (q.length > 0) {
    pool = pool.filter((s) => normalized(s).includes(q) && normalized(s) !== q);
  }
  return pool.slice(0, props.maxResults);
});

const visible = computed(() => open.value && filtered.value.length > 0);

function onInput(value: string | number): void {
  emit('update:modelValue', String(value));
  open.value = true;
  activeIndex.value = -1;
}

function onFocus(): void {
  open.value = true;
}

function onBlur(): void {
  setTimeout(() => {
    if (!rootEl.value?.contains(document.activeElement)) {
      open.value = false;
      activeIndex.value = -1;
    }
  }, 80);
}

function pick(name: string): void {
  emit('update:modelValue', name);
  emit('pick', name);
  open.value = false;
  activeIndex.value = -1;
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!open.value) open.value = true;
    if (filtered.value.length === 0) return;
    activeIndex.value = (activeIndex.value + 1) % filtered.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (filtered.value.length === 0) return;
    activeIndex.value =
      activeIndex.value <= 0 ? filtered.value.length - 1 : activeIndex.value - 1;
  } else if (e.key === 'Enter') {
    if (activeIndex.value >= 0 && filtered.value[activeIndex.value]) {
      e.preventDefault();
      pick(filtered.value[activeIndex.value]);
    } else {
      emit('submit', props.modelValue);
      open.value = false;
    }
  } else if (e.key === 'Escape') {
    if (open.value) {
      e.preventDefault();
      open.value = false;
      activeIndex.value = -1;
    }
  }
}
</script>

<template>
  <div ref="rootEl" class="relative">
    <Input
      :id="id"
      :model-value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete ?? 'off'"
      role="combobox"
      :aria-expanded="visible"
      aria-autocomplete="list"
      @update:model-value="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
    />
    <ul
      v-if="visible"
      class="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-border bg-popover text-popover-foreground shadow-md max-h-56 overflow-y-auto"
      role="listbox"
    >
      <li
        v-for="(s, idx) in filtered"
        :key="s"
        role="option"
        :aria-selected="activeIndex === idx"
        class="px-3 py-2 text-sm cursor-pointer"
        :class="activeIndex === idx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'"
        @mousedown.prevent="pick(s)"
        @mouseenter="activeIndex = idx"
      >
        {{ s }}
      </li>
    </ul>
  </div>
</template>
