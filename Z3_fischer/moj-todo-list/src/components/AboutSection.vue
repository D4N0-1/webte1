<script setup>
defineProps({
  studentName: {
    type: String,
    default: '',
  },
});

const technologies = [
  {
    name: 'Vue 3 (Composition API)',
    description: 'Komponentová architektúra so zdieľaným reaktívnym stavom (Single Source of Truth).',
  },
  {
    name: 'Tailwind CSS',
    description: 'Responzívny dizajn prispôsobený pre mobilné zariadenia (od 360 px) aj desktop.',
  },
  {
    name: 'FullCalendar v7',
    description: 'Interaktívny mesačný, týždenný a denný kalendár prepojený s úlohami.',
  },
  {
    name: 'Fetch API (REST)',
    description: 'Asynchrónna komunikácia so serverom wt1zadanie.iolab.sk s ošetrením chýb.',
  },
];

const endpoints = [
  { method: 'GET', path: '/api/{name}', label: 'Načítanie zoznamu úloh študenta' },
  { method: 'POST', path: '/api/{name}', label: 'Vytvorenie novej úlohy' },
  { method: 'PUT', path: '/api/{name}/{todo_id}', label: 'Úprava existujúcej úlohy' },
  { method: 'PATCH', path: '/api/{name}/{todo_id}/done', label: 'Označenie úlohy ako dokončenej' },
  { method: 'PATCH', path: '/api/{name}/{todo_id}/undone', label: 'Znovuotvorenie dokončenej úlohy' },
  { method: 'DELETE', path: '/api/{name}/{todo_id}', label: 'Trvalé odstránenie úlohy' },
  { method: 'POST', path: '/api/{name}/reset', label: 'Obnovenie 5 ukážkových úloh' },
];
</script>

<template>
  <section
    aria-label="O projekte"
    class="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-6"
  >
    <!-- Header -->
    <div class="border-b border-slate-100 pb-5">
      <h2 class="text-xl font-bold text-slate-900">
        O aplikácii Môj TODO List
      </h2>
      <p class="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">
        Webová aplikácia typu Single Page Application (SPA) vytvorená v rámci predmetu
        <strong>Webové technológie 1 (WEBTE1)</strong>. Umožňuje kompletnú správu osobných úloh
        s okamžitou synchronizáciou medzi zoznamom a interaktívnym kalendárom.
      </p>
    </div>

    <!-- Technology Stack -->
    <div>
      <h3 class="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
        Použité technológie
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div
          v-for="tech in technologies"
          :key="tech.name"
          class="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4"
        >
          <p class="text-sm font-bold text-slate-900">{{ tech.name }}</p>
          <p class="mt-1 text-xs text-slate-600 leading-relaxed">{{ tech.description }}</p>
        </div>
      </div>
    </div>

    <!-- Key Features & Security -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      <div class="rounded-lg border border-slate-200/80 p-4 space-y-2">
        <h3 class="text-sm font-bold text-slate-900">Hlavné funkcie</h3>
        <ul class="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>Filtrovanie úloh podľa stavu (Všetky, Nedokončené, Dokončené).</li>
          <li>Vyhľadávanie podľa názvu a zoradenie podľa začiatku alebo konca.</li>
          <li>Vytváranie úloh kliknutím na deň alebo časový úsek v kalendári.</li>
          <li>Automatické zvýraznenie nesplnených úloh po termíne.</li>
        </ul>
      </div>

      <div class="rounded-lg border border-slate-200/80 p-4 space-y-2">
        <h3 class="text-sm font-bold text-slate-900">Validácia a bezpečnosť</h3>
        <ul class="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>Klientská validácia povinných polí, dĺžok reťazcov a intervalu dátumov.</li>
          <li>Ochrana proti duplicitnému odoslaniu formulára počas sieťovej operácie.</li>
          <li>Bezpečné vykresľovanie používateľských vstupov bez použitia <code class="font-mono">v-html</code>.</li>
          <li>Kódovanie mena študenta v URL cez <code class="font-mono">encodeURIComponent()</code>.</li>
        </ul>
      </div>
    </div>

    <!-- Footer metadata -->
    <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
      <span>Aktívny identifikátor: <strong class="text-slate-700">{{ studentName || 'nenastavený' }}</strong></span>
      <span>WEBTE1 &middot; FEI STU &middot; 2026</span>
    </div>
  </section>
</template>