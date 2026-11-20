<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTodos } from '@/composables/useTodos';
import { toDateTimeLocalValue } from '@/utils/dateUtils';
import AppHeader from '@/components/AppHeader.vue';
import AppNavbar from '@/components/AppNavbar.vue';
import AppFooter from '@/components/AppFooter.vue';
import StudentIdModal from '@/components/StudentIdModal.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import TodoFilters from '@/components/TodoFilters.vue';
import TodoList from '@/components/TodoList.vue';
import TodoFormModal from '@/components/TodoFormModal.vue';
import TodoCalendar from '@/components/TodoCalendar.vue';
import TodoDetailModal from '@/components/TodoDetailModal.vue';
import AboutSection from '@/components/AboutSection.vue';

const {
  studentName,
  hasStudentName,
  todos,
  isLoading,
  isSubmitting,
  fetchError,
  toast,
  isTodoPending,
  dismissToast,
  setStudentName,
  fetchTodos,
  addTodo,
  editTodo,
  toggleTodoStatus,
  removeTodo,
  resetSampleTodos,
} = useTodos();

const activeTab = ref('list');
const isStudentModalOpen = ref(false);
const isFormModalOpen = ref(false);
const isResetModalOpen = ref(false);
const todoToEdit = ref(null);
const todoToDelete = ref(null);
const selectedCalendarTodoId = ref(null);
const initialFormRange = ref(null);

// Filter and sort state for the task list
const statusFilter = ref('all');
const searchQuery = ref('');
const sortBy = ref('date_from_asc');

// Keep detail modal reactive to state changes (e.g., toggling completion status)
const selectedCalendarTodo = computed(() =>
  selectedCalendarTodoId.value !== null
    ? todos.value.find((item) => item.id === selectedCalendarTodoId.value) || null
    : null
);

const isSelectedDetailPending = computed(() =>
  selectedCalendarTodo.value ? isTodoPending(selectedCalendarTodo.value.id) : false
);

const isDeletingSelected = computed(() =>
  todoToDelete.value ? isTodoPending(todoToDelete.value.id) : false
);

// Task counts per status category
const statusCounts = computed(() => {
  const completed = todos.value.filter((todo) => todo.is_finished).length;
  return {
    all: todos.value.length,
    active: todos.value.length - completed,
    completed,
  };
});

// Derived filtered and sorted list (keeps original `todos` intact for the calendar)
const filteredTodos = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase();

  const filtered = todos.value.filter((todo) => {
    if (statusFilter.value === 'active' && todo.is_finished) return false;
    if (statusFilter.value === 'completed' && !todo.is_finished) return false;

    if (normalizedQuery && !todo.title.toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    return true;
  });

  const field = sortBy.value.startsWith('date_from') ? 'date_from' : 'date_to';
  const direction = sortBy.value.endsWith('asc') ? 1 : -1;

  return [...filtered].sort((a, b) => {
    const timeA = new Date(a[field]).getTime();
    const timeB = new Date(b[field]).getTime();
    return (timeA - timeB) * direction;
  });
});

function resetFilters() {
  statusFilter.value = 'all';
  searchQuery.value = '';
}

function openCreateModal(range = null) {
  todoToEdit.value = null;
  initialFormRange.value = range;
  isFormModalOpen.value = true;
}

function openEditModal(todo) {
  selectedCalendarTodoId.value = null;
  todoToEdit.value = todo;
  initialFormRange.value = null;
  isFormModalOpen.value = true;
}

function closeFormModal() {
  isFormModalOpen.value = false;
  todoToEdit.value = null;
  initialFormRange.value = null;
}

function handleCalendarSelectTodo(todo) {
  selectedCalendarTodoId.value = todo.id;
}

function handleCalendarSelectRange({ startStr, endStr }) {
  // Month view returns date-only string (e.g. "2026-11-25") -> prefill 09:00 to 10:00
  if (startStr && !startStr.includes('T')) {
    openCreateModal({
      date_from: `${startStr}T09:00`,
      date_to: `${startStr}T10:00`,
    });
    return;
  }

  // Week/day timeGrid view returns ISO datetime strings
  openCreateModal({
    date_from: toDateTimeLocalValue(startStr),
    date_to: toDateTimeLocalValue(endStr),
  });
}

function handleDetailDelete(todo) {
  selectedCalendarTodoId.value = null;
  todoToDelete.value = todo;
}

