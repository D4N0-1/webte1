<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: 'Potvrdenie akcie',
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: 'Potvrdiť',
  },
  cancelText: {
    type: String,
    default: 'Zrušiť',
  },
  variant: {
    type: String,
    default: 'danger', // 'danger' | 'warning'
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['confirm', 'close']);

function handleClose() {
  if (!props.isSubmitting) {
    emit('close');
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title"
    @click.self="handleClose"
    @keydown.esc="handleClose"
  >
    <div class="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 id="confirm-modal-title" class="text-base font-bold text-slate-900">
          {{ title }}
        </h2>
        <button
          type="button"
          :disabled="isSubmitting"
          aria-label="Zavrieť okno"
          class="text-slate-400 hover:text-slate-600 disabled:opacity-50 text-xl leading-none cursor-pointer"
          @click="handleClose"
        >
          &times;
        </button>
      </div>

      <div class="p-6">
        <p class="text-sm text-slate-600 leading-relaxed">
          {{ message }}
        </p>

        <div class="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer transition-colors"
            @click="handleClose"
          >
            {{ cancelText }}
          </button>

          <button
            type="button"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors"
            :class="
              variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-red-600 hover:bg-red-500'
            "
            @click="emit('confirm')"
          >
            {{ isSubmitting ? 'Spracúvam...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>