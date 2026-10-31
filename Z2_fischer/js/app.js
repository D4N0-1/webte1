/**
 * WEBTE1 - Zadanie č. 2: Obedové menu v okolí fakulty
 * Autor: Daniel Fischer
 * Výhradne client-side spracovanie bez JS frameworkov
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Adresa CORS proxy servera (doplní sa po oznámení na cvičení)
const PROXY_URL = ''; 

// Kľúč pre ukladanie dát do localStorage
const CACHE_KEY = 'webte1_menu_cache';

// Konfigurácia reštaurácií
const RESTAURANTS = [
    {
        id: 'drag',
        name: 'Reštaurácia DRAG',
        url: 'https://www.restauracia-drag.sk/denne-menu',
        localUrl: 'data/Drag.html',
        parse: parseDrag
    },
    {
        id: 'nase-hospoda',
        name: 'Naše Hospoda Karloveská',
        url: 'https://nasehospoda-karloveska.sk/#menu',
        localUrl: 'data/Nase_hospoda.html',
        parse: parseNaseHospoda
    },
    {
        id: 'riviera',
        name: 'Reštaurácia Riviera',
        url: 'https://restauraciariviera.sk/obedove-menu/',
        localUrl: 'data/Riviera.html',
        parse: parseRiviera
    }
];

// Názvy dní v týždni
const DAY_NAMES = {
    1: 'Pondelok',
    2: 'Utorok',
    3: 'Streda',
    4: 'Štvrtok',
    5: 'Piatok',
    'all': 'Celý týždeň'
};

// Globálny stav aplikácie
const state = {
    restaurantsData: [],
    useLocalData: true,
    selectedDay: getInitialDay(), // 1 až 5 alebo 'all'
    visibleRestaurants: new Set(RESTAURANTS.map(r => r.id))
};

/**
 * Zistí aktuálny deň v týždni (1 = Pondelok ... 5 = Piatok).
 * Cez víkend (So/Ne) vracia 1 (Pondelok).
 */
function getInitialDay() {
    const day = new Date().getDay(); // 0 = Nedeľa, 1 = Pondelok ... 6 = Sobota
    if (day >= 1 && day <= 5) {
        return day;
    }
    return 1; // Cez víkend predvolene Pondelok
}

/**
 * Hlavná inicializačná funkcia
 */
function initApp() {
    setupEventListeners();
    renderFiltersUI();
    updateTabsUI();
    
    const sourceToggle = document.getElementById('data-source-toggle');
    if (sourceToggle) {
        sourceToggle.checked = state.useLocalData;
    }

    const hasValidCache = loadFromCache();
    if (hasValidCache) {
        renderMenuUI();
    } else {
        loadAllRestaurantsData();
    }
}

/**
 * Vracia dnešný dátum vo formáte YYYY-MM-DD
 */
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Načítanie dát z localStorage
 */
function loadFromCache() {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (!cachedRaw) return false;

    try {
        const cached = JSON.parse(cachedRaw);
        if (cached.date === getTodayString() && Array.isArray(cached.restaurants) && cached.restaurants.length > 0) {
            state.restaurantsData = cached.restaurants;
            console.log('Dáta boli načítané z localStorage.');
            return true;
        }
    } catch (e) {
        console.warn('Chyba pri čítaní z localStorage:', e);
    }
    return false;
}

/**
 * Uloženie spracovaných dát do localStorage
 */
function saveToCache(data) {
    const cacheObject = {
        date: getTodayString(),
        restaurants: data
    };
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
        console.log('Dáta uložené do localStorage.');
    } catch (e) {
        console.warn('Chyba pri ukladaní do localStorage:', e);
    }
}

/**
 * Nastavenie poslucháčov udalostí UI
 */
