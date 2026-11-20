const BASE_URL = 'https://wt1zadanie.iolab.sk';

/**
 * Safely builds the API endpoint URL for a given student identifier using encodeURIComponent().
 */
function buildStudentUrl(studentName, suffix = '') {
  if (!studentName || !studentName.trim()) {
    throw new Error('Identifikátor študenta nie je zadaný.');
  }
  const encodedName = encodeURIComponent(studentName.trim());
  return `${BASE_URL}/api/${encodedName}${suffix}`;
}

/**
 * Centralized Fetch API wrapper handling JSON serialization, HTTP errors, and network failures.
 */
async function request(url, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Nepodarilo sa spojiť so serverom. Skontrolujte internetové pripojenie.');
  }

  // Read response as text before parsing to safely handle empty bodies (e.g., HTTP 204)
  const rawText = await response.text();
  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMessage = `Chyba servera (HTTP ${response.status})`;

    if (response.status === 403) {
      throw new Error('Zadaný identifikátor študenta nie je v zozname povolených používateľov (HTTP 403).');
    }
    if (data?.detail) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        // Extract FastAPI validation messages (HTTP 422)
        errorMessage = data.detail.map((err) => err.msg).join(', ');
      }
    } else if (data?.message) {
      errorMessage = data.message;
    }

    throw new Error(errorMessage);
  }

  return data;
}

/**
 * GET /api/{name} - Fetches all todos for the student (generates 5 sample tasks on first access).
 */
export function getTodos(studentName) {
  return request(buildStudentUrl(studentName), {
    method: 'GET',
  });
}

/**
 * GET /api/{name}/{todo_id} - Fetches details of a single todo item.
 */
export function getTodoById(studentName, todoId) {
  const id = encodeURIComponent(todoId);
  return request(buildStudentUrl(studentName, `/${id}`), {
    method: 'GET',
  });
}

/**
 * POST /api/{name} - Creates a new todo item.
 */
export function createTodo(studentName, todoData) {
  return request(buildStudentUrl(studentName), {
    method: 'POST',
    body: JSON.stringify(todoData),
  });
}

/**
 * PUT /api/{name}/{todo_id} - Fully updates an existing todo item (requires full TodoCreate schema).
 */
export function updateTodo(studentName, todoId, todoData) {
  const id = encodeURIComponent(todoId);
  return request(buildStudentUrl(studentName, `/${id}`), {
    method: 'PUT',
    body: JSON.stringify(todoData),
  });
}

/**
 * DELETE /api/{name}/{todo_id} - Deletes an existing todo item.
 */
export function deleteTodo(studentName, todoId) {
  const id = encodeURIComponent(todoId);
  return request(buildStudentUrl(studentName, `/${id}`), {
    method: 'DELETE',
  });
}

/**
 * PATCH /api/{name}/{todo_id}/done - Marks a todo item as completed.
 */
export function markTodoDone(studentName, todoId) {
  const id = encodeURIComponent(todoId);
  return request(buildStudentUrl(studentName, `/${id}/done`), {
    method: 'PATCH',
  });
}

/**
 * PATCH /api/{name}/{todo_id}/undone - Reopens a completed todo item.
 */
export function markTodoUndone(studentName, todoId) {
  const id = encodeURIComponent(todoId);
  return request(buildStudentUrl(studentName, `/${id}/undone`), {
    method: 'PATCH',
  });
}

/**
 * POST /api/{name}/reset - Resets the student's list to the 5 default sample todos.
 */
export function resetTodos(studentName) {
  return request(buildStudentUrl(studentName, '/reset'), {
    method: 'POST',
  });
}