<script setup>
import { computed } from 'vue';
import { formatDateRange, isTodoOverdue } from '@/utils/dateUtils';

const props = defineProps({
  todo: {
    type: Object,
    required: true,
  },
  isPending: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggle-status', 'edit', 'delete']);

const overdue = computed(() => isTodoOverdue(props.todo));
const formattedInterval = computed(() =>
  formatDateRange(props.todo.date_from, props.todo.date_to)
);
</script>

<template>
  <article
    class="rounded-xl border p-4 sm:p-5 transition-all shadow-xs"
    :class="[
      todo.is_finished
        ? 'bg-slate-50/90 border-slate-200'
        : overdue
          ? 'bg-red-50/40 border-red-200'
          : 'bg-white border-slate-200 hover:border-slate-300',
      isPending ? 'opacity-65' : '',
    ]"
  >
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <!-- Left side: completion checkbox + task content -->
      <div class="flex items-start gap-3.5 min-w-0 flex-1">
        <button
          type="button"
          role="checkbox"
          :aria-checked="todo.is_finished"
          :aria-label="
            todo.is_finished
              ? `Znovu otvoriť úlohu ${todo.title}`
              : `Označiť úlohu ${todo.title} ako dokončenú`
          "
          :disabled="isPending"
          class="mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed"
          :class="
            todo.is_finished
              ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-white border-slate-300 hover:border-blue-600'
          "
          @click="emit('toggle-status', todo)"
        >
          <svg
            v-if="todo.is_finished"
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <div class="min-w-0 flex-1">
          <!-- Title and status badges -->
          <div class="flex flex-wrap items-center gap-2">
            <h3
              class="text-base font-bold wrap-break-words"
              :class="
                todo.is_finished
                  ? 'line-through text-slate-500'
                  : 'text-slate-900'
              "
            >
              {{ todo.title }}
            </h3>

            <span
              v-if="todo.is_finished"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
            >
              Dokončená
            </span>

            <span
              v-else-if="overdue"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"
            >
              Po termíne
            </span>

            <span
              v-else
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
            >
              Aktívna
            </span>
          </div>

          <!-- Optional description (rendered safely as plain text) -->
          <p
            v-if="todo.description"
            class="mt-1.5 text-sm leading-relaxed whitespace-pre-line wrap-break-words"
            :class="todo.is_finished ? 'text-slate-400' : 'text-slate-600'"
          >
            {{ todo.description }}
          </p>

          <!-- Date and time interval -->
          <div
            class="mt-2.5 flex items-center gap-1.5 text-xs font-medium"
            :class="
              overdue && !todo.is_finished
                ? 'text-red-700'
                : 'text-slate-500'
            "
          >
            <svg
              class="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{{ formattedInterval }}</span>
          </div>
        </div>
      </div>

      <!-- Right side: action controls -->
      <div class="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <button
          type="button"
          :disabled="isPending"
          class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          @click="emit('edit', todo)"
        >
          Upraviť
        </button>

        <button
          type="button"
          :disabled="isPending"
          class="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          @click="emit('delete', todo)"
        >
          Odstrániť
        </button>
      </div>
    </div>
  </article>
</template>