function setupEventListeners() {
    const btnRefresh = document.getElementById('btn-refresh');
    const btnClearCache = document.getElementById('btn-clear-cache');
    const sourceToggle = document.getElementById('data-source-toggle');
    const dayTabs = document.getElementById('day-tabs');

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => loadAllRestaurantsData(true));
    }

    if (btnClearCache) {
        btnClearCache.addEventListener('click', () => {
            localStorage.removeItem(CACHE_KEY);
            state.restaurantsData = [];
            showLoading(false);
            const container = document.getElementById('menu-container');
            if (container) {
                container.innerHTML = '<p class="text-slate-500 text-center col-span-full py-8">Uložené dáta boli vymazané z localStorage. Kliknite na "Aktualizovať menu" pre nové načítanie.</p>';
            }
            alert('Uložené dáta boli vymazané z localStorage.');
        });
    }

    if (sourceToggle) {
        sourceToggle.addEventListener('change', (e) => {
            state.useLocalData = e.target.checked;
            loadAllRestaurantsData(true);
        });
    }

    // Prepínanie dní v týždni
    if (dayTabs) {
        dayTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.day-tab');
            if (!btn) return;

            const dayVal = btn.dataset.day;
            state.selectedDay = dayVal === 'all' ? 'all' : parseInt(dayVal, 10);
            updateTabsUI();
            renderMenuUI();
        });
    }
}

/**
 * Generovanie filtrov reštaurácií
 */
function renderFiltersUI() {
    const container = document.getElementById('restaurant-filters');
    if (!container) return;

    container.innerHTML = RESTAURANTS.map(r => `
        <label class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" value="${r.id}" checked class="restaurant-filter-cb rounded text-blue-600 focus:ring-blue-500">
            <span>${r.name}</span>
        </label>
    `).join('');

    container.querySelectorAll('.restaurant-filter-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.visibleRestaurants.add(e.target.value);
            } else {
                state.visibleRestaurants.delete(e.target.value);
            }
            renderMenuUI();
        });
    });
}

/**
 * Aktualizácia aktívnych záložiek dní
 */
function updateTabsUI() {
    const tabs = document.querySelectorAll('.day-tab');
    const dayDisplay = document.getElementById('current-day-display');

    tabs.forEach(tab => {
        const val = tab.dataset.day;
        const isSelected = (val === 'all' && state.selectedDay === 'all') || (parseInt(val, 10) === state.selectedDay);

        if (isSelected) {
            tab.className = 'day-tab active border-b-2 border-blue-600 text-blue-600 font-semibold px-4 py-2 text-sm transition-colors';
        } else {
            tab.className = 'day-tab border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-4 py-2 text-sm transition-colors';
        }
    });

    if (dayDisplay) {
        dayDisplay.textContent = DAY_NAMES[state.selectedDay] || 'Dnes';
    }
}

/**
 * Načítanie dát zo všetkých reštaurácií
 */
async function loadAllRestaurantsData(forceRefresh = false) {
    if (!forceRefresh && loadFromCache()) {
        renderMenuUI();
        return;
    }

    showLoading(true);
    state.restaurantsData = [];

    const fetchPromises = RESTAURANTS.map(async (restaurant) => {
        try {
            const htmlString = await fetchRestaurantHtml(restaurant, state.useLocalData);
            const menuItems = restaurant.parse(htmlString);

            return {
                id: restaurant.id,
                name: restaurant.name,
                url: restaurant.url,
                lastUpdated: new Date().toLocaleString('sk-SK'),
                error: null,
                menu: menuItems
            };
        } catch (error) {
            console.error(`Chyba pri načítaní reštaurácie ${restaurant.name}:`, error);
            return {
                id: restaurant.id,
                name: restaurant.name,
                url: restaurant.url,
                lastUpdated: new Date().toLocaleString('sk-SK'),
                error: state.useLocalData 
                    ? 'Nepodarilo sa načítať lokálny HTML súbor.' 
                    : 'CORS proxy adresa nie je nastavená alebo je server nedostupný.',
                menu: []
            };
        }
    });

    state.restaurantsData = await Promise.all(fetchPromises);
    saveToCache(state.restaurantsData);
    showLoading(false);
    renderMenuUI();
}

/**
 * Asynchrónne stiahnutie HTML
 */
async function fetchRestaurantHtml(restaurant, useLocal) {
    if (!useLocal && !PROXY_URL) {
        throw new Error('PROXY_URL nie je definovaná.');
    }

    const targetUrl = useLocal ? restaurant.localUrl : `${PROXY_URL}${restaurant.url}`;
    const response = await fetch(targetUrl);

    if (!response.ok) {
        throw new Error(`HTTP chyba status: ${response.status}`);
    }

    return await response.text();
}

/**
 * Zobrazenie / skrytie spinnera
 */
function showLoading(isLoading) {
    const spinner = document.getElementById('loading-indicator');
    const container = document.getElementById('menu-container');

    if (spinner) {
        if (isLoading) spinner.classList.remove('hidden');
        else spinner.classList.add('hidden');
    }

    if (container && isLoading) {
        container.innerHTML = '';
    }
}

/**
 * Main render function for restaurant menu cards
 */
function renderMenuUI() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    // Filter by checked restaurant checkboxes
    const activeRestaurants = state.restaurantsData.filter(r => state.visibleRestaurants.has(r.id));

    if (activeRestaurants.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center col-span-full py-8">Žiadne reštaurácie nie sú zvolené vo filtri.</p>';
        return;
    }

    container.innerHTML = activeRestaurants.map(restaurant => renderRestaurantCard(restaurant)).join('');
}

/**
 * Vykreslenie karty pre jednu reštauráciu
 */
function renderRestaurantCard(restaurant) {
    // Ak nastala chyba pri sťahovaní
    if (restaurant.error) {
        return `
            <article class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <header class="p-4 bg-slate-100 border-b border-slate-200">
                    <h3 class="font-bold text-slate-900 text-lg">
                        <a href="${restaurant.url}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                            ${restaurant.name} ↗
                        </a>
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Posledná aktualizácia: ${restaurant.lastUpdated}</p>
                </header>
                <div class="p-4 flex-grow flex items-center justify-center">
                    <div class="bg-red-50 text-red-700 p-4 rounded-lg text-sm w-full border border-red-200">
                        <p class="font-semibold mb-1">Menu nie je dostupné</p>
                        <p class="text-xs text-red-600">${restaurant.error}</p>
                    </div>
                </div>
            </article>
        `;
    }

    // Filtrácia jedál podľa vybraného dňa
    let filteredMenu = restaurant.menu;
    if (state.selectedDay !== 'all') {
        filteredMenu = restaurant.menu.filter(item => item.day === state.selectedDay);
    }

    // Ak pre daný deň chýba menu
    if (filteredMenu.length === 0) {
        return `
            <article class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <header class="p-4 bg-slate-100 border-b border-slate-200">
                    <h3 class="font-bold text-slate-900 text-lg">
                        <a href="${restaurant.url}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                            ${restaurant.name} ↗
                        </a>
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Posledná aktualizácia: ${restaurant.lastUpdated}</p>
                </header>
                <div class="p-6 flex-grow flex items-center justify-center">
                    <p class="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200 w-full text-center">
                        Menu na tento deň nie je k dispozícii.
                    </p>
                </div>
            </article>
        `;
    }

    // Zoskupenie jedál po dňoch (ak je zvolený "Celý týždeň")
    const groupedByDay = {};
    filteredMenu.forEach(item => {
        if (!groupedByDay[item.day]) groupedByDay[item.day] = [];
        groupedByDay[item.day].push(item);
    });

    const menuContentHtml = Object.keys(groupedByDay).map(dayKey => {
        const dayItems = groupedByDay[dayKey];
        const dayTitle = state.selectedDay === 'all' ? `<h4 class="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 border-b pb-1">${DAY_NAMES[dayKey]}</h4>` : '';

        const itemsHtml = dayItems.map(item => {
            const isSoup = item.type === 'soup';
            const cardClass = isSoup ? 'dish-soup p-2.5 rounded-md my-1.5' : 'dish-main p-2.5 bg-slate-50 rounded-md my-1.5';
            const badge = isSoup ? '<span class="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-1.5">Polievka</span>' : '';

            return `
                <div class="${cardClass} text-xs leading-relaxed">
                    <div class="flex justify-between items-start gap-2">
                        <div class="font-medium text-slate-800">
                            ${badge}${item.name}
                        </div>
                        <div class="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs whitespace-nowrap">
                            ${item.price}
                        </div>
                    </div>
                    <div class="flex gap-2 text-[11px] text-slate-500 mt-1">
                        ${item.weight ? `<span>${item.weight}</span>` : ''}
                        ${item.allergens ? `<span>Alergény: ${item.allergens}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="mb-4 last:mb-0">${dayTitle}${itemsHtml}</div>`;
    }).join('');

    return `
        <article class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <header class="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-slate-900 text-lg">
                        <a href="${restaurant.url}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                            ${restaurant.name} ↗
                        </a>
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Posledná aktualizácia: ${restaurant.lastUpdated}</p>
                </div>
            </header>
            <div class="p-4 flex-grow overflow-y-auto max-h-[500px]">
                ${menuContentHtml}
            </div>
        </article>
    `;
}

/* ==========================================================================
   PARSER LOGIKA (Drag, Naše Hospoda, Riviera)
   ========================================================================== */

function parseDrag(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const menuItems = [];

    const daysMap = [
        { id: 'pondelok', num: 1 },
        { id: 'utorok', num: 2 },
        { id: 'streda', num: 3 },
        { id: 'stvrtok', num: 4 },
        { id: 'piatok', num: 5 }
    ];

    daysMap.forEach(dayInfo => {
        const pane = doc.querySelector(`#${dayInfo.id}`);
        if (!pane) return;

        const paneText = pane.textContent || '';
        const soupMatch = paneText.match(/POLIEVKA[\s\S]*?(0,[\d]+\s*l[^\n<]+)/i);
        if (soupMatch && soupMatch[1]) {
            const rawSoup = soupMatch[1].trim();
            const allergensMatch = rawSoup.match(/\/([\d,]+)\//);
            const weightMatch = rawSoup.match(/^([\d,]+\s*l)/i);

            menuItems.push({
                day: dayInfo.num,
                type: 'soup',
                name: rawSoup.replace(weightMatch ? weightMatch[0] : '', '').replace(allergensMatch ? allergensMatch[0] : '', '').trim(),
                price: 'V cene menu',
                allergens: allergensMatch ? allergensMatch[1] : '',
                weight: weightMatch ? weightMatch[1] : '0.3l'
            });
        }

        const rows = pane.querySelectorAll('table tr');
        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            if (cols.length < 2) return;

            const nameCol = cols[0].textContent.trim();
            const priceCol = cols[1].textContent.trim();

            if (!nameCol || nameCol.length < 3) return;

            const weightMatch = nameCol.match(/^([\d\/\g\s]+)/i);
            const allergensMatch = nameCol.match(/\/([\d,]+)\//);

            let cleanName = nameCol;
            if (weightMatch) cleanName = cleanName.replace(weightMatch[0], '');
            if (allergensMatch) cleanName = cleanName.replace(allergensMatch[0], '');

            menuItems.push({
                day: dayInfo.num,
                type: 'main',
                name: cleanName.trim(),
                price: priceCol || 'N/A',
                allergens: allergensMatch ? allergensMatch[1] : '',
                weight: weightMatch ? weightMatch[1].trim() : ''
            });
        });
    });

    return menuItems;
}

function parseNaseHospoda(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const menuItems = [];

    const dayNameMap = {
        'pondelok': 1,
        'utorok': 2,
        'streda': 3,
        'štvrtok': 4,
        'piatok': 5,
        'sobota': 6,
        'nedeľa': 7
    };

    const articles = doc.querySelectorAll('#menu article');
    articles.forEach(article => {
        const dayHeader = article.querySelector('.tracking-wider')?.textContent.trim().toLowerCase();
        const dateText = article.querySelector('.font-bold.text-white')?.textContent.trim() || '';
        
        const dayNum = dayNameMap[dayHeader];
        if (!dayNum || dayNum > 5) return;

        const itemRows = article.querySelectorAll('.divide-y > div');
        itemRows.forEach(row => {
            const priceEl = row.querySelector('.shrink-0');
            const mainCol = row.querySelector('.min-w-0');
            if (!mainCol) return;

            const titleEl = mainCol.querySelector('.font-bold.text-hospoda-cream');
            const detailsEl = mainCol.querySelector('.mt-1');

            if (!titleEl) return;

            const weightSpan = titleEl.querySelector('.text-zinc-500, .text-hospoda-cream');
            const weight = weightSpan ? weightSpan.textContent.trim() : '';

            const titleClone = titleEl.cloneNode(true);
            const spans = titleClone.querySelectorAll('span');
            spans.forEach(s => s.remove());
            const cleanName = titleClone.textContent.trim();

            const detailsText = detailsEl ? detailsEl.textContent : '';
            const isSoup = detailsText.includes('Polievka');
            const allergensMatch = detailsText.match(/Alergény:\s*([\d,]+)/i);

            menuItems.push({
                day: dayNum,
                date: dateText,
                type: isSoup ? 'soup' : 'main',
                name: cleanName,
                price: priceEl ? priceEl.textContent.trim() : 'N/A',
                allergens: allergensMatch ? allergensMatch[1] : '',
                weight: weight
            });
        });
    });

    return menuItems;
}

function parseRiviera(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const menuItems = [];

    const rawContainer = doc.querySelector('.raw-menu-content') || doc.body;
    const paragraphs = rawContainer.querySelectorAll('p');

    let currentDay = null;

    paragraphs.forEach(p => {
        const text = p.textContent.trim();

        if (text.includes('PONDELOK')) currentDay = 1;
        else if (text.includes('UTOROK')) currentDay = 2;
        else if (text.includes('STREDA')) currentDay = 3;
        else if (text.includes('ŠTVRTOK')) currentDay = 4;
        else if (text.includes('PIATOK')) currentDay = 5;

        if (!currentDay) return;

        const lines = p.innerHTML.split(/<br\s*\/?>/i);
        lines.forEach(line => {
            const tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = line;
            const lineText = tmpDiv.textContent.trim();

            if (!lineText || lineText.includes('PONDELOK') || lineText.includes('UTOROK') || lineText.includes('STREDA') || lineText.includes('ŠTVRTOK') || lineText.includes('PIATOK')) {
                return;
            }

            const priceMatch = lineText.match(/(\d+[\.,]\d+\s*€)/);
            const price = priceMatch ? priceMatch[1] : 'V cene menu';

            const allergensMatch = lineText.match(/A([\d,]+)/i);
            const allergens = allergensMatch ? allergensMatch[1] : '';

            const weightMatch = lineText.match(/(\d+\s*g|\d+[\.,]\d+\s*l)/i);
            const weight = weightMatch ? weightMatch[1] : '';

            const isSoup = lineText.toLowerCase().includes('polievka') || weight.includes('l');

            let cleanName = lineText
                .replace(/(\d+[\.,]\d+\s*€)/g, '')
                .replace(/A[\d,]+/gi, '')
                .replace(/(\d+\s*g|\d+[\.,]\d+\s*l)/gi, '')
                .replace(/[|]/g, '')
                .trim();

            if (cleanName.length > 3) {
                menuItems.push({
                    day: currentDay,
                    type: isSoup ? 'soup' : 'main',
                    name: cleanName,
                    price: price,
                    allergens: allergens,
                    weight: weight
                });
            }
        });
    });

    return menuItems;
}