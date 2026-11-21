<script setup>
import { computed } from 'vue';

const props = defineProps({
  statusFilter: {
    type: String,
    required: true,
  },
  searchQuery: {
    type: String,
    required: true,
  },
  sortBy: {
    type: String,
    required: true,
  },
  counts: {
    type: Object,
    default: () => ({ all: 0, active: 0, completed: 0 }),
  },
});

const emit = defineEmits([
  'update:statusFilter',
  'update:searchQuery',
  'update:sortBy',
  'reset-filters',
]);

const statusOptions = [
  { id: 'all', label: 'Všetky' },
  { id: 'active', label: 'Nedokončené' },
  { id: 'completed', label: 'Dokončené' },
];

const hasActiveFilters = computed(
  () => props.statusFilter !== 'all' || props.searchQuery.trim() !== ''
);
</script>

<template>
  <section
    aria-label="Filtrovanie a zoradenie úloh"
    class="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-xs space-y-3"
  >
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <!-- Status filter pills -->
      <div
        role="group"
        aria-label="Filter podľa stavu"
        class="inline-flex flex-wrap rounded-lg bg-slate-100 p-1 gap-1 self-start"
      >
        <button
          v-for="option in statusOptions"
          :key="option.id"
          type="button"
          :aria-pressed="statusFilter === option.id"
          class="px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          :class="
            statusFilter === option.id
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          "
          @click="emit('update:statusFilter', option.id)"
        >
          <span>{{ option.label }}</span>
          <span
            class="px-1.5 py-0.2 rounded-full text-xs"
            :class="
              statusFilter === option.id
                ? 'bg-blue-50 text-blue-700'
                : 'bg-slate-200/70 text-slate-600'
            "
          >
            {{ counts[option.id] ?? 0 }}
          </span>
        </button>
      </div>

      <!-- Search and sort controls -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl">
        <!-- Search by title -->
        <div class="relative flex-1">
          <svg
            class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>
          <input
            id="todo-search-input"
            name="search"
            type="search"
            aria-label="Vyhľadať úlohu podľa názvu"
            placeholder="Hľadať podľa názvu..."
            class="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          >
          <button
            v-if="searchQuery"
            type="button"
            aria-label="Vymazať vyhľadávanie"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base leading-none cursor-pointer"
            @click="emit('update:searchQuery', '')"
          >
            &times;
          </button>
        </div>

        <!-- Sort selector -->
        <div class="sm:w-56 shrink-0">
          <label for="todo-sort-select" class="sr-only">Zoradiť úlohy</label>
          <select
            id="todo-sort-select"
            :value="sortBy"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
            @change="emit('update:sortBy', $event.target.value)"
          >
            <option value="date_from_asc">Začiatok (od najskoršieho)</option>
            <option value="date_from_desc">Začiatok (od najneskoršieho)</option>
            <option value="date_to_asc">Koniec (od najskoršieho)</option>
            <option value="date_to_desc">Koniec (od najneskoršieho)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Active filter reset link -->
    <div v-if="hasActiveFilters" class="flex items-center justify-end pt-1 border-t border-slate-100">
      <button
        type="button"
        class="text-xs font-semibold text-blue-600 hover:text-blue-500 cursor-pointer"
        @click="emit('reset-filters')"
      >
        Zrušiť všetky filtre
      </button>
    </div>
  </section>
</template>