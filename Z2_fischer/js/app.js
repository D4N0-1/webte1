/**
 * WEBTE1 - Zadanie č. 2: Obedové menu v okolí fakulty
 */

$(function () {
    initApp();
});

const PROXY_URL = ''; 
const CACHE_KEY = 'menu_cache_v110';

const RESTAURANTS = [
    { id: 'drag', name: 'Reštaurácia DRAG', url: 'https://www.restauracia-drag.sk/denne-menu', localUrl: 'data/Drag.html', parse: parseDrag },
    { id: 'ostravarna', name: 'Ostravarna Amélia', url: 'https://ameliarestaurant.sk/#menu', localUrl: 'data/Ostravarna.html', parse: parseOstravarna },
    { id: 'riviera', name: 'Reštaurácia Riviera', url: 'https://restauraciariviera.sk/obedove-menu/', localUrl: 'data/Riviera.html', parse: parseRiviera }
];

const DAY_NAMES = { 1: 'Pondelok', 2: 'Utorok', 3: 'Streda', 4: 'Štvrtok', 5: 'Piatok', 'all': 'Celý týždeň' };

const state = {
    restaurantsData: [],
    useLocalData: true,
    selectedDay: getInitialDay(),
    visibleRestaurants: new Set(RESTAURANTS.map(r => r.id))
};

function cleanAllergens(raw) {
    if (!raw) return '';
    return String(raw)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/^[,/\-\.\s]+|[,/\-\.\s]+$/g, '')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s*\/\s*/g, ' / ')
        .trim();
}

function formatPrice(rawPrice, isSoup) {
    if (!rawPrice || String(rawPrice).toLowerCase().includes('v cene')) {
        return isSoup ? 'V cene menu' : 'N/A';
    }
    const match = String(rawPrice).match(/(\d+[\.,]\d+|\d+)/);
    return match ? parseFloat(match[1].replace(',', '.')).toFixed(2).replace('.', ',') + ' EUR' : (isSoup ? 'V cene menu' : 'N/A');
}

function getInitialDay() {
    const day = new Date().getDay();
    return (day >= 1 && day <= 5) ? day : 1;
}

function initApp() {
    setupEventListeners();
    renderFiltersUI();
    updateTabsUI();
    $('#data-source-toggle').prop('checked', state.useLocalData);

    if (!loadFromCache()) {
        loadAllRestaurantsData();
    } else {
        renderMenuUI();
    }
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function loadFromCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
        if (cached && cached.date === getTodayString() && Array.isArray(cached.restaurants) && cached.restaurants.length) {
            state.restaurantsData = cached.restaurants;
            return true;
        }
    } catch (e) {
        console.warn('Cache error:', e);
    }
    return false;
}

function saveToCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: getTodayString(), restaurants: data }));
    } catch (e) {
        console.warn('Cache save error:', e);
    }
}

function setupEventListeners() {
    $('#btn-refresh').on('click', () => loadAllRestaurantsData(true));
    $('#btn-clear-cache').on('click', () => {
        localStorage.removeItem(CACHE_KEY);
        state.restaurantsData = [];
        $('#menu-container').html('<p class="text-slate-500 text-center col-span-full py-8">Úložisko vymazané. Kliknite na "Aktualizovať menu".</p>');
        alert('Data vymazané.');
    });

    $('#data-source-toggle').on('change', function () {
        state.useLocalData = $(this).is(':checked');
        loadAllRestaurantsData(true);
    });

    $('#day-tabs').on('click', '.day-tab', function () {
        const val = $(this).data('day');
        state.selectedDay = val === 'all' ? 'all' : parseInt(val, 10);
        updateTabsUI();
        renderMenuUI();
    });
}