onMounted(() => {
  if (hasStudentName.value) {
    fetchTodos();
  } else {
    isStudentModalOpen.value = true;
  }
});

async function handleStudentSubmit(newName) {
  const success = await setStudentName(newName);
  if (success) {
    isStudentModalOpen.value = false;
  }
}

async function handleFormSubmit({ payload, todoId }) {
  const result = todoId
    ? await editTodo(todoId, payload)
    : await addTodo(payload);

  if (result) {
    closeFormModal();
  }
}

async function handleResetConfirm() {
  const success = await resetSampleTodos();
  if (success) {
    isResetModalOpen.value = false;
  }
}

async function handleDeleteConfirm() {
  if (!todoToDelete.value) return;
  const success = await removeTodo(todoToDelete.value.id);
  if (success) {
    todoToDelete.value = null;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <AppHeader
      :student-name="studentName"
      :is-loading="isLoading"
      @change-student="isStudentModalOpen = true"
      @create-todo="openCreateModal()"
      @reset-todos="isResetModalOpen = true"
    />

    <AppNavbar
      v-model:active-tab="activeTab"
      :todos-count="todos.length"
    />

    <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
      <!-- Global loading indicator -->
      <div
        v-if="isLoading"
        class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center gap-3"
        role="status"
      >
        <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm font-medium text-slate-600">Načítavam údaje zo servera...</p>
      </div>

      <template v-else>
        <section v-if="activeTab === 'list'" aria-label="Zoznam úloh">
          <TodoFilters
            v-if="todos.length > 0"
            v-model:status-filter="statusFilter"
            v-model:search-query="searchQuery"
            v-model:sort-by="sortBy"
            :counts="statusCounts"
            @reset-filters="resetFilters"
          />

          <TodoList
            :todos="filteredTodos"
            :total-count="todos.length"
            :is-todo-pending="isTodoPending"
            :fetch-error="fetchError"
            @toggle-status="toggleTodoStatus"
            @edit="openEditModal"
            @delete="todoToDelete = $event"
            @create-todo="openCreateModal()"
            @retry-fetch="fetchTodos"
          />
        </section>

        <TodoCalendar
          v-else-if="activeTab === 'calendar'"
          :todos="todos"
          @select-todo="handleCalendarSelectTodo"
          @select-range="handleCalendarSelectRange"
        />

        <AboutSection
          v-else-if="activeTab === 'about'"
          :student-name="studentName"
        />
      </template>
    </main>

    <AppFooter />

    <StudentIdModal
      :is-open="isStudentModalOpen"
      :current-name="studentName"
      :is-submitting="isLoading"
      :can-close="hasStudentName"
      :api-error="fetchError"
      @submit="handleStudentSubmit"
      @close="isStudentModalOpen = false"
    />

    <!-- Task detail modal opened from calendar event click -->
    <TodoDetailModal
      :todo="selectedCalendarTodo"
      :is-pending="isSelectedDetailPending"
      @close="selectedCalendarTodoId = null"
      @toggle-status="toggleTodoStatus"
      @edit="openEditModal"
      @delete="handleDetailDelete"
    />

    <!-- Create / Edit todo modal -->
    <TodoFormModal
      :is-open="isFormModalOpen"
      :todo-to-edit="todoToEdit"
      :initial-range="initialFormRange"
      :is-submitting="isSubmitting"
      @submit="handleFormSubmit"
      @close="closeFormModal"
    />

    <!-- Reset sample tasks confirmation -->
    <ConfirmModal
      :is-open="isResetModalOpen"
      title="Obnoviť ukážkové úlohy"
      message="Naozaj chcete obnoviť ukážkové dáta? Vaše aktuálne úlohy budú natrvalo odstránené a nahradené piatimi predvolenými úlohami."
      confirm-text="Obnoviť dáta"
      variant="warning"
      :is-submitting="isLoading"
      @confirm="handleResetConfirm"
      @close="isResetModalOpen = false"
    />

    <!-- Delete single task confirmation -->
    <ConfirmModal
      :is-open="Boolean(todoToDelete)"
      title="Odstrániť úlohu"
      :message="`Naozaj chcete natrvalo odstrániť úlohu „${todoToDelete?.title || ''}“?`"
      confirm-text="Odstrániť"
      variant="danger"
      :is-submitting="isDeletingSelected"
      @confirm="handleDeleteConfirm"
      @close="todoToDelete = null"
    />

    <ToastNotification :toast="toast" @dismiss="dismissToast" />
  </div>
</template>