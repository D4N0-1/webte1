<script setup>
import { computed } from 'vue';
import { formatDateRange, isTodoOverdue } from '@/utils/dateUtils';

const props = defineProps({
  todo: {
    type: Object,
    default: null,
  },
  isPending: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'toggle-status', 'edit', 'delete']);

const overdue = computed(() => (props.todo ? isTodoOverdue(props.todo) : false));
const formattedInterval = computed(() =>
  props.todo ? formatDateRange(props.todo.date_from, props.todo.date_to) : ''
);

function handleClose() {
  if (!props.isPending) {
    emit('close');
  }
}
</script>

<template>
  <div
    v-if="todo"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="todo-detail-modal-title"
    @click.self="handleClose"
    @keydown.esc="handleClose"
  >
    <div class="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-slate-900 px-6 py-4 text-white flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0"
            :class="
              todo.is_finished
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                : overdue
                  ? 'bg-red-500/20 text-red-200 border border-red-400/30'
                  : 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
            "
          >
            {{ todo.is_finished ? 'Dokončená' : overdue ? 'Po termíne' : 'Aktívna' }}
          </span>
          <span class="text-xs text-slate-400 truncate">Detail úlohy</span>
        </div>

        <button
          type="button"
          :disabled="isPending"
          aria-label="Zavrieť detail úlohy"
          class="text-slate-400 hover:text-white disabled:opacity-50 text-xl leading-none cursor-pointer"
          @click="handleClose"
        >
          &times;
        </button>
      </div>

      <!-- Task Content -->
      <div class="p-6 space-y-4">
        <div>
          <h2
            id="todo-detail-modal-title"
            class="text-lg font-bold wrap-break-word"
            :class="todo.is_finished ? 'line-through text-slate-500' : 'text-slate-900'"
          >
            {{ todo.title }}
          </h2>

          <div
            class="mt-2 flex items-center gap-2 text-xs font-medium"
            :class="overdue && !todo.is_finished ? 'text-red-700' : 'text-slate-500'"
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

        <!-- Description box -->
        <div class="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Popis úlohy
          </p>
          <p
            v-if="todo.description"
            class="text-sm text-slate-700 leading-relaxed whitespace-pre-line wrap-break-word"
          >
            {{ todo.description }}
          </p>
          <p v-else class="text-sm italic text-slate-400">
            Bez popisu.
          </p>
        </div>

        <!-- Quick Actions -->
        <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            :disabled="isPending"
            class="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            :class="
              todo.is_finished
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
            "
            @click="emit('toggle-status', todo)"
          >
            {{
              isPending
                ? 'Ukladám...'
                : todo.is_finished
                  ? 'Znovu otvoriť úlohu'
                  : 'Označiť ako dokončenú'
            }}
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="isPending"
              class="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer transition-colors"
              @click="emit('edit', todo)"
            >
              Upraviť
            </button>

            <button
              type="button"
              :disabled="isPending"
              class="px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer transition-colors"
              @click="emit('delete', todo)"
            >
              Odstrániť
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>