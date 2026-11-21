<script setup>
import { computed } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import '@fullcalendar/vue3/skeleton.css';
import '@fullcalendar/vue3/themes/monarch/theme.css';
import '@fullcalendar/vue3/themes/monarch/palettes/blue.css';
import monarchTheme from '@fullcalendar/vue3/themes/monarch';
import dayGridPlugin from '@fullcalendar/vue3/daygrid';
import timeGridPlugin from '@fullcalendar/vue3/timegrid';
import interactionPlugin from '@fullcalendar/vue3/interaction';
import skLocale from '@fullcalendar/vue3/locales/sk';
import { isTodoOverdue } from '@/utils/dateUtils';

const props = defineProps({
  todos: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['select-todo', 'select-range']);

function getTodoColors(todo) {
  if (todo.is_finished) {
    return {
      bg: '#059669',
      border: '#047857',
      cls: 'todo-event-completed',
    };
  }

  if (isTodoOverdue(todo)) {
    return {
      bg: '#dc2626',
      border: '#b91c1c',
      cls: 'todo-event-overdue',
    };
  }

  return {
    bg: '#2563eb',
    border: '#1d4ed8',
    cls: 'todo-event-active',
  };
}

function formatStartTime(dateStr, fallbackDate) {
  const source = dateStr ? new Date(dateStr) : fallbackDate;
  if (!(source instanceof Date) || Number.isNaN(source.getTime())) {
    return '';
  }
  const hours = String(source.getHours()).padStart(2, '0');
  const minutes = String(source.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Force immediate re-render when any task status, title, or date changes
const calendarRenderKey = computed(() =>
  props.todos
    .map((t) => `${t.id}:${t.is_finished ? 1 : 0}:${t.date_from}:${t.date_to}:${t.title}`)
    .join('|')
);

// Map reactive todo items into FullCalendar event objects
const calendarEvents = computed(() =>
  props.todos.map((todo) => {
    const { bg, border, cls } = getTodoColors(todo);

    return {
      id: String(todo.id),
      title: todo.title,
      start: todo.date_from,
      end: todo.date_to,
      backgroundColor: bg,
      borderColor: border,
      textColor: '#ffffff',
      classNames: [cls],
      extendedProps: {
        todo,
      },
    };
  })
);

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, monarchTheme],
  initialView: 'dayGridMonth',
  locale: skLocale,
  firstDay: 1,
  height: 650,
  selectable: true,
  nowIndicator: true,
  eventDisplay: 'block',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: calendarEvents.value,
  eventContent(arg) {
    const todo = arg.event.extendedProps?.todo;
    const { bg, border } = todo ? getTodoColors(todo) : { bg: '#2563eb', border: '#1d4ed8' };
    const textDecoration = todo?.is_finished ? 'line-through' : 'none';
    const opacity = todo?.is_finished ? '0.88' : '1';
    const timeFormatted = formatStartTime(todo?.date_from, arg.event.start);

    const timeBadge = timeFormatted
      ? `<span style="margin-right:5px;font-variant-numeric:tabular-nums;opacity:0.95;flex-shrink:0;">${escapeHtml(timeFormatted)}</span>`
      : '';

    return {
      html: `<div style="display:flex;align-items:center;width:100%;height:100%;box-sizing:border-box;background-color:${bg};border:1px solid ${border};color:#ffffff;opacity:${opacity};text-decoration:${textDecoration};border-radius:6px;padding:3px 7px;font-size:12px;font-weight:600;line-height:1.3;overflow:hidden;">${timeBadge}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(arg.event.title)}</span></div>`,
    };
  },
  eventClick(info) {
    const selectedTodo = info.event.extendedProps?.todo;
    if (selectedTodo) {
      emit('select-todo', selectedTodo);
    }
  },
  select(selectionInfo) {
    emit('select-range', {
      startStr: selectionInfo.startStr,
      endStr: selectionInfo.endStr,
    });
    selectionInfo.view.calendar.unselect();
  },
}));
</script>

<template>
  <section
    aria-label="Kalendár úloh"
    class="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 space-y-4 todo-calendar-wrapper"
  >
    <!-- Color legend and usage hint -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
      <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
          <span class="w-2 h-2 rounded-full bg-blue-600"></span>
          Aktívna
        </span>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200/70">
          <span class="w-2 h-2 rounded-full bg-red-600"></span>
          Po termíne
        </span>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
          <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
          Dokončená
        </span>
      </div>

      <p class="text-xs text-slate-500">
        Kliknutím na úlohu zobrazíte detail, kliknutím na deň vytvoríte novú úlohu.
      </p>
    </div>

    <!-- FullCalendar container -->
    <div class="min-h-162.5">
      <FullCalendar :key="calendarRenderKey" :options="calendarOptions" />
    </div>
  </section>
</template>