# Bee Champs Hub - Sprinty

## Sprint 0: Zakladni infrastruktura
**Kapitola:** 9 (Technicke pozadavky)
**Cil:** Inicializace monorepa, tech stack, zakladni konfigurace

### Ukoly:
- [ ] Inicializace pnpm monorepa (pnpm-workspace.yaml)
- [ ] Vytvoreni `apps/web` — Astro 5 + Svelte 5 + Tailwind CSS v4 + Cloudflare adapter
- [ ] Vytvoreni `apps/api` — Hono + Effect + Cloudflare Workers
- [ ] Vytvoreni `packages/shared` — sdilene typy, konstanty (programy, kategorie, barvy)
- [ ] Vytvoreni `packages/db` — Drizzle ORM schema (poptavky)
- [ ] Root tsconfig.json (strict, ES2022)
- [ ] ESLint konfigurace s Effect pravidly
- [ ] Overeni `pnpm dev` funguje pro web i API
- [ ] Design reference: prevzit strukturu z Astro Gym sablony (Layout, global.css, @theme)
- [ ] Nastavit Bee Champs barevnou paletu v Tailwind @theme (navy #0D1B2E, zlata #F5A623, atd.)
- [ ] Nastavit fonty Syne + DM Sans (Google Fonts)

---

## Sprint 1: Navigace a Layout
**Kapitola:** 2 (Navigacni lista)
**Cil:** Fixni navbar, layout, footer — kostra webu

### Ukoly:
- [ ] Layout.astro — zakladni HTML kostra (head, meta, fonty, slot)
- [ ] Header.astro — fixni navbar 68px, tmave pruhledne pozadi s blur
- [ ] Logo Bee Champs Hub (emoji vcela + text, "Hub" zlate)
- [ ] Navigacni odkazy: Sport, Vzdelavani, Projektove dny, Akce
- [ ] Tlacitko "Rocni planovac" se zlatym rameckem + badge s poctem
- [ ] Mobilni menu (hamburger) — skryje textove odkazy, zobrazi logo + planovac
- [ ] Footer.astro — tmave pozadi, zlata horni linka, 3 sloupce odkazu
- [ ] SPA navigace — Astro View Transitions nebo client-side routing

---

## Sprint 2: Uvodni stranka (Home)
**Kapitola:** 3 (Stranka 1)
**Cil:** Kompletni uvodni stranka se vsemi 6 sekcemi

### Ukoly:
- [ ] 3.1 Hero sekce — cela vyska viewportu, tmave pozadi, barevne bloby, hexagony
  - Badge "Platforma pro MS a ZS"
  - Hlavni nadpis se zlatym zvyraznenim
  - Podtitul
  - 2 CTA tlacitka (zlate + pruhledne)
  - 3 statistiky (240+, 85, 98%)
  - Fade-up animace pri nacteni
- [ ] 3.2 Sekce ctyr kategorii — grid 2x2, karticky s hover efektem
  - Barevne ikony, labely, tagy, odkazy
  - Data z packages/shared (programy)
- [ ] 3.3 Sekce "Jak to funguje" — tmave pozadi, 4 kroky
  - Cisla jako velky polopruhledny zlaty text
- [ ] 3.4 Sekce Reference — 3 recenzni karticky
- [ ] 3.5 CTA sekce — tmave pozadi, vceli emoji, zlate tlacitko
- [ ] 3.6 Footer (uz z Sprint 1)

---

## Sprint 3: Detail kategorie
**Kapitola:** 4 (Stranka 2)
**Cil:** 4 dynamicke stranky kategorii s programy

### Ukoly:
- [ ] Data: kompletni seznam 26 programu se vsemi metadaty v packages/shared
  - 8 Sport, 7 Vzdelavani, 5 Projektove dny, 6 Akce a pobyty
  - Kazdy: nazev, emoji, popis, vek, delka, pocet lektoru, barva kategorie
- [ ] 4.1 Hero sekce kategorie — tmave pozadi + barevny blob dle kategorie
  - Tlacitko zpet, ikona, nadpis, popis
- [ ] 4.2 Mrizka podprogramu — grid 3 sloupce
  - Barevny header s emoji, nazev, popis, metadata tagy
  - Tlacitko "+ Pridat do planovace" (otevre modal)
  - Hover efekt (translateY + stin)
- [ ] Dynamicke routovani — /sport, /vzdelavani, /projektove-dny, /akce

---

## Sprint 4: Rocni planovac (hlavni funkcionalita)
**Kapitola:** 5 (Stranka 3)
**Cil:** Kompletni planovac — sidebar + kalendar + interakce

### Ukoly:
- [ ] 5.1 Levy panel (Sidebar) — 340px, sticky, scrollovatelny
  - Hlavicka: nadpis, popis, vyhledavani, filtracni tlacitka
  - Seznam programu seskupenych pod kategoriemi
  - Zasktavaci pole, barevne ramecky, stav "Vybrano (Nx)"
  - Realtime filtrace podle nazvu + kategorie
- [ ] 5.2 Pravy panel (Rocni kalendar) — grid 3 sloupce, 12 mesicu (zari-srpen)
  - Horni lista: nadpis, pocitadlo, tlacitko "Odeslat poptavku"
  - Karticky mesicu s barevnymi stitky programu
  - Tlacitko "+ Pridat program" na kazdem mesici
  - Tlacitko X pro odebrani programu z mesice
- [ ] 5.3 Modalni okno — prirazeni mesice
  - Mrizka 12 tlacitek mesicu, prepinani stavu
  - Vice mesicu najednou
  - Okamzita aktualizace kalendare i sidebaru
- [ ] Spodni summary lista (sticky) — vybrane programy, cipy, "Vymazat vse"
- [ ] Stav planovace — uchovani v pameti prohlizece (JS promenna)
- [ ] Badge v navigaci — aktualni pocet vybranych programu
- [ ] Responsivita: tablet (sidebar nad kalendarem), mobil (1 sloupec)

### Poznamka:
Toto je Svelte 5 interaktivni komponenta — nejslozitejsi cast webu. Pouzit Svelte stores/runes pro stav.

---

## Sprint 5: Poptavkovy formular
**Kapitola:** 6 (Modalni okno formulare)
**Cil:** Formular pro odeslani poptavky

### Ukoly:
- [ ] 6.1 Prehled vybranych programu — automaticky z planovace
  - Kremovy box, barevne tecky, emoji, nazev, mesic
- [ ] 6.2 Formularova pole
  - Zakladni info: nazev skoly, typ instituce (dropdown), mesto, pocet deti, vek
  - Kontaktni osoba: jmeno, pozice, telefon, email
  - Doplnujici info: telocvicna, hriste (dropdown), poznamky
  - Validace povinnych poli
- [ ] 6.3 Odeslani formulare
  - API endpoint (Hono + Effect) pro prijem poptavky
  - Ulozeni do DB (Drizzle + D1)
  - Odeslani emailu (EmailJS nebo Resend)
  - Uspesna obrazovka "Poptavka odeslana!"
- [ ] Formular jde odeslat i bez predchoziho vyberu (volny text v Poznamkach)

---

## Sprint 6: Interakce, animace, responsivita
**Kapitola:** 7 (Interakce a chovani webu)
**Cil:** Dokonceni SPA chovani, animace, responsivita

### Ukoly:
- [ ] 7.1 SPA navigace — prechody bez refreshe, scroll nahoru
- [ ] 7.2 Stav planovace — zachovani pri navigaci
- [ ] 7.3 Animace
  - Hero fade-up (staggered)
  - Karty hover (translateY + shadow)
  - Modaly (scale + translateY)
  - Hexagony pulzovani
  - Badge zobrazeni/skryti
- [ ] 7.4 Responsivita
  - Desktop (1200px+) — plne rozlozeni
  - Tablet (800-1200px) — sidebar nad kalendarem, grid 2 sloupce
  - Mobil (pod 800px) — 1 sloupec, jen logo + planovac v nav

---

## Sprint 7: SEO, analytika, produkce
**Kapitola:** 9.2 (Co musi vyvojar postavit od nuly)
**Cil:** Priprava na produkci

### Ukoly:
- [ ] SEO: meta tagy, Open Graph, strukturovana data
- [ ] GDPR cookie lista
- [ ] Google Analytics 4 / Plausible
- [ ] Sitemap (Astro sitemap integrace)
- [ ] Cloudflare deploy (Pages + Workers)
- [ ] Vlastni domena + SSL
- [ ] Testovani (Vitest pro API, manualni QA pro web)
- [ ] Lighthouse audit (performance, accessibility)
