<script setup>
defineProps({
  studentName: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['change-student', 'create-todo', 'reset-todos']);
</script>

<template>
  <header class="bg-slate-900 text-white border-b border-slate-800 shadow-sm">
    <div class="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <!-- Brand title and active student badge -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
            Môj TODO List
          </h1>
          <div class="flex flex-wrap items-center gap-2 mt-0.5 text-xs sm:text-sm text-slate-300">
            <span>Študent:</span>
            <span
              v-if="studentName"
              class="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-medium border border-slate-700"
            >
              {{ studentName }}
            </span>
            <span v-else class="italic text-slate-400">Nezadaný</span>
            <button
              type="button"
              class="text-blue-400 hover:text-blue-300 underline cursor-pointer transition-colors"
              @click="emit('change-student')"
            >
              Zmeniť
            </button>
          </div>
        </div>
      </div>

      <!-- Primary header actions -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          :disabled="!studentName || isLoading"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm cursor-pointer transition-colors"
          @click="emit('create-todo')"
        >
          <span aria-hidden="true">+</span>
          <span>Nová úloha</span>
        </button>

        <button
          type="button"
          :disabled="!studentName || isLoading"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-sm font-medium border border-slate-700 cursor-pointer transition-colors"
          @click="emit('reset-todos')"
        >
          <span>Obnoviť ukážkové dáta</span>
        </button>
      </div>
    </div>
  </header>
</template>