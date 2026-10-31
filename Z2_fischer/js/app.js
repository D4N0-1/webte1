/**
 * WEBTE1 - Zadanie č. 2: Obedové menu v okolí fakulty
 * Autor: Daniel Fischer
 * Výhradne client-side spracovanie bez JS frameworkov
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Adresa CORS proxy servera (oznámená na cvičení)
const PROXY_URL = 'https://cors-proxy.example.com/'; // Sem sa vloží presná adresa proxy zo cvičenia

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

// Globálny stav aplikácie
const state = {
    restaurantsData: [], // Pole spracovaných dát zo všetkých reštaurácií
    useLocalData: false  // true = načítavať z data/*.html, false = načítavať cez CORS proxy
};

/**
 * Hlavná inicializačná funkcia
 */
function initApp() {
    console.log('Aplikácia inicializovaná.');
    setupEventListeners();
    loadAllRestaurantsData();
}

/**
 * Nastavenie poslucháčov udalostí pre UI
 */
function setupEventListeners() {
    const btnRefresh = document.getElementById('btn-refresh');
    const btnClearCache = document.getElementById('btn-clear-cache');
    const sourceToggle = document.getElementById('data-source-toggle');

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            console.log('Obnovujem dáta reštaurácií...');
            loadAllRestaurantsData();
        });
    }

    if (btnClearCache) {
        btnClearCache.addEventListener('click', () => {
            localStorage.clear();
            state.restaurantsData = [];
            alert('Uložené dáta boli vymazané z localStorage.');
            loadAllRestaurantsData();
        });
    }

    if (sourceToggle) {
        sourceToggle.addEventListener('change', (e) => {
            state.useLocalData = e.target.checked;
            console.log(`Zdroj dát zmenený na: ${state.useLocalData ? 'Lokálne súbory' : 'Živé proxy'}`);
            loadAllRestaurantsData();
        });
    }
}

/**
 * Načítanie a spracovanie dát zo všetkých reštaurácií
 */
async function loadAllRestaurantsData() {
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
                lastUpdated: new Date().toISOString(),
                error: null,
                menu: menuItems
            };
        } catch (error) {
            console.error(`Chyba pri načítaní reštaurácie ${restaurant.name}:`, error);
            // Chyba pri jednej reštaurácii nezablokuje ostatné
            return {
                id: restaurant.id,
                name: restaurant.name,
                url: restaurant.url,
                lastUpdated: new Date().toISOString(),
                error: 'Nepodarilo sa načítať denné menu reštaurácie.',
                menu: []
            };
        }
    });

    state.restaurantsData = await Promise.all(fetchPromises);
    showLoading(false);

    console.log('Spracované dáta reštaurácií:', state.restaurantsData);
}

/**
 * Asynchrónne stiahnutie HTML kódu konkrétnej reštaurácie cez Fetch API
 */
async function fetchRestaurantHtml(restaurant, useLocal) {
    const targetUrl = useLocal 
        ? restaurant.localUrl 
        : `${PROXY_URL}${restaurant.url}`;

    const response = await fetch(targetUrl);

    if (!response.ok) {
        throw new Error(`HTTP chyba status: ${response.status}`);
    }

    return await response.text();
}

/**
 * Zobrazenie / skrytie indikátora načítavania
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