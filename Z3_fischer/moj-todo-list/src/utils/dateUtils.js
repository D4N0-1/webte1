/**
 * Converts a local datetime input string (YYYY-MM-DDTHH:mm) into an ISO 8601 string for the API.
 */
export function toApiIsoString(localDateTimeStr) {
  if (!localDateTimeStr) return '';
  const date = new Date(localDateTimeStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

/**
 * Converts an API ISO 8601 string into the local format required by <input type="datetime-local">.
 */
export function toDateTimeLocalValue(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats an ISO 8601 date string into a human-readable Slovak local date and time.
 */
export function formatDisplayDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formats a start and end ISO date interval cleanly for display in cards and modals.
 */
export function formatDateRange(dateFromIso, dateToIso) {
  const start = formatDisplayDateTime(dateFromIso);
  const end = formatDisplayDateTime(dateToIso);
  if (!start || !end) return '';
  return `${start} – ${end}`;
}

/**
 * Checks whether a todo item is past its deadline and not yet finished.
 */
export function isTodoOverdue(todo) {
  if (!todo || todo.is_finished || !todo.date_to) return false;
  const deadline = new Date(todo.date_to);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline < new Date();
}

/**
 * Generates default start and end datetime-local values (e.g., when clicking a calendar date).
 */
export function buildDefaultRangeFromDate(dateInput, endInput = null) {
  const startDate = new Date(dateInput);
  if (Number.isNaN(startDate.getTime())) {
    return { date_from: '', date_to: '' };
  }

  // If a date without specific time was clicked (all-day slot), default to 09:00 - 10:00
  if (typeof dateInput === 'string' && !dateInput.includes('T')) {
    startDate.setHours(9, 0, 0, 0);
  }

  let endDate;
  if (endInput) {
    endDate = new Date(endInput);
    // FullCalendar exclusive all-day end dates end at 00:00 of the next day; adjust to 10:00
    if (typeof endInput === 'string' && !endInput.includes('T')) {
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(10, 0, 0, 0);
    }
  } else {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  return {
    date_from: toDateTimeLocalValue(startDate.toISOString()),
    date_to: toDateTimeLocalValue(endDate.toISOString()),
  };
}