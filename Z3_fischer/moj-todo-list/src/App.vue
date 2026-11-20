<script setup>
import { ref, onMounted } from 'vue';
import { useTodos } from '@/composables/useTodos';
import AppHeader from '@/components/AppHeader.vue';
import AppNavbar from '@/components/AppNavbar.vue';
import AppFooter from '@/components/AppFooter.vue';
import StudentIdModal from '@/components/StudentIdModal.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const {
  studentName,
  hasStudentName,
  todos,
  isLoading,
  fetchError,
  toast,
  dismissToast,
  setStudentName,
  fetchTodos,
  resetSampleTodos,
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

async function handleResetConfirm() {
  const success = await resetSampleTodos();
  if (success) {
    isResetModalOpen.value = false;
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
        <section v-if="activeTab === 'list'" class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 class="text-lg font-bold text-slate-800">Zoznam úloh</h2>
          <p class="text-sm text-slate-500 mt-1">
            Počet načítaných úloh: {{ todos.length }} (komponent zoznamu bude doplnený v ďalšom kroku).
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

    <ToastNotification :toast="toast" @dismiss="dismissToast" />
  </div>
</template>