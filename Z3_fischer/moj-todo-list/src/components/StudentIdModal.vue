<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  currentName: {
    type: String,
    default: '',
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  canClose: {
    type: Boolean,
    default: false,
  },
  apiError: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['submit', 'close']);

const inputName = ref('');
const validationError = ref('');
const inputRef = ref(null);

// Sync input value and focus the field whenever the modal opens
watch(
  () => props.isOpen,
  async (opened) => {
    if (opened) {
      inputName.value = props.currentName || '';
      validationError.value = '';
      await nextTick();
      inputRef.value?.focus();
    }
  },
  { immediate: true }
);

function handleSubmit() {
  const trimmed = inputName.value.trim();

  if (!trimmed) {
    validationError.value = 'Zadajte svoj identifikátor študenta (napr. AIS login alebo priezvisko).';
    return;
  }

  if (trimmed.length > 50) {
    validationError.value = 'Identifikátor môže mať maximálne 50 znakov.';
    return;
  }

  validationError.value = '';
  emit('submit', trimmed);
}

function handleBackdropClick() {
  if (props.canClose && !props.isSubmitting) {
    emit('close');
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="student-modal-title"
    @click.self="handleBackdropClick"
    @keydown.esc="handleBackdropClick"
  >
    <div class="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
        <h2 id="student-modal-title" class="text-lg font-bold">
          Identifikácia študenta
        </h2>
        <button
          v-if="canClose"
          type="button"
          :disabled="isSubmitting"
          aria-label="Zavrieť okno"
          class="text-slate-400 hover:text-white disabled:opacity-50 cursor-pointer text-xl leading-none"
          @click="emit('close')"
        >
          &times;
        </button>
      </div>

      <!-- Modal Form -->
      <form class="p-6 space-y-4" novalidate @submit.prevent="handleSubmit">
        <p class="text-sm text-slate-600 leading-relaxed">
          Zadajte svoj jedinečný identifikátor pre pripojenie k osobnému zoznamu úloh na serveri.
          Pri prvom prístupe server automaticky vytvorí <strong>5 ukážkových úloh</strong>.
        </p>

        <div>
          <label for="student-id-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Identifikátor študenta <span class="text-red-600">*</span>
          </label>
          <input
            id="student-id-input"
            ref="inputRef"
            v-model="inputName"
            type="text"
            maxlength="50"
            placeholder="napr. xfischer"
            :disabled="isSubmitting"
            class="w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-100"
            :class="
              validationError
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
            "
            @input="validationError = ''"
          />
          <p v-if="validationError" class="mt-1.5 text-xs font-medium text-red-600">
            {{ validationError }}
          </p>
        </div>

        <!-- Server / Network Error Alert -->
        <div
          v-if="apiError"
          class="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700"
          role="alert"
        >
          {{ apiError }}
        </div>

        <!-- Actions -->
        <div class="pt-2 flex items-center justify-end gap-2.5">
          <button
            v-if="canClose"
            type="button"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
            @click="emit('close')"
          >
            Zrušiť
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm cursor-pointer transition-colors"
          >
            {{ isSubmitting ? 'Načítavam úlohy...' : 'Pokračovať' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>