function renderFiltersUI() {
    const $container = $('#restaurant-filters');
    if (!$container.length) return;

    const html = RESTAURANTS.map(r => {
        const checked = state.visibleRestaurants.has(r.id);
        const cls = checked ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
        return `<button data-id="${r.id}" class="restaurant-filter-btn px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 cursor-pointer ${cls}">
            <span>${checked ? '✓ ' : ''}${r.name}</span>
        </button>`;
    }).join('');

    $container.html(html).find('.restaurant-filter-btn').on('click', function () {
        const id = $(this).data('id');
        if (state.visibleRestaurants.has(id)) {
            if (state.visibleRestaurants.size > 1) state.visibleRestaurants.delete(id);
            else return alert('Musí ostať vybraná aspoň jedna reštaurácia.');
        } else {
            state.visibleRestaurants.add(id);
        }
        renderFiltersUI();
        renderMenuUI();
    });
}

function updateTabsUI() {
    $('.day-tab').each(function () {
        const val = $(this).data('day');
        const active = (val === 'all' && state.selectedDay === 'all') || (parseInt(val, 10) === state.selectedDay);
        $(this).toggleClass('active border-blue-600 text-blue-600 font-semibold', active)
               .toggleClass('border-transparent text-slate-500 hover:text-slate-700', !active);
    });
    $('#current-day-display').text(DAY_NAMES[state.selectedDay] || 'Dnes');
}

async function loadAllRestaurantsData(forceRefresh = false) {
    if (!forceRefresh && loadFromCache()) {
        renderMenuUI();
        return;
    }

    $('#loading-indicator').removeClass('hidden');
    $('#menu-container').empty();

    state.restaurantsData = await Promise.all(RESTAURANTS.map(async (r) => {
        try {
            const url = state.useLocalData ? r.localUrl : `${PROXY_URL}${r.url}`;
            const html = await $.ajax({ url, method: 'GET', dataType: 'html' });
            return { id: r.id, name: r.name, url: r.url, lastUpdated: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }), error: null, menu: r.parse(html) };
        } catch (e) {
            return { id: r.id, name: r.name, url: r.url, lastUpdated: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }), error: 'Nepodarilo sa načítať dáta.', menu: [] };
        }
    }));

    saveToCache(state.restaurantsData);
    $('#loading-indicator').addClass('hidden');
    renderMenuUI();
}

function renderMenuUI() {
    const active = state.restaurantsData.filter(r => state.visibleRestaurants.has(r.id));
    $('#menu-container').html(active.length ? active.map(renderRestaurantCard).join('') : '<p class="text-slate-500 text-center col-span-full py-8">Žiadne reštaurácie nie sú vybrané.</p>');
}

function renderRestaurantCard(r) {
    let contentHtml = '';

    if (r.error) {
        contentHtml = `<div class="p-4 bg-red-50 text-red-700 rounded-xl text-sm border-2 border-red-200">${r.error}</div>`;
    } else {
        const items = state.selectedDay === 'all' ? r.menu : r.menu.filter(i => i.day === state.selectedDay);
        if (!items.length) {
            contentHtml = `<p class="text-sm text-slate-500 italic bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200 text-center">Menu na tento deň nie je k dispozícii.</p>`;
        } else {
            const grouped = {};
            items.forEach(i => (grouped[i.day] = grouped[i.day] || []).push(i));

            contentHtml = Object.keys(grouped).map(day => {
                const title = state.selectedDay === 'all' ? `<h4 class="text-xs font-extrabold text-blue-600 uppercase tracking-wider mt-5 mb-3 border-b-2 border-slate-200 pb-1">📅 ${DAY_NAMES[day]}</h4>` : '';
                const dishes = grouped[day].map(item => {
                    const isSoup = item.type === 'soup';
                    const cardCls = isSoup 
                        ? 'p-4 bg-blue-50/70 rounded-xl border-2 border-blue-300 border-l-4 border-l-blue-600 my-4 shadow-xs' 
                        : 'p-4 bg-slate-50/90 rounded-xl border-2 border-slate-300 border-l-4 border-l-emerald-500 my-4 shadow-xs';
                    const badge = isSoup 
                        ? `<span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2.5 py-0.5 rounded-md mb-2">🥣 Polievka</span>` 
                        : `<span class="inline-block text-[10px] font-bold uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-md mb-2">MENU</span>`;
                    
                    const details = [item.weight ? `⚖️ ${item.weight}` : '', item.allergens ? `Alergény: <strong>${item.allergens}</strong>` : ''].filter(Boolean).join(' • ');

                    return `<div class="${cardCls} text-xs leading-relaxed">
                        <div class="flex justify-between items-start gap-3">
                            <div class="font-semibold text-slate-800 flex-1 min-w-0">
                                ${badge}
                                <div class="leading-snug text-[13px] text-slate-900 break-words">${item.name}</div>
                            </div>
                            <div class="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border-2 border-slate-300 text-xs whitespace-nowrap shrink-0 self-start">${item.price}</div>
                        </div>
                        ${details ? `<div class="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-300">${details}</div>` : ''}
                    </div>`;
                }).join('');
                return title + dishes;
            }).join('');
        }
    }

    return `<article class="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden flex flex-col">
        <header class="p-4 bg-slate-100 border-b-2 border-slate-300 flex justify-between items-start">
            <div>
                <h3 class="font-bold text-slate-900 text-lg"><a href="${r.url}" target="_blank" rel="noopener" class="hover:text-blue-600">${r.name} ↗</a></h3>
                <p class="text-xs text-slate-500 mt-0.5">Aktualizované: ${r.lastUpdated}</p>
            </div>
        </header>
        <div class="p-4 flex-grow overflow-y-auto max-h-[540px]">${contentHtml}</div>
    </article>`;
}

