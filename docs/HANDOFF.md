# Predavaci protokol — Session 2026-03-05

## Co bylo udelano

### Sprint 0-1 (predchozi session)
- Inicializace pnpm monorepa se 4 workspace packages
- Astro 5 + Svelte 5 + Tailwind v4 + Cloudflare adapter
- Hono API s Effect TS
- Drizzle ORM schema (inquiries tabulka)
- Layout, Header (fixni navbar, mobilni menu), Footer
- Barevna paleta, fonty Syne + DM Sans

### Sprint 2: Homepage (tato session)
- HeroSection — dvousloupcovy layout (text + obrazek s plovouci kartickou)
- CategoriesSection — 4 sloupce, Lucide ikony (Dumbbell, BookOpen, CalendarDays, Tent)
- HowItWorksSection — 4 kroky s Lucide ikonami
- TestimonialsSection — 3 recenze
- CtaSection — CTA s hexagonem
- Nahrazeni vsech RemixIcon za @lucide/astro
- Odstraneni remixicon z dependencies

### Sprint 3: Kategorie
- `[category].astro` — dynamicka stranka (prerender + getStaticPaths)
- `ProgramCard.astro` — karta programu s metadaty a tlacitkem "Pridat do planovace"
- 4 stranky: /sport (8), /vzdelavani (7), /projektove-dny (5), /akce (6)

### Sprint 3.5: Cloudflare deploy
- `apps/web/wrangler.jsonc` + `apps/api/wrangler.jsonc` (JSONC format jako baladeva)
- D1 databaze `bee-champs-db` vytvorena (EEUR region)
- Obe apps nasazeny na Cloudflare Workers
- `.assetsignore` v public/ aby wrangler nenahravel _worker.js jako asset

## Deploy informace
- **Web**: https://bee-champs-hub-web.webmaster4329.workers.dev/
- **API**: https://bee-champs-hub-api.webmaster4329.workers.dev/health
- **D1 DB ID**: 0462ef41-dd80-47e5-baa5-7e8814546e14
- **Account ID**: a6f73612807840e33437c92d3771f8be

## Deploy prikazy
```bash
# Web
pnpm --filter @bee-champs/web build && cd apps/web && npx wrangler deploy

# API
cd apps/api && npx wrangler deploy
```

## Co je dalsi (Sprint 4)
**Rocni planovac** — nejslozitejsi cast projektu:
- Svelte 5 interaktivni komponenta na `/planovac`
- Levy sidebar (340px): seznam programu, filtrace, checkboxy
- Pravy panel: grid 3 sloupce, 12 mesicu (zari-srpen)
- Modal pro prirazeni programu k mesicum
- Stav pres Svelte 5 runes ($state, $derived)
- Viz `docs/SPRINTY.md` Sprint 4 pro kompletni specifikaci

## Struktura souboru (klicove)
```
apps/
  web/
    wrangler.jsonc              # CF Workers config
    public/
      .assetsignore             # _worker.js ignorovat
      images/hero.avif          # Hero obrazek
    src/
      layouts/Layout.astro      # Hlavni layout
      components/
        Header.astro            # Navbar s hexagon logem
        Footer.astro            # 4-sloupcovy footer
        ProgramCard.astro       # Karta programu
        home/
          HeroSection.astro     # 2-col hero s obrazkem
          CategoriesSection.astro  # 4 kategorie, Lucide ikony
          HowItWorksSection.astro  # 4 kroky
          TestimonialsSection.astro # Recenze
          CtaSection.astro      # CTA
      pages/
        index.astro             # Homepage
        [category].astro        # Detail kategorie (prerender)
      styles/global.css         # Tailwind v4 @theme
      data/siteData.ts          # Nav links, metadata
  api/
    wrangler.jsonc              # CF Workers config
    src/index.ts                # Hono app (/health)
packages/
  shared/src/
    categories.ts               # 4 kategorie + typy
    programs.ts                 # 26 programu
  db/src/schema/index.ts        # inquiries tabulka (Drizzle)
docs/
  SPRINTY.md                    # Sprint planovani s checklisty
```

## Zname problemy a TODO
- [ ] ESLint konfigurace jeste neni nastavena
- [ ] Astro hlasi KV SESSION binding warning — neni kriticke, ale pro sessions bude treba vytvorit KV namespace
- [ ] Tailwind ~4.1.18 pinned kvuli Vite 7 peer dep konfliktu (kosmeticky warning)
- [ ] Hero obrazek je z Unsplash — nahradit vlastnim
