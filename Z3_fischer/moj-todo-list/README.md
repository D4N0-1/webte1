# Môj TODO List

Responzívna webová aplikácia typu Single Page Application (SPA) na správu osobných úloh vytvorená pomocou **Vue 3**, **Tailwind CSS** a **FullCalendar v7**, prepojená s **Student TODO REST API** v rámci predmetu **Webové technológie 1 (WEBTE1)**.

## Hlavné funkcie

- **Kompletné CRUD operácie**: Vytváranie, načítanie, úprava, prepínanie stavu dokončenia, odstraňovanie a obnovenie ukážkových úloh cez REST API.
- **Interaktívny kalendár**: Mesačný, týždenný a denný pohľad postavený na knižnici FullCalendar v7 s farebným rozlíšením stavu úloh (aktívna, po termíne, dokončená), zobrazením detailu po kliknutí na úlohu a vytváraním úloh kliknutím na deň alebo časový interval.
- **Filtrovanie, vyhľadávanie a zoradenie**: Prepínanie zobrazenia podľa stavu (*Všetky*, *Nedokončené*, *Dokončené*), vyhľadávanie podľa názvu v reálnom čase a chronologické zoradenie podľa začiatku alebo konca úlohy.
- **Klientská validácia a odolnosť voči chybám**: Kontrola povinných polí, dĺžkových limitov a časového intervalu (`date_to >= date_from`), pričom pri chybe siete zostávajú rozpracované údaje vo formulári zachované.
- **Responzívny dizajn**: Rozhranie prispôsobené pre mobilné zariadenia od šírky `360 px` až po veľké monitory.

## Použité technológie

- **Framework**: Vue 3 (`<script setup>`, Composition API)
- **Build nástroj**: Vite
- **Štýlovanie**: Tailwind CSS
- **Kalendár**: FullCalendar v7 (`@fullcalendar/vue3`)
- **HTTP klient**: Natívne Fetch API

## Štruktúra projektu

```text
src/
├── components/       # UI komponenty, zoznam, filtre, kalendár a modálne okná
├── composables/      # Zdieľaný reaktívny stav a CRUD akcie (useTodos.js)
├── services/         # Komunikačná vrstva pre REST API s ošetrením chýb (todoApi.js)
├── utils/            # Pomocné funkcie na formátovanie dátumov (ISO 8601) a validáciu
├── App.vue           # Koreňový komponent aplikácie a správa zobrazení
├── main.js           # Vstupný bod Vue aplikácie
└── style.css         # Konfigurácia Tailwind CSS a responzívne úpravy kalendára
```

## Spustenie projektu

1. **Inštalácia závislostí:**
   ```bash
   npm install
   ```

2. **Spustenie vývojového servera:**
   ```bash
   npm run dev
   ```

3. **Vytvorenie produkčnej verzie:**
   ```bash
   npm run build
   ```
