<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, Plus } from 'lucide-vue-next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import AutocompleteInput from '@/app/components/AutocompleteInput.vue';
import type { Exercise } from '@/app/db/schema';
import type { ExerciseDraft } from '@/app/composables/useExercises';
import { useExerciseNames } from '@/app/composables/useExerciseNames';
import { toast } from 'vue-sonner';

const props = defineProps<{
  open: boolean;
  exercise?: Exercise;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  save: [draft: ExerciseDraft];
}>();

const allNames = useExerciseNames();
const name = ref('');
const sets = ref(3);
const reps = ref('8-12');
const restSeconds = ref(90);
const isCombo = ref(false);
const comboName = ref('');
const alternatives = ref<string[]>([]);
const altInput = ref('');

watch(
  () => [props.open, props.exercise?.id],
  () => {
    if (!props.open) return;
    const ex = props.exercise;
    name.value = ex?.name ?? '';
    sets.value = ex?.sets ?? 3;
    reps.value = ex?.reps ?? '8-12';
    restSeconds.value = ex?.restSeconds ?? 90;
    isCombo.value = ex?.isCombo ?? false;
    comboName.value = ex?.comboName ?? '';
    alternatives.value = [...(ex?.alternatives ?? [])];
    altInput.value = '';
  },
  { immediate: true },
);

function addAlternative(): void {
  const v = altInput.value.trim();
  if (!v) return;
  if (alternatives.value.includes(v)) {
    altInput.value = '';
    return;
  }
  alternatives.value.push(v);
  altInput.value = '';
}

function removeAlternative(value: string): void {
  alternatives.value = alternatives.value.filter((a) => a !== value);
}

function onAltKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addAlternative();
  }
}

function submit(): void {
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    toast.error('Nome obrigatório');
    return;
  }
  if (sets.value < 1) {
    toast.error('Mínimo 1 série');
    return;
  }
  if (restSeconds.value < 0) {
    toast.error('Descanso inválido');
    return;
  }
  emit('save', {
    name: trimmedName,
    sets: sets.value,
    reps: reps.value.trim() || '0',
    restSeconds: restSeconds.value,
    isCombo: isCombo.value,
    comboName: isCombo.value ? comboName.value.trim() || undefined : undefined,
    alternatives: [...alternatives.value],
  });
}
</script>

<template>
  <Sheet :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <SheetContent side="right" class="w-full sm:max-w-md flex flex-col">
      <SheetHeader>
        <SheetTitle>{{ exercise ? 'Editar exercício' : 'Novo exercício' }}</SheetTitle>
        <SheetDescription>
          Configure nome, volume, descanso e variações.
        </SheetDescription>
      </SheetHeader>

      <form @submit.prevent="submit" class="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        <div class="space-y-1.5">
          <Label for="ex-name">Nome</Label>
          <AutocompleteInput
            id="ex-name"
            v-model="name"
            placeholder="Supino reto"
            :suggestions="allNames"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="ex-sets">Séries</Label>
            <Input id="ex-sets" v-model.number="sets" type="number" min="1" inputmode="numeric" />
          </div>
          <div class="space-y-1.5">
            <Label for="ex-reps">Reps</Label>
            <Input id="ex-reps" v-model="reps" placeholder="8-12" autocomplete="off" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="ex-rest">Descanso (segundos)</Label>
          <Input id="ex-rest" v-model.number="restSeconds" type="number" min="0" step="15" inputmode="numeric" />
        </div>

        <Separator />

        <div class="flex items-center justify-between">
          <div>
            <Label for="ex-combo">Exercício combo</Label>
            <p class="text-xs text-muted-foreground">Para combos com dois pesos (ex: rosca + tríceps)</p>
          </div>
          <Switch id="ex-combo" v-model="isCombo" />
        </div>

        <div v-if="isCombo" class="space-y-1.5">
          <Label for="ex-combo-name">Nome do combo (segundo movimento)</Label>
          <Input id="ex-combo-name" v-model="comboName" placeholder="Tríceps testa" autocomplete="off" />
        </div>

        <Separator />

        <div class="space-y-2">
          <Label for="ex-alt">Alternativas</Label>
          <div class="flex gap-2">
            <AutocompleteInput
              id="ex-alt"
              v-model="altInput"
              placeholder="Crucifixo, peck deck..."
              class="flex-1"
              :suggestions="allNames"
              :exclude="[name, ...alternatives]"
              @pick="(v) => { altInput = v; addAlternative(); }"
              @submit="addAlternative"
            />
            <Button type="button" size="icon" variant="secondary" @click="addAlternative" aria-label="Adicionar alternativa">
              <Plus class="size-4" />
            </Button>
          </div>
          <ul v-if="alternatives.length" class="flex flex-wrap gap-1.5">
            <li
              v-for="alt in alternatives"
              :key="alt"
              class="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2.5 py-1 text-xs"
            >
              {{ alt }}
              <button
                type="button"
                class="hover:text-destructive"
                @click="removeAlternative(alt)"
                :aria-label="`Remover ${alt}`"
              >
                <X class="size-3" />
              </button>
            </li>
          </ul>
        </div>
      </form>

      <SheetFooter class="border-t border-border pt-3">
        <Button type="button" variant="ghost" @click="emit('update:open', false)">Cancelar</Button>
        <Button type="button" @click="submit">Salvar</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
