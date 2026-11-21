<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { toApiIsoString, toDateTimeLocalValue } from '@/utils/dateUtils';
import {
  validateTodoForm,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '@/utils/validation';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  todoToEdit: {
    type: Object,
    default: null,
  },
  initialRange: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'close']);

const titleInputRef = ref(null);

const form = ref({
  title: '',
  description: '',
  date_from: '',
  date_to: '',
  is_finished: false,
});

const errors = ref({
  title: '',
  description: '',
  date_from: '',
  date_to: '',
});

const isEditMode = computed(() => Boolean(props.todoToEdit));

/**
 * Generates default start (next whole hour) and end (+1 hour) local datetime strings.
 */
function getDefaultDateTimeRange() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    date_from: toDateTimeLocalValue(start.toISOString()),
    date_to: toDateTimeLocalValue(end.toISOString()),
  };
}

function resetErrors() {
  errors.value = {
    title: '',
    description: '',
    date_from: '',
    date_to: '',
  };
}

// Populate or reset form fields whenever the modal opens
watch(
  () => props.isOpen,
  async (opened) => {
    if (!opened) return;

    resetErrors();

    if (props.todoToEdit) {
      form.value = {
        title: props.todoToEdit.title || '',
        description: props.todoToEdit.description || '',
        date_from: toDateTimeLocalValue(props.todoToEdit.date_from),
        date_to: toDateTimeLocalValue(props.todoToEdit.date_to),
        is_finished: Boolean(props.todoToEdit.is_finished),
      };
    } else {
      const range =
        props.initialRange?.date_from && props.initialRange?.date_to
          ? props.initialRange
          : getDefaultDateTimeRange();

      form.value = {
        title: '',
        description: '',
        date_from: range.date_from,
        date_to: range.date_to,
        is_finished: false,
      };
    }

    await nextTick();
    titleInputRef.value?.focus();
  },
  { immediate: true }
);

function clearFieldError(field) {
  if (errors.value[field]) {
    errors.value[field] = '';
  }
}

function handleSubmit() {
  if (props.isSubmitting) return;

  const validation = validateTodoForm(form.value);
  errors.value = validation.errors;

  if (!validation.isValid) {
    return;
  }

  // Build full TodoCreate payload required by both POST and PUT endpoints
  const payload = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    date_from: toApiIsoString(form.value.date_from),
    date_to: toApiIsoString(form.value.date_to),
    is_finished: Boolean(form.value.is_finished),
  };

  emit('submit', {
    payload,
    todoId: props.todoToEdit?.id ?? null,
  });
}

