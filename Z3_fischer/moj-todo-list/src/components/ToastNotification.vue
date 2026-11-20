<script setup>
defineProps({
  toast: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['dismiss']);

const variantClasses = {
  success: 'bg-emerald-900 border-emerald-700 text-emerald-50',
  error: 'bg-red-900 border-red-700 text-red-50',
  info: 'bg-slate-900 border-slate-700 text-slate-50',
};
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="toast"
      :key="toast.id"
      role="status"
      aria-live="polite"
      class="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] rounded-xl border px-4 py-3 shadow-lg flex items-start gap-3"
      :class="variantClasses[toast.type] || variantClasses.info"
    >
      <!-- Status icon -->
      <svg
        v-if="toast.type === 'success'"
        class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>

      <svg
        v-else-if="toast.type === 'error'"
        class="w-5 h-5 text-red-400 shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
      </svg>

      <p class="text-sm font-medium leading-snug flex-1">
        {{ toast.message }}
      </p>

      <button
        type="button"
        aria-label="Zavrieť oznámenie"
        class="text-white/70 hover:text-white text-lg leading-none cursor-pointer"
        @click="emit('dismiss')"
      >
        &times;
      </button>
    </div>
  </Transition>
</template>