/* ==========================================================================
   PARSER LOGIKA
   ========================================================================== */

function parseDrag(html) {
    const $html = $(new DOMParser().parseFromString(html, 'text/html').body);
    const items = [];
    const days = [{ id: 'pondelok', num: 1 }, { id: 'utorok', num: 2 }, { id: 'streda', num: 3 }, { id: 'stvrtok', num: 4 }, { id: 'piatok', num: 5 }];

    days.forEach(d => {
        const $pane = $html.find(`#${d.id}`);
        if (!$pane.length) return;

        const soupMatch = ($pane.text() || '').match(/POLIEVKA[\s\S]*?(0,[\d]+\s*l[^\n<]+)/i);
        if (soupMatch) {
            const rawSoup = soupMatch[1].trim();
            const allergens = rawSoup.match(/\/([\d,]+)\//);
            const weight = rawSoup.match(/^([\d,]+\s*l)/i);
            let name = rawSoup.replace(weight ? weight[0] : '', '').replace(allergens ? allergens[0] : '', '').replace(/HLAVNÉ JEDLO/gi, '').trim();
            items.push({ day: d.num, type: 'soup', name, price: formatPrice('V cene menu', true), allergens: cleanAllergens(allergens ? allergens[1] : ''), weight: weight ? weight[1] : '0,3 l' });
        }

        $pane.find('table tr').each(function () {
            const $cols = $(this).find('td');
            if ($cols.length < 2) return;
            const nameCol = $cols.eq(0).text().trim();
            const priceCol = $cols.eq(1).text().trim();
            if (!nameCol || nameCol.length < 3) return;

            const weight = nameCol.match(/^([\d/g\s\u00a0]+)(?=\s+[A-ZÁÄČĎÉÍĹĽŇÓÔRŔŠŤÚÝŽ])/i);
            const allergens = nameCol.match(/\/([\d,]+)\//);
            let name = nameCol;
            if (weight) name = name.substring(weight[0].length);
            if (allergens) name = name.replace(allergens[0], '');
            
            items.push({ day: d.num, type: 'main', name: name.trim(), price: formatPrice(priceCol, false), allergens: cleanAllergens(allergens ? allergens[1] : ''), weight: weight ? weight[1].trim() : '' });
        });
    });
    return items;
}

function parseOstravarna(html) {
    const $html = $(new DOMParser().parseFromString(html, 'text/html').body);
    const items = [];
    const dayMap = { 'pondelok': 1, 'utorok': 2, 'streda': 3, 'štvrtok': 4, 'piatok': 5 };

    $html.find('#menu article').each(function () {
        const $art = $(this);
        const dayNum = dayMap[$art.find('.tracking-wider').text().trim().toLowerCase()];
        if (!dayNum || $art.text().includes('ZATVORENÉ')) return;

        $art.find('.divide-y > div').each(function () {
            const $row = $(this);
            const priceText = $row.find('.shrink-0').text().trim();
            const $title = $row.find('.min-w-0 .font-bold');
            if (!$title.length) return;

            let fullText = $title.text().replace(/\s+/g, ' ').trim();
            const weightMatch = fullText.match(/(\d+(?:[\.,]\d+)?\s*(?:g|l))\b/i);
            const weightStr = weightMatch ? weightMatch[1].trim() : '';

            let cleanName = fullText.replace(/^\d+\.\s*/, '');
            if (weightMatch) cleanName = cleanName.replace(weightMatch[0], '');

            const isSoup = ($row.find('.min-w-0 .mt-1').text() || '').includes('Polievka');
            const allergens = ($row.find('.min-w-0 .mt-1').text() || '').match(/Alergény:\s*([\d,]+)/i);

            items.push({ day: dayNum, type: isSoup ? 'soup' : 'main', name: cleanName.trim(), price: formatPrice(priceText, isSoup), allergens: cleanAllergens(allergens ? allergens[1] : ''), weight: weightStr });
        });
    });
    return items;
}

function parseRiviera(html) {
    const $html = $(new DOMParser().parseFromString(html, 'text/html').body);
    const items = [];
    const daysMap = { 'PONDELOK': 1, 'UTOROK': 2, 'STREDA': 3, 'ŠTVRTOK': 4, 'PIATOK': 5 };
    let currentDay = null;

    $html.find('p').each(function () {
        const text = $(this).text().trim();
        if (!text) return;

        for (const [name, num] of Object.entries(daysMap)) {
            if (text.toUpperCase().includes(name) && text.length < 30) {
                currentDay = num;
                return;
            }
        }

        // Pridaná kontrola na "HMOTNOSŤ MÄSA" pre ignorovanie informácií o gramáži
        const upperText = text.toUpperCase();
        if (!currentDay || 
            upperText.includes('PODÁVAME OD') || 
            upperText.includes('ALERGÉNY') || 
            upperText.includes('HMOTNOSŤ MÄSA') || 
            upperText.includes('TÝŽDENNÉ MENU')) {
            return;
        }

        const lines = $(this).html().split(/<br\s*\/?>/i).map(l => $('<div>').html(l).text().trim()).filter(Boolean);
        if (!lines.length) return;

        // Ak riadky neobsahujú cenu a zároveň to nie je poznámka o hmotnosti mäsa
        if (!lines.some(l => /€|EUR/i.test(l))) {
            const soupName = lines[0];
            if (!soupName.toUpperCase().includes('HMOTNOSŤ MÄSA')) {
                items.push({ day: currentDay, type: 'soup', name: soupName, price: formatPrice('V cene menu', true), weight: '0,25 l', allergens: '' });
            }
        } else {
            let i = 0;
            while (i < lines.length) {
                if (/^\d+\.\s*/.test(lines[i]) || (i + 1 < lines.length && /€|EUR/i.test(lines[i + 1]))) {
                    const name = lines[i].replace(/^\d+\.\s*/, '').trim();
                    const details = lines[i + 1] || '';
                    i += 2;

                    const price = details.match(/(\d+[\.,]\d+|\d+)\s*(€|EUR)/i);
                    const weight = details.match(/(\d+\s*g|\d+[\.,]\d+\s*l)/i);
                    const allergens = details.match(/A([\d,\s/]+)/i);

                    if (!name.toUpperCase().includes('HMOTNOSŤ MÄSA')) {
                        items.push({ 
                            day: currentDay, 
                            type: 'main', 
                            name, 
                            price: formatPrice(price ? price[1] : '', false), 
                            weight: weight ? weight[1] : '', 
                            allergens: cleanAllergens(allergens ? allergens[1] : '') 
                        });
                    }
                } else {
                    i++;
                }
            }
        }
    });
    return items;
}