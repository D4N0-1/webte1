/**
 * WEBTE1 - Zadanie č. 2: Obedové menu v okolí fakulty
 * Autor: Daniel Fischer
 * Výhradne client-side spracovanie bez JS frameworkov (DOMParser)
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Konfigurácia reštaurácií a ich lokálnych/vzdialených zdrojov
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

/**
 * Hlavná inicializačná funkcia
 */
function initApp() {
    console.log('Aplikácia inicializovaná.');
    setupEventListeners();
}

/**
 * Nastavenie poslucháčov udalostí UI
 */
function setupEventListeners() {
    const btnRefresh = document.getElementById('btn-refresh');
    const btnClearCache = document.getElementById('btn-clear-cache');

    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            console.log('Požiadavka na obnovenie menu...');
        });
    }

    if (btnClearCache) {
        btnClearCache.addEventListener('click', () => {
            localStorage.clear();
            alert('Uložené dáta boli vymazané z localStorage.');
        });
    }
}

/**
 * PARSER 1: Reštaurácia DRAG (Drag.html)
 * Štruktúra: Bootstrap záložky (#pondelok, #utorok...), nadpisy POLIEVKA a tabuľky <table> pre hlavné jedlá.
 */
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

        // 1. Extrakcia polievky
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

        // 2. Extrakcia hlavných jedál z tabuľky
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

/**
 * PARSER 2: Naše Hospoda Karloveská (Nase_hospoda.html)
 * Štruktúra: Tailwind HTML, karty <article> pre jednotlivé dni, zoznamy jedál s typom a alergénmi v spanoch.
 */
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
        if (!dayNum || dayNum > 5) return; // Spracovávame pracovné dni (1-5)

        const itemRows = article.querySelectorAll('.divide-y > div');
        itemRows.forEach(row => {
            const priceEl = row.querySelector('.shrink-0');
            const mainCol = row.querySelector('.min-w-0');
            if (!mainCol) return;

            const titleEl = mainCol.querySelector('.font-bold.text-hospoda-cream');
            const detailsEl = mainCol.querySelector('.mt-1');

            if (!titleEl) return;

            // Extrakcia hmotnosti/objemu
            const weightSpan = titleEl.querySelector('.text-zinc-500, .text-hospoda-cream');
            const weight = weightSpan ? weightSpan.textContent.trim() : '';

            // Čistenie názvu jedla
            const titleClone = titleEl.cloneNode(true);
            const spans = titleClone.querySelectorAll('span');
            spans.forEach(s => s.remove());
            const cleanName = titleClone.textContent.trim();

            // Typ (polievka/hlavné jedlo) a alergény
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

/**
 * PARSER 3: Reštaurácia Riviera (Riviera.html)
 * Štruktúra: WordPress/Elementor textový blok s odsekmi <p>, oddelenými dňami v <strong> tagoch a <br> riadkovaním.
 */
function parseRiviera(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const menuItems = [];

    const rawContainer = doc.querySelector('.raw-menu-content') || doc.body;
    const paragraphs = rawContainer.querySelectorAll('p');

    let currentDay = null;

    paragraphs.forEach(p => {
        const text = p.textContent.trim();

        // Detekcia dňa v týždni
        if (text.includes('PONDELOK')) currentDay = 1;
        else if (text.includes('UTOROK')) currentDay = 2;
        else if (text.includes('STREDA')) currentDay = 3;
        else if (text.includes('ŠTVRTOK')) currentDay = 4;
        else if (text.includes('PIATOK')) currentDay = 5;

        if (!currentDay) return;

        // Rozdelenie odseku po riadkoch (<br>)
        const lines = p.innerHTML.split(/<br\s*\/?>/i);
        lines.forEach(line => {
            const tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = line;
            const lineText = tmpDiv.textContent.trim();

            if (!lineText || lineText.includes('PONDELOK') || lineText.includes('UTOROK') || lineText.includes('STREDA') || lineText.includes('ŠTVRTOK') || lineText.includes('PIATOK')) {
                return;
            }

            // Extrakcia ceny
            const priceMatch = lineText.match(/(\d+[\.,]\d+\s*€)/);
            const price = priceMatch ? priceMatch[1] : 'V cene menu';

            // Extrakcia alergénov (napr. A1,7 alebo A1,3,9)
            const allergensMatch = lineText.match(/A([\d,]+)/i);
            const allergens = allergensMatch ? allergensMatch[1] : '';

            // Extrakcia hmotnosti (napr. 120 g, 0,25 l)
            const weightMatch = lineText.match(/(\d+\s*g|\d+[\.,]\d+\s*l)/i);
            const weight = weightMatch ? weightMatch[1] : '';

            // Detekcia či ide o polievku
            const isSoup = lineText.toLowerCase().includes('polievka') || weight.includes('l');

            // Vyčistenie názvu jedla od doplnkových údajov
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