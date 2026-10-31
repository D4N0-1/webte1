# WEBTE1 - Zadanie č. 2: Obedové menu v okolí fakulty

* **Meno:** Daniel Fischer  
* **Krúžok:** B-API-MSUS  
* **Odkaz na školskom serveri:** [https://webte1.fei.stuba.sk/~xfischerd/ZZ_fischer]
* **Odkaz na GitHub repozitár:** [https://github.com/D4N0-1/webte1]

Webová aplikácia určená na asynchrónne načítanie, spracovanie a prehľadné zobrazenie denného menu reštaurácií v okolí FEI STU. Spracovanie prebieha výhradne na strane klienta (HTML, CSS, JavaScript + jQuery).

## Použitie AI nástrojov
V súlade s podmienkami zadania uvádzam použitie AI nástrojov pri vývoji:
- **Google Gemini**: Použitý ako asistent na návrh štruktúry projektu, tvorbu DOM parsing logiky v jQuery, konzultáciu CSS layoutu a vysvetlenie princípov fungovania kódu pre obhajobu.

## Použité knižnice a licencie
- **CSS Knižnica**: Tailwind CSS v4.3.3 | MIT License | [https://tailwindcss.com]
- **JS Knižnica**: jQuery v3.7.1 | MIT License | [https://jquery.com]
  - *Využitie jQuery v projekte:* Asynchrónne sťahovanie HTML dát (`$.ajax`), parsovanie a prehľadávanie DOM stromov reštaurácií (`$`), správa udalostí (`.on('click')`, `.on('change')`) a manipulácia s DOM elementmi UI (`.html()`, `.toggleClass()`).
- **Font**: Inter | SIL Open Font License 1.1 | [https://rsms.me/inter/]
- **Favicon/Logo**: CC0 License | [https://www.svgrepo.com/svg/186330/tray-plate]

## Štruktúra adresára
- `index.html` - Hlavný HTML5 dokument
- `favicon.svg` - Favicon ikona stránky
- `css/styles.css` - Vlastné CSS štýly a prepojenie fontu
- `js/app.js` - Hlavná JS logika aplikácie v jQuery
- `fonts/` - Priečinok pre lokálne `.woff2` súbory fontu
- `data/` - Priečinok pre lokálne HTML súbory reštaurácií (`Drag.html`, `Nase_hospoda.html`, `Riviera.html`)
- `docs/` - Priečinok pre screenshoty/textové výpisy z W3C validátorov