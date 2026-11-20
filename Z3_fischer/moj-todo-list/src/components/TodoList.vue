<script setup>
import TodoItem from '@/components/TodoItem.vue';

defineProps({
  todos: {
    type: Array,
    required: true,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  isTodoPending: {
    type: Function,
    required: true,
  },
  fetchError: {
    type: String,
    default: '',
  },
});

const emit = defineEmits([
  'toggle-status',
  'edit',
  'delete',
  'create-todo',
  'retry-fetch',
]);
</script>

<template>
  <div>
    <!-- Network / server error state with retry action -->
    <div
      v-if="fetchError && totalCount === 0"
      class="bg-white rounded-xl border border-red-200 p-8 text-center shadow-xs"
      role="alert"
    >
      <p class="text-base font-bold text-red-700">
        Nepodarilo sa načítať zoznam úloh
      </p>
      <p class="text-sm text-slate-600 mt-1 max-w-md mx-auto">
        {{ fetchError }}
      </p>
      <button
        type="button"
        class="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold cursor-pointer transition-colors"
        @click="emit('retry-fetch')"
      >
        Skúsiť znova
      </button>
    </div>

    <!-- Empty state when user has no tasks on the server -->
    <div
      v-else-if="totalCount === 0"
      class="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs"
    >
      <h3 class="text-base font-bold text-slate-800">
        Zatiaľ nemáte žiadne úlohy
      </h3>
      <p class="text-sm text-slate-500 mt-1">
        Začnite vytvorením novej úlohy alebo obnovte ukážkové dáta v hlavičke.
      </p>
      <button
        type="button"
        class="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold cursor-pointer transition-colors"
        @click="emit('create-todo')"
      >
        + Vytvoriť prvú úlohu
      </button>
    </div>

    <!-- Empty state when active filters/search return zero matches -->
    <div
      v-else-if="todos.length === 0"
      class="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs"
    >
      <h3 class="text-base font-bold text-slate-800">
        Žiadne úlohy nezodpovedajú zvoleným filtrom
      </h3>
      <p class="text-sm text-slate-500 mt-1">
        Skúste upraviť hľadaný výraz alebo zmeniť filter stavu úloh.
      </p>
    </div>

    <!-- List of todo cards -->
    <div v-else class="space-y-3">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        :is-pending="isTodoPending(todo.id)"
        @toggle-status="emit('toggle-status', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>