<script setup>
import { ref, onMounted } from 'vue';
import { useTodos } from '@/composables/useTodos';
import AppHeader from '@/components/AppHeader.vue';
import AppNavbar from '@/components/AppNavbar.vue';
import AppFooter from '@/components/AppFooter.vue';
import StudentIdModal from '@/components/StudentIdModal.vue';

const {
  studentName,
  hasStudentName,
  todos,
  isLoading,
  fetchError,
  setStudentName,
  fetchTodos,
} = useTodos();

const activeTab = ref('list');
const isStudentModalOpen = ref(false);
const isFormModalOpen = ref(false);
const isResetModalOpen = ref(false);

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
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <AppHeader
      :student-name="studentName"
      :is-loading="isLoading"
      @change-student="isStudentModalOpen = true"
      @create-todo="isFormModalOpen = true"
      @reset-todos="isResetModalOpen = true"
    />

    <AppNavbar
      v-model:active-tab="activeTab"
      :todos-count="todos.length"
    />

    <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
      <section v-if="activeTab === 'list'" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-lg font-bold text-slate-800">Zoznam úloh</h2>
        <p class="text-sm text-slate-500 mt-1">
          Počet načítaných úloh: {{ todos.length }} (komponent zoznamu bude doplnený v ďalších krokoch).
        </p>
      </section>

      <section v-else-if="activeTab === 'calendar'" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-lg font-bold text-slate-800">Kalendár úloh</h2>
        <p class="text-sm text-slate-500 mt-1">
          Zobrazenie kalendára FullCalendar bude integrované v Kroku 11.
        </p>
      </section>

      <section v-else-if="activeTab === 'about'" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 class="text-lg font-bold text-slate-800">O projekte</h2>
        <p class="text-sm text-slate-600 mt-2 leading-relaxed">
          Webová aplikácia <strong>Môj TODO List</strong> slúži na správu osobných úloh prepojenú s REST API
          a interaktívnym kalendárom.
        </p>
      </section>
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
  </div>
</template>