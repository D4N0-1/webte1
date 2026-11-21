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

// Map reactive todo items into FullCalendar event objects
const calendarEvents = computed(() =>
  props.todos.map((todo) => {
    const overdue = isTodoOverdue(todo);

    let backgroundColor = '#2563eb'; // Active (blue)
    let borderColor = '#1d4ed8';

    if (todo.is_finished) {
      backgroundColor = '#059669'; // Completed (emerald)
      borderColor = '#047857';
    } else if (overdue) {
      backgroundColor = '#dc2626'; // Overdue (red)
      borderColor = '#b91c1c';
    }

    return {
      id: String(todo.id),
      title: todo.title,
      start: todo.date_from,
      end: todo.date_to,
      backgroundColor,
      borderColor,
      textColor: '#ffffff',
      classNames: todo.is_finished ? ['opacity-80', 'line-through'] : [],
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
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: calendarEvents.value,
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
    class="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6 space-y-4"
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
      <FullCalendar :options="calendarOptions" />
    </div>
  </section>
</template>