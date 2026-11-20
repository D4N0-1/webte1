import { ref, computed } from 'vue';
import * as todoApi from '@/services/todoApi';

const STUDENT_STORAGE_KEY = 'wt1_todo_student_id';

// Shared singleton reactive state across all components
const studentName = ref(localStorage.getItem(STUDENT_STORAGE_KEY) || '');
const todos = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const pendingTodoIds = ref([]);
const fetchError = ref('');
const toast = ref(null);

let toastTimeoutId = null;

/**
 * Extracts the todos array from the API user response object ({ id, name, created_at, todos: [...] }).
 */
function extractTodosList(data) {
  if (Array.isArray(data?.todos)) return data.todos;
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Displays a temporary feedback notification banner to the user.
 */
function showToast(message, type = 'success', duration = 3500) {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toast.value = {
    id: Date.now(),
    message,
    type, // 'success' | 'error' | 'info'
  };

  toastTimeoutId = setTimeout(() => {
    toast.value = null;
  }, duration);
}

function dismissToast() {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
  toast.value = null;
}

function addPendingId(todoId) {
  if (!pendingTodoIds.value.includes(todoId)) {
    pendingTodoIds.value = [...pendingTodoIds.value, todoId];
  }
}

function removePendingId(todoId) {
  pendingTodoIds.value = pendingTodoIds.value.filter((id) => id !== todoId);
}

/**
 * Composable providing reactive todo state and server-synchronized CRUD actions.
 */
export function useTodos() {
  const hasStudentName = computed(() => Boolean(studentName.value.trim()));

  function isTodoPending(todoId) {
    return pendingTodoIds.value.includes(todoId);
  }

  /**
   * Updates the active student identifier and loads their todo list from the server.
   */
  async function setStudentName(newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed) return false;

    studentName.value = trimmed;
    localStorage.setItem(STUDENT_STORAGE_KEY, trimmed);
    return fetchTodos();
  }

  /**
   * GET /api/{name} - Loads all todos for the active student from the REST API.
   */
  async function fetchTodos({ silent = false } = {}) {
    if (!hasStudentName.value) return false;

    if (!silent) {
      isLoading.value = true;
    }
    fetchError.value = '';

    try {
      const data = await todoApi.getTodos(studentName.value);
      todos.value = extractTodosList(data);
      return true;
    } catch (error) {
      fetchError.value = error.message || 'Nepodarilo sa načítať úlohy zo servera.';
      showToast(fetchError.value, 'error');
      return false;
    } finally {
      if (!silent) {
        isLoading.value = false;
      }
    }
  }

  /**
   * POST /api/{name} - Creates a new todo on the server and updates local state on success.
   */
  async function addTodo(todoPayload) {
    if (isSubmitting.value || !hasStudentName.value) return null;

    isSubmitting.value = true;
    try {
      const hadMaxTodos = todos.value.length >= 50;
      const createdTodo = await todoApi.createTodo(studentName.value, todoPayload);
      if (!hadMaxTodos && createdTodo && createdTodo.id !== undefined) {
        todos.value = [...todos.value, createdTodo];
      } else {
        await fetchTodos({ silent: true });
      }
      showToast('Úloha bola úspešne vytvorená.', 'success');
      return createdTodo || true;
    } catch (error) {
      showToast(error.message || 'Nepodarilo sa vytvoriť úlohu.', 'error');
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  /**
   * PUT /api/{name}/{todo_id} - Updates an existing todo on the server.
   */
  async function editTodo(todoId, todoPayload) {
    if (isSubmitting.value || !hasStudentName.value) return null;

    isSubmitting.value = true;
    addPendingId(todoId);
    try {
      const updatedTodo = await todoApi.updateTodo(studentName.value, todoId, todoPayload);
      const index = todos.value.findIndex((item) => item.id === todoId);

      if (index !== -1 && updatedTodo && updatedTodo.id !== undefined) {
        const nextTodos = [...todos.value];
        nextTodos[index] = updatedTodo;
        todos.value = nextTodos;
      } else {
        await fetchTodos({ silent: true });
      }

      showToast('Úloha bola úspešne upravená.', 'success');
      return updatedTodo || true;
    } catch (error) {
      showToast(error.message || 'Nepodarilo sa upraviť úlohu.', 'error');
      return null;
    } finally {
      isSubmitting.value = false;
      removePendingId(todoId);
    }
  }

  /**
   * PATCH /api/{name}/{todo_id}/done or /undone - Toggles completion status on the server.
   */
  async function toggleTodoStatus(todo) {
    if (!todo || isTodoPending(todo.id) || !hasStudentName.value) return false;

    addPendingId(todo.id);
    try {
      const updatedTodo = todo.is_finished
        ? await todoApi.markTodoUndone(studentName.value, todo.id)
        : await todoApi.markTodoDone(studentName.value, todo.id);

      const index = todos.value.findIndex((item) => item.id === todo.id);
      if (index !== -1) {
        const nextTodos = [...todos.value];
        nextTodos[index] =
          updatedTodo && updatedTodo.id !== undefined
            ? updatedTodo
            : { ...todo, is_finished: !todo.is_finished };
        todos.value = nextTodos;
      }

      showToast(
        todo.is_finished ? 'Úloha bola znovu otvorená.' : 'Úloha bola označená ako dokončená.',
        'success'
      );
      return true;
    } catch (error) {
      showToast(error.message || 'Nepodarilo sa zmeniť stav úlohy.', 'error');
      return false;
    } finally {
      removePendingId(todo.id);
    }
  }

  /**
   * DELETE /api/{name}/{todo_id} - Deletes a todo from the server and removes it from state.
   */
  async function removeTodo(todoId) {
    if (isTodoPending(todoId) || !hasStudentName.value) return false;

    addPendingId(todoId);
    try {
      await todoApi.deleteTodo(studentName.value, todoId);
      todos.value = todos.value.filter((item) => item.id !== todoId);
      showToast('Úloha bola odstránená.', 'success');
      return true;
    } catch (error) {
      showToast(error.message || 'Nepodarilo sa odstrániť úlohu.', 'error');
      return false;
    } finally {
      removePendingId(todoId);
    }
  }

  /**
   * POST /api/{name}/reset - Resets the student's todos back to the 5 sample tasks.
   */
  async function resetSampleTodos() {
    if (isLoading.value || !hasStudentName.value) return false;

    isLoading.value = true;
    fetchError.value = '';
    try {
      const data = await todoApi.resetTodos(studentName.value);
      todos.value = extractTodosList(data);
      showToast('Ukážkové úlohy boli úspešne obnovené.', 'success');
      return true;
    } catch (error) {
      showToast(error.message || 'Nepodarilo sa obnoviť ukážkové úlohy.', 'error');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    studentName,
    hasStudentName,
    todos,
    isLoading,
    isSubmitting,
    fetchError,
    toast,
    isTodoPending,
    showToast,
    dismissToast,
    setStudentName,
    fetchTodos,
    addTodo,
    editTodo,
    toggleTodoStatus,
    removeTodo,
    resetSampleTodos,
  };
}