function handleClose() {
  if (!props.isSubmitting) {
    emit('close');
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="todo-form-modal-title"
    @click.self="handleClose"
    @keydown.esc="handleClose"
  >
    <div class="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden my-auto">
      <!-- Modal Header -->
      <div class="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
        <h2 id="todo-form-modal-title" class="text-lg font-bold">
          {{ isEditMode ? 'Upraviť úlohu' : 'Nová úloha' }}
        </h2>
        <button
          type="button"
          :disabled="isSubmitting"
          aria-label="Zavrieť formulár"
          class="text-slate-400 hover:text-white disabled:opacity-50 text-xl leading-none cursor-pointer"
          @click="handleClose"
        >
          &times;
        </button>
      </div>

      <!-- Todo Form -->
      <form class="p-6 space-y-4" novalidate @submit.prevent="handleSubmit">
        <!-- Title -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="todo-title-input" class="block text-sm font-semibold text-slate-700">
              Názov úlohy <span class="text-red-600">*</span>
            </label>
            <span class="text-xs text-slate-400">
              {{ form.title.length }} / {{ TITLE_MAX_LENGTH }}
            </span>
          </div>
          <input
            id="todo-title-input"
            ref="titleInputRef"
            v-model="form.title"
            type="text"
            :maxlength="TITLE_MAX_LENGTH"
            :disabled="isSubmitting"
            :aria-invalid="Boolean(errors.title)"
            :aria-describedby="errors.title ? 'todo-title-error' : undefined"
            placeholder="Napr. Odovzdať zadanie z WEBTE1"
            class="w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-100"
            :class="
              errors.title
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
            "
            @input="clearFieldError('title')"
          />
          <p
            v-if="errors.title"
            id="todo-title-error"
            class="mt-1.5 text-xs font-medium text-red-600"
          >
            {{ errors.title }}
          </p>
        </div>

        <!-- Description -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="todo-description-input" class="block text-sm font-semibold text-slate-700">
              Popis <span class="text-xs font-normal text-slate-400">(voliteľné)</span>
            </label>
            <span class="text-xs text-slate-400">
              {{ form.description.length }} / {{ DESCRIPTION_MAX_LENGTH }}
            </span>
          </div>
          <textarea
            id="todo-description-input"
            v-model="form.description"
            rows="3"
            :maxlength="DESCRIPTION_MAX_LENGTH"
            :disabled="isSubmitting"
            :aria-invalid="Boolean(errors.description)"
            :aria-describedby="errors.description ? 'todo-description-error' : undefined"
            placeholder="Podrobnosti k úlohe..."
            class="w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-100 resize-y"
            :class="
              errors.description
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
            "
            @input="clearFieldError('description')"
          ></textarea>
          <p
            v-if="errors.description"
            id="todo-description-error"
            class="mt-1.5 text-xs font-medium text-red-600"
          >
            {{ errors.description }}
          </p>
        </div>

        <!-- Date and time interval -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="todo-date-from-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Začiatok <span class="text-red-600">*</span>
            </label>
            <input
              id="todo-date-from-input"
              v-model="form.date_from"
              type="datetime-local"
              :disabled="isSubmitting"
              :aria-invalid="Boolean(errors.date_from)"
              :aria-describedby="errors.date_from ? 'todo-date-from-error' : undefined"
              class="w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-100"
              :class="
                errors.date_from
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              "
              @input="clearFieldError('date_from'); clearFieldError('date_to')"
            />
            <p
              v-if="errors.date_from"
              id="todo-date-from-error"
              class="mt-1.5 text-xs font-medium text-red-600"
            >
              {{ errors.date_from }}
            </p>
          </div>

          <div>
            <label for="todo-date-to-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
              Koniec <span class="text-red-600">*</span>
            </label>
            <input
              id="todo-date-to-input"
              v-model="form.date_to"
              type="datetime-local"
              :disabled="isSubmitting"
              :aria-invalid="Boolean(errors.date_to)"
              :aria-describedby="errors.date_to ? 'todo-date-to-error' : undefined"
              class="w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-100"
              :class="
                errors.date_to
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              "
              @input="clearFieldError('date_to')"
            />
            <p
              v-if="errors.date_to"
              id="todo-date-to-error"
              class="mt-1.5 text-xs font-medium text-red-600"
            >
              {{ errors.date_to }}
            </p>
          </div>
        </div>

        <!-- Completion status toggle (shown when editing an existing todo) -->
        <div v-if="isEditMode" class="pt-1">
          <label
            for="todo-is-finished-input"
            class="inline-flex items-center gap-2.5 cursor-pointer select-none"
          >
            <input
              id="todo-is-finished-input"
              v-model="form.is_finished"
              name="is_finished"
              type="checkbox"
              :disabled="isSubmitting"
              class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30 cursor-pointer"
            />
            <span class="text-sm font-medium text-slate-700">
              Úloha je dokončená
            </span>
          </label>
        </div>

        <!-- Form Actions -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
            @click="handleClose"
          >
            Zrušiť
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm cursor-pointer transition-colors"
          >
            {{
              isSubmitting
                ? 'Ukladám...'
                : isEditMode
                  ? 'Uložiť zmeny'
                  : 'Vytvoriť úlohu'
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>