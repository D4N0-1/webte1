<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
  },
  todosCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['update:activeTab']);

const navItems = [
  { id: 'list', label: 'Zoznam úloh' },
  { id: 'calendar', label: 'Kalendár' },
  { id: 'about', label: 'O projekte' },
];
</script>

<template>
  <nav aria-label="Hlavná navigácia" class="bg-white border-b border-slate-200">
    <div class="max-w-6xl mx-auto px-4 flex items-center gap-1 sm:gap-4 overflow-x-auto">
      <button
        v-for="item in navItems"
        :key="item.id"
        type="button"
        :aria-current="activeTab === item.id ? 'page' : undefined"
        class="relative py-3.5 px-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer flex items-center gap-2"
        :class="
          activeTab === item.id
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
        "
        @click="emit('update:activeTab', item.id)"
      >
        <span>{{ item.label }}</span>
        <span
          v-if="item.id === 'list'"
          class="px-2 py-0.5 text-xs rounded-full font-medium"
          :class="
            activeTab === 'list'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600'
          "
        >
          {{ todosCount }}
        </span>
      </button>
    </div>
  </nav>
</template>