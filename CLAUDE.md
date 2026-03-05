# Bee Champs Hub - CLAUDE.md

## Projekt
Planovaci platforma pro MS a ZS. Skoly si sestavi cely skolni rok — vyberou programy z 4 kategorii, priradi je do mesicu, a odeslou jednu souhrnnou poptavku.

## Tech Stack
- **Monorepo**: pnpm workspaces
- **Web**: Astro 5 + Svelte 5 + Tailwind CSS v4 + Cloudflare adapter
- **API**: Hono + Effect TS + Cloudflare Workers
- **DB**: Drizzle ORM (Cloudflare D1)
- **Testy**: Vitest
- **TypeScript**: Strict, ES2022

## Jazyk
- Komunikuj s uzivatelem **pouze cesky**
- Dokumentaci a komentare v kodu pis **cesky**
- Interne premyslej anglicky, ale vystup vzdy cesky

## POVINNE PRED KAZDOU IMPLEMENTACI
1. **ZJISTI VERZE V PROJEKTU** — zkontroluj `package.json` (root + apps/* + packages/*) pro aktualni verze. NIKDY nepredpokladej verze z pameti!
2. **WEBSEARCH PRO DOKUMENTACI** — **BEZVYHRADNE** pouzij `WebSearch` pro aktualni docs knihovny/API kterou budes pouzivat. Over syntax a best practices pro KONKRETNI verzi v projektu. Toto neni volitelne — VZDY hledej dokumentaci pred implementaci, bez vyjimky.
3. **NIKDY NEINSTALUJ BEZ OVERENI** — `pnpm view nazev dist-tags --json` nebo WebSearch pro latest verzi. VZDY pouzivej `pnpm`, NIKDY `npm`.
4. **SKRIPTY** — viz `package.json` v koreni. NIKDY nevymyslej vlastni prikazy.

## Striktni Effect TS pravidla
Viz [EFFECT_STRICT_RULES.md](./EFFECT_STRICT_RULES.md) — VZDY dodrzuj:

- **NIKDY** `async/await` v backendovem kodu (apps/api) — vse pres `Effect.gen` + `yield*`
- **NIKDY** `Effect.runPromise` — pouzij `ManagedRuntime.make(layer).runPromise(...)`
- **NIKDY** `any`, `throw`, `null`/`undefined` v domenove logice
- **NIKDY** `.pipe()` metoda na instancich — pouzivej standalone `pipe()`
- **NIKDY** `eslint-disable` komentare
- **VZDY** `Data.TaggedError` pro chyby, `Option<T>` pro nullable
- **VZDY** `Schema.Class` pro datove modely, `Schema.decodeUnknown` pro validaci requestu
- **VZDY** `Context.GenericTag` + `Layer` pro dependency injection
- **VZDY** `Match.exhaustive` (ne `Match.orElse` ani `switch`)
- **VZDY** `makeHonoRuntime` wrapper s `ManagedRuntime` pro HTTP handlery
- **VZDY** `Effect.tryPromise` na hranicich (DB, fetch, KV, R2)
- **VZDY** spoustej `tsc -p apps/api/tsconfig.json --noEmit` pro API

## Struktura projektu
```
bee-champs/
├── CLAUDE.md
├── EFFECT_STRICT_RULES.md
├── README.md
├── docs/
│   └── SPRINTY.md
├── apps/
│   ├── web/          # Astro 5 + Svelte 5 + Tailwind CSS v4
│   └── api/          # Hono + Effect na CF Workers
└── packages/
    ├── shared/       # Sdilene typy, konstanty (programy, kategorie)
    └── db/           # Drizzle schema (poptavky)
```

## Design reference
- Vizualni inspirace: Astro Gym Fitness Website (sudeep2003)
- Barevna paleta: navy #0D1B2E, zlata #F5A623, zelena #2ECC71, modra #3498DB, cervena #E74C3C
- Fonty: Syne (nadpisy), DM Sans (telo textu)
- Tmave pozadi + zlate akcenty, profesionalni B2B ton

## Dulezite soubory
- `docs/SPRINTY.md` — rozplanovane sprinty podle kapitol zadani
- `README.md` — kompletni zadani webu (specifikace)
