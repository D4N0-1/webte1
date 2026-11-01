# WEBTE1 - Zadanie č. 2: Obedové menu v okolí fakulty

* **Meno:** Daniel Fischer  
* **Krúžok:** B-API-MSUS  
* **Odkaz na školskom serveri:** [https://webte1.fei.stuba.sk/~xfischerd/Z2_fischer]
* **Odkaz na GitHub repozitár:** [https://github.com/D4N0-1/webte1]

Webová aplikácia určená na asynchrónne načítanie, spracovanie a prehľadné zobrazenie denného menu reštaurácií v okolí FEI STU v Bratislave. Spracovanie prebieha výhradne na strane klienta bez použitia serverového backendu.

## Kľúčové vlastnosti
- **Asynchrónne načítavanie (AJAX):** Možnosť prepínania medzi lokálnymi HTML súbormi a živými dátami z webov reštaurácií cez CORS proxy.
- **Bezpečné DOM parsovanie:** Spracovanie stiahnutého HTML pomocou `DOMParser` a jQuery selektorov bez priameho vkladania cudzieho kódu (`innerHTML`).
- **Lokálne kešovanie:** Ukladanie naformátovaných dát do `localStorage` pre zrýchlenie načítania pri opätovnej návšteve.
- **Interaktívne UI:** Prepínanie dní v týždni, vyhľadávanie v menu, filtrovanie a automatické predvolenie aktuálneho dňa pri spustení.
- **Validita a sémantika:** Plne sémantický HTML5 kód validovaný cez W3C validátory.

## Použité knižnice a licencie
- **CSS Framework**: Tailwind CSS v4.3.3 | MIT License | [https://tailwindcss.com]
- **JS Knižnica**: jQuery v4.0.0 | MIT License | [https://jquery.com]
  - *Využitie jQuery v projekte:* Asynchrónne sťahovanie HTML dát (`$.ajax`), parsovanie a prehľadávanie DOM stromov reštaurácií (`$`), správa udalostí (`.on('click')`, `.on('change')`) a manipulácia s DOM elementmi UI (`.html()`, `.toggleClass()`).
- **Font**: Inter | SIL Open Font License 1.1 | [https://rsms.me/inter/]
- **Favicon/Logo**: CC0 License | [https://www.svgrepo.com/svg/186330/tray-plate]

## Štruktúra adresára
- `index.html` - Hlavný sémantický HTML5 dokument
- `favicon.svg` - Favicon ikona stránky
- `input.css` - Vstupný CSS súbor pre Tailwind CSS CLI
- `css/styles.css` - Skompilované CSS štýly a prepojenie lokálneho fontu
- `js/app.js` - Hlavná JS logika aplikácie v jQuery
- `fonts/` - Priečinok pre lokálne `.woff2` súbory fontu Inter
- `data/` - Priečinok pre lokálne HTML súbory reštaurácií (`Drag.html`, `Ostravarna.html`, `Riviera.html`)
- `docs/` - Priečinok pre potvrdenia z W3C validátorov

## Použitie AI nástrojov
V súlade s podmienkami zadania uvádzam použitie AI nástrojov pri vývoji:
- **Google Gemini**: Použitý ako asistent na návrh štruktúry projektu, tvorbu DOM parsing logiky v jQuery, konzultáciu CSS layoutu, refaktorovanie kódu a vysvetlenie princípov fungovania pre obhajobu.