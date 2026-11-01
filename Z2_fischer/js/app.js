/**
 * WEBTE1 - Zadanie č. 2: Obedové menu v okolí fakulty
 * Client-side spracovanie menu s využitím knižnice jQuery v4.0
 */

$(function () {
    initApp();
});

// Adresa CORS proxy servera (doplní sa po oznámení na cvičení)
const PROXY_URL = ''; 

// Kľúč keše pre automatické obnovenie dát v localStorage
const CACHE_KEY = 'menu_cache';

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
        id: 'ostravarna',
        name: 'Ostravarna Amélia',
        url: 'https://ameliarestaurant.sk/#menu',
        localUrl: 'data/Ostravarna.html',
        parse: parseOstravarna
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
    selectedDay: getInitialDay(),
    visibleRestaurants: new Set(RESTAURANTS.map(r => r.id))
};

/**
 * Vyčistenie alergénov od prebytočných čiarok, lomítok a medzier na konci/začiatku
 */
function cleanAllergens(raw) {
    if (!raw) return '';
    let str = String(raw).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    str = str.replace(/[,/\-\.\s]+$/g, '').replace(/^[,/\-\.\s]+/g, '').trim();
    str = str.replace(/\s*,\s*/g, ', ').replace(/\s*\/\s*/g, ' / ');
    return str;
}

/**
 * Pomocná funkcia pre jednotný formát cien v EUR na jednom riadku
 */
function formatPrice(rawPrice, isSoup) {
    if (!rawPrice) return isSoup ? 'V cene menu' : 'N/A';
    
    const str = String(rawPrice).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (str.toLowerCase().includes('v cene')) {
        return 'V cene menu';
    }

    const match = str.match(/(\d+[\.,]\d+|\d+)/);
    if (match) {
        const num = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(num) && num > 0) {
            return num.toFixed(2).replace('.', ',') + ' EUR';
        }
    }

    return isSoup ? 'V cene menu' : 'N/A';
}

function getInitialDay() {
    const day = new Date().getDay();
    if (day >= 1 && day <= 5) return day;
    return 1;
}

function initApp() {
    setupEventListeners();
    renderFiltersUI();
    updateTabsUI();
    
    $('#data-source-toggle').prop('checked', state.useLocalData);

    const hasValidCache = loadFromCache();
    if (hasValidCache) {
        renderMenuUI();
    } else {
        loadAllRestaurantsData();
    }
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function loadFromCache() {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (!cachedRaw) return false;

    try {
        const cached = JSON.parse(cachedRaw);
        if (cached.date === getTodayString() && Array.isArray(cached.restaurants) && cached.restaurants.length > 0) {
            state.restaurantsData = cached.restaurants;
            return true;
        }
    } catch (e) {
        console.warn('Chyba pri čítaní z localStorage:', e);
    }
    return false;
}

function saveToCache(data) {
    const cacheObject = {
        date: getTodayString(),
        restaurants: data
    };
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    } catch (e) {
        console.warn('Chyba pri ukladaní do localStorage:', e);
    }
}

function setupEventListeners() {
    $('#btn-refresh').off('click').on('click', function () {
        loadAllRestaurantsData(true);
    });

    $('#btn-clear-cache').off('click').on('click', function () {
        localStorage.removeItem(CACHE_KEY);
        state.restaurantsData = [];
        showLoading(false);
        $('#menu-container').html('<p class="text-slate-500 text-center col-span-full py-8">Uložené dáta boli vymazané z lokálneho úložiska. Kliknite na "Aktualizovať menu" pre nové načítanie.</p>');
        alert('Uložené dáta boli vymazané z lokálneho úložiska.');
    });

    $('#data-source-toggle').off('change').on('change', function () {
        state.useLocalData = $(this).is(':checked');
        loadAllRestaurantsData(true);
    });

    $('#day-tabs').off('click', '.day-tab').on('click', '.day-tab', function () {
        const dayVal = $(this).data('day');
        state.selectedDay = dayVal === 'all' ? 'all' : parseInt(dayVal, 10);
        updateTabsUI();
        renderMenuUI();
    });
}

function renderFiltersUI() {
    const $container = $('#restaurant-filters');
    if (!$container.length) return;

    let html = '';

    RESTAURANTS.forEach(r => {
        const isChecked = state.visibleRestaurants.has(r.id);
        const activeClass = isChecked 
            ? 'bg-blue-600 text-white font-semibold shadow-xs border-blue-600' 
            : 'bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 border-slate-200';
            
        const checkIcon = isChecked ? '✓ ' : '';

        html += `
            <button data-id="${r.id}" class="restaurant-filter-btn px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 cursor-pointer ${activeClass}">
                <span>${checkIcon}${r.name}</span>
            </button>
        `;
    });

    $container.html(html);

    $container.find('.restaurant-filter-btn').off('click').on('click', function () {
        const restId = $(this).data('id');
        if (state.visibleRestaurants.has(restId)) {
            if (state.visibleRestaurants.size > 1) {
                state.visibleRestaurants.delete(restId);
            } else {
                alert('Musí ostať vybraná aspoň jedna reštaurácia.');
                return;
            }
        } else {
            state.visibleRestaurants.add(restId);
        }
        renderFiltersUI();
        renderMenuUI();
    });
}

function updateTabsUI() {
    $('.day-tab').each(function () {
        const val = $(this).data('day');
        const isSelected = (val === 'all' && state.selectedDay === 'all') || (parseInt(val, 10) === state.selectedDay);

        if (isSelected) {
            $(this).attr('class', 'day-tab active border-b-2 border-blue-600 text-blue-600 font-semibold px-4 py-2 text-sm transition-colors');
        } else {
            $(this).attr('class', 'day-tab border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-4 py-2 text-sm transition-colors');
        }
    });

    $('#current-day-display').text(DAY_NAMES[state.selectedDay] || 'Dnes');
}

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
                lastUpdated: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
                error: null,
                menu: menuItems
            };
        } catch (error) {
            console.error(`Chyba pri načítaní reštaurácie ${restaurant.name}:`, error);
            return {
                id: restaurant.id,
                name: restaurant.name,
                url: restaurant.url,
                lastUpdated: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
                error: state.useLocalData 
                    ? `Nepodarilo sa načítať lokálny súbor (${restaurant.localUrl}).` 
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

function fetchRestaurantHtml(restaurant, useLocal) {
    if (!useLocal && !PROXY_URL) {
        return Promise.reject(new Error('PROXY_URL nie je definovaná.'));
    }

    const targetUrl = useLocal ? restaurant.localUrl : `${PROXY_URL}${restaurant.url}`;

    return $.ajax({
        url: targetUrl,
        method: 'GET',
        dataType: 'html'
    });
}

function showLoading(isLoading) {
    $('#loading-indicator').toggleClass('hidden', !isLoading);
    if (isLoading) {
        $('#menu-container').empty();
    }
}

function renderMenuUI() {
    const $container = $('#menu-container');
    if (!$container.length) return;

    const activeRestaurants = state.restaurantsData.filter(r => state.visibleRestaurants.has(r.id));

    if (activeRestaurants.length === 0) {
        $container.html('<p class="text-slate-500 text-center col-span-full py-8">Žiadne reštaurácie nie sú zvolené vo filtri.</p>');
        return;
    }

    $container.html(activeRestaurants.map(restaurant => renderRestaurantCard(restaurant)).join(''));
}

/**
 * Vykreslenie karty reštaurácie
 */
function renderRestaurantCard(restaurant) {
    if (restaurant.error) {
        return `
            <article class="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden flex flex-col">
                <header class="p-4 bg-slate-100 border-b-2 border-slate-300">
                    <h3 class="font-bold text-slate-900 text-lg">
                        <a href="${restaurant.url}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                            ${restaurant.name} ↗
                        </a>
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Posledná aktualizácia: ${restaurant.lastUpdated}</p>
                </header>
                <div class="p-4 flex-grow flex items-center justify-center">
                    <div class="bg-red-50 text-red-700 p-4 rounded-xl text-sm w-full border-2 border-red-200">
                        <p class="font-semibold mb-1">Menu nie je dostupné</p>
                        <p class="text-xs text-red-600">${restaurant.error}</p>
                    </div>
                </div>
            </article>
        `;
    }

    let filteredMenu = restaurant.menu;
    if (state.selectedDay !== 'all') {
        filteredMenu = restaurant.menu.filter(item => item.day === state.selectedDay);
    }

    if (filteredMenu.length === 0) {
        return `
            <article class="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden flex flex-col">
                <header class="p-4 bg-slate-100 border-b-2 border-slate-300">
                    <h3 class="font-bold text-slate-900 text-lg">
                        <a href="${restaurant.url}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                            ${restaurant.name} ↗
                        </a>
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">Posledná aktualizácia: ${restaurant.lastUpdated}</p>
                </header>
                <div class="p-6 flex-grow flex items-center justify-center">
                    <p class="text-sm text-slate-500 italic bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200 w-full text-center">
                        Menu na tento deň nie je k dispozícii.
                    </p>
                </div>
            </article>
        `;
    }

    const groupedByDay = {};
    filteredMenu.forEach(item => {
        if (!groupedByDay[item.day]) groupedByDay[item.day] = [];
        groupedByDay[item.day].push(item);
    });

    const menuContentHtml = Object.keys(groupedByDay).map(dayKey => {
        const dayItems = groupedByDay[dayKey];
        const dayTitle = state.selectedDay === 'all' 
            ? `<h4 class="text-xs font-extrabold text-blue-600 uppercase tracking-wider mt-5 mb-3 border-b-2 border-slate-200 pb-1 flex items-center gap-1.5">
                <span>📅</span> ${DAY_NAMES[dayKey]}
               </h4>` 
            : '';

        const itemsHtml = dayItems.map(item => {
            const isSoup = item.type === 'soup';
            
            const cardClass = isSoup 
                ? 'p-4 bg-blue-50/70 rounded-xl border-2 border-blue-300 border-l-4 border-l-blue-600 my-4 shadow-xs hover:shadow-sm transition-shadow' 
                : 'p-4 bg-slate-50/90 rounded-xl border-2 border-slate-300 border-l-4 border-l-emerald-500 my-4 shadow-xs hover:shadow-sm transition-shadow';

            // Odznak POLIEVKA pre polievku, Odznak MENU pre hlavné jedlo
            let badgeHtml = '';
            if (isSoup) {
                badgeHtml = `
                    <div class="mb-2">
                        <span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2.5 py-0.5 rounded-md shadow-2xs select-none whitespace-nowrap">
                            🥣 Polievka
                        </span>
                    </div>`;
            } else {
                badgeHtml = `
                    <div class="mb-2">
                        <span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-md shadow-2xs select-none whitespace-nowrap">
                            MENU
                        </span>
                    </div>`;
            }

            let detailsParts = [];
            if (item.weight) {
                detailsParts.push(`<span class="font-medium text-slate-700">⚖️ ${item.weight}</span>`);
            }
            if (item.allergens) {
                detailsParts.push(`<span>Alergény: <strong class="text-slate-700">${item.allergens}</strong></span>`);
            }
            const detailsHtml = detailsParts.join('<span class="text-slate-300 mx-2 font-bold">•</span>');

            return `
                <div class="${cardClass} text-xs leading-relaxed">
                    <div class="flex justify-between items-start gap-3">
                        <div class="font-semibold text-slate-800 flex-1 min-w-0">
                            ${badgeHtml}
                            <div class="leading-snug text-[13px] text-slate-900 break-words">${item.name}</div>
                        </div>
                        <div class="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border-2 border-slate-300 shadow-2xs text-xs whitespace-nowrap shrink-0 self-start">
                            ${item.price}
                        </div>
                    </div>
                    ${detailsParts.length > 0 ? `
                        <div class="flex items-center text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-300">
                            ${detailsHtml}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        return `<div class="mb-5 last:mb-0">${dayTitle}${itemsHtml}</div>`;
    }).join('');

    return `
        <article class="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden flex flex-col">
            <header class="p-4 bg-slate-100 border-b-2 border-slate-300 flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-slate-900 text-lg">
                        <a href="${restaurant.url}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                            ${restaurant.name} ↗
                        </a>
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">Posledná aktualizácia: ${restaurant.lastUpdated}</p>
                </div>
            </header>
            <div class="p-4 flex-grow overflow-y-auto max-h-[540px]">
                ${menuContentHtml}
            </div>
        </article>
    `;
}

/* ==========================================================================
   PARSER LOGIKA (Drag, Ostravarna Amélia, Riviera)
   ========================================================================== */

function parseDrag(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    const $html = $(doc.body);
    const menuItems = [];

    const daysMap = [
        { id: 'pondelok', num: 1 },
        { id: 'utorok', num: 2 },
        { id: 'streda', num: 3 },
        { id: 'stvrtok', num: 4 },
        { id: 'piatok', num: 5 }
    ];

    daysMap.forEach(dayInfo => {
        const $pane = $html.find(`#${dayInfo.id}`);
        if (!$pane.length) return;

        const paneText = $pane.text() || '';
        const soupMatch = paneText.match(/POLIEVKA[\s\S]*?(0,[\d]+\s*l[^\n<]+)/i);
        if (soupMatch && soupMatch[1]) {
            const rawSoup = soupMatch[1].trim();
            const allergensMatch = rawSoup.match(/\/([\d,]+)\//);
            const weightMatch = rawSoup.match(/^([\d,]+\s*l)/i);

            let soupName = rawSoup;
            if (weightMatch) soupName = soupName.replace(weightMatch[0], '');
            if (allergensMatch) soupName = soupName.replace(allergensMatch[0], '');
            soupName = soupName.replace(/HLAVNÉ JEDLO/gi, '').trim();

            menuItems.push({
                day: dayInfo.num,
                type: 'soup',
                name: soupName,
                price: formatPrice('V cene menu', true),
                allergens: cleanAllergens(allergensMatch ? allergensMatch[1] : ''),
                weight: weightMatch ? weightMatch[1] : '0,3 l'
            });
        }

        $pane.find('table tr').each(function () {
            const $cols = $(this).find('td');
            if ($cols.length < 2) return;

            const nameCol = $cols.eq(0).text().trim();
            const priceCol = $cols.eq(1).text().trim();

            if (!nameCol || nameCol.length < 3) return;

            const weightMatch = nameCol.match(/^([\d/g\s\u00a0]+)(?=\s+[A-ZÁÄČĎÉÍĹĽŇÓÔRŔŠŤÚÝŽ])/i);
            const allergensMatch = nameCol.match(/\/([\d,]+)\//);

            let cleanName = nameCol;
            let weightStr = '';

            if (weightMatch) {
                weightStr = weightMatch[1].replace(/\u00a0/g, '').trim();
                cleanName = cleanName.substring(weightMatch[0].length).trim();
            }

            if (allergensMatch) {
                cleanName = cleanName.replace(allergensMatch[0], '').trim();
            }

            cleanName = cleanName.replace(/^[/\s\u00a0]+/, '').replace(/\s+/g, ' ').trim();

            menuItems.push({
                day: dayInfo.num,
                type: 'main',
                name: cleanName,
                price: formatPrice(priceCol, false),
                allergens: cleanAllergens(allergensMatch ? allergensMatch[1] : ''),
                weight: weightStr
            });
        });
    });

    return menuItems;
}

/**
 * Parser pre Ostravarna Amélia
 */
function parseOstravarna(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    const $html = $(doc.body);
    const menuItems = [];

    const dayNameMap = {
        'pondelok': 1,
        'utorok': 2,
        'streda': 3,
        'štvrtok': 4,
        'piatok': 5
    };

    $html.find('#menu article').each(function () {
        const $article = $(this);
        const dayHeader = $article.find('.tracking-wider').text().trim().toLowerCase();

        const dayNum = dayNameMap[dayHeader];
        if (!dayNum) return;

        if ($article.text().includes('ZATVORENÉ')) return;

        $article.find('.divide-y > div').each(function () {
            const $row = $(this);
            const priceText = $row.find('.shrink-0').text().trim();
            const $mainCol = $row.find('.min-w-0');
            if (!$mainCol.length) return;

            const $titleEl = $mainCol.find('.font-bold');
            if (!$titleEl.length) return;

            let fullText = $titleEl.text().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

            // Striktný regex na hmotnosť/objem (napr. "0,3l", "0,3 l", "130g", "580g", "250g", "300g", "150g")
            const weightRegex = /(\d+(?:[\.,]\d+)?\s*(?:g|l))\b/i;
            const weightMatch = fullText.match(weightRegex);
            let weightStr = weightMatch ? weightMatch[1].trim() : '';

            // Čistenie názvu jedla
            let cleanName = fullText;

            // Odstránenie čísla položky (napr. "1.", "2.") na začiatku
            cleanName = cleanName.replace(/^\d+\.\s*/, '').trim();

            // Odstránenie váhy z názvu jedla
            if (weightMatch) {
                cleanName = cleanName.replace(weightMatch[0], '').trim();
            }

            // Dodatočné začistenie prebytočných medzier
            cleanName = cleanName.replace(/\s+/g, ' ').trim();

            const typeText = $mainCol.find('.mt-1').text() || '';
            const isSoup = typeText.includes('Polievka');
            const allergensMatch = typeText.match(/Alergény:\s*([\d,]+)/i);

            menuItems.push({
                day: dayNum,
                type: isSoup ? 'soup' : 'main',
                name: cleanName,
                price: formatPrice(priceText, isSoup),
                allergens: cleanAllergens(allergensMatch ? allergensMatch[1] : ''),
                weight: weightStr
            });
        });
    });

    return menuItems;
}

function parseRiviera(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    const $html = $(doc.body);
    const menuItems = [];

    const daysMap = {
        'PONDELOK': 1,
        'UTOROK': 2,
        'STREDA': 3,
        'ŠTVRTOK': 4,
        'PIATOK': 5
    };

    let currentDay = null;

    $html.find('p').each(function () {
        const $p = $(this);
        const text = $p.text().trim();
        if (!text) return;

        let isDayHeader = false;
        for (const [dayName, dayNum] of Object.entries(daysMap)) {
            if (text.toUpperCase().includes(dayName) && text.length < 30) {
                currentDay = dayNum;
                isDayHeader = true;
                break;
            }
        }

        if (isDayHeader || !currentDay) return;

        if (text.includes('podávame od') || text.includes('ALERGÉNY') || text.includes('Hmotnosť mäsa') || text.includes('TÝŽDENNÉ MENU')) {
            return;
        }

        const rawLines = $p.html().split(/<br\s*\/?>/i);
        const lines = [];

        rawLines.forEach(rl => {
            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = rl;
            const cleanText = tempDiv.textContent.trim();
            if (cleanText) lines.push(cleanText);
        });

        if (lines.length === 0) return;

        const hasPrices = lines.some(l => /€|EUR/i.test(l));

        if (!hasPrices) {
            const soupName = lines[0];
            let weight = '0,25 l';
            let allergens = '';

            if (lines.length > 1) {
                const details = lines[1];
                const weightMatch = details.match(/(\d+[\.,]\d+\s*l)/i);
                if (weightMatch) weight = weightMatch[1];

                const allergensMatch = details.match(/A([\d,\s/]+)/i);
                if (allergensMatch) allergens = cleanAllergens(allergensMatch[1]);
            }

            menuItems.push({
                day: currentDay,
                type: 'soup',
                name: soupName,
                price: formatPrice('V cene menu', true),
                weight: weight,
                allergens: allergens
            });
        } else {
            let i = 0;
            while (i < lines.length) {
                const line = lines[i];

                if (/^\d+\.\s*/.test(line) || (!/€|EUR/i.test(line) && i + 1 < lines.length && /€|EUR/i.test(lines[i + 1]))) {
                    const dishTitle = line.replace(/^\d+\.\s*/, '').trim();
                    const detailLine = i + 1 < lines.length ? lines[i + 1] : '';
                    i += 2;

                    const priceMatch = detailLine.match(/(\d+[\.,]\d+|\d+)\s*(€|EUR)/i);
                    const rawPrice = priceMatch ? priceMatch[1] : '';

                    const weightMatch = detailLine.match(/(\d+\s*g|\d+[\.,]\d+\s*l)/i);
                    const weight = weightMatch ? weightMatch[1] : '';

                    const allergensMatch = detailLine.match(/A([\d,\s/]+)/i);
                    const allergens = allergensMatch ? cleanAllergens(allergensMatch[1]) : '';

                    if (dishTitle.length > 2) {
                        menuItems.push({
                            day: currentDay,
                            type: 'main',
                            name: dishTitle,
                            price: formatPrice(rawPrice, false),
                            weight: weight,
                            allergens: allergens
                        });
                    }
                } else {
                    i++;
                }
            }
        }
    });

    return menuItems;
}