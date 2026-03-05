# Bee Champs Hub

Plánovací platforma pro mateřské a základní školy. Školy si vyberou z desítek ověřených programů (sport, vzdělávání, projektové dny, pobyty), sestaví si roční harmonogram a odešlou jednu souhrnnou poptávku.

## Funkce

- **Roční plánovač** — interaktivní nástroj pro sestavení harmonogramu celého školního roku (září–srpen)
- **Katalog 26 programů** ve 4 kategoriích s kompletními metadaty (věk, délka, počet lektorů)
- **Jednotná poptávka** — jeden formulář pro libovolný počet programů najednou
- **4 kategorie**: Sportovní programy, Vzdělávací programy, Projektové dny, Akce a pobyty

## Tech stack

| Vrstva | Technologie |
|---|---|
| Frontend | Astro 5, Svelte 5, Tailwind CSS v4 |
| API | Hono, Effect TS |
| Databáze | Drizzle ORM, Cloudflare D1 (SQLite) |
| Infrastruktura | Cloudflare Workers |
| Monorepo | pnpm workspaces |

## Struktura projektu

```
apps/
  web/          Astro SSR frontend
  api/          Hono API worker
packages/
  shared/       Sdílené typy, kategorie, programy
  db/           Drizzle ORM schéma
docs/           Dokumentace a zadání
```

## Vývoj

```bash
# Instalace závislostí
pnpm install

# Spuštění dev serveru (web na :4321)
pnpm dev

# Build
pnpm build

# Deploy na Cloudflare Workers
pnpm deploy
```

## Deploy

- **Web**: https://bee-champs-hub-web.webmaster4329.workers.dev
- **API**: https://bee-champs-hub-api.webmaster4329.workers.dev

## Licence

Soukromý projekt.
