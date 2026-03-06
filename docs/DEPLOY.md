# Bee Champs Hub — Návod k nasazení (Deploy)

Tento dokument popisuje jak nasadit Bee Champs Hub na Cloudflare. Celý projekt běží jako **jeden Cloudflare Worker** — web (Astro SSR) i API endpointy (Effect TS) jsou součástí jednoho workeru.

## Prerekvizity

- **Node.js** >= 24
- **pnpm** >= 10 (`npm install -g pnpm`)
- **Cloudflare účet** (zdarma stačí)
- **Wrangler CLI** (nainstalovaný jako devDependency)

## Architektura

```
Cloudflare Worker: bee-champs-hub-web
├── Astro SSR stránky (/, /planovac, /admin, ...)
├── API endpointy (/api/*)
├── Cloudflare D1 databáze (SQLite)
└── Static assets (CSS, JS, obrázky)
```

Není žádný oddělený API worker — vše běží v jednom.

## 1. Konfigurace wrangler.jsonc

Soubor `wrangler.jsonc` je v repu s placeholder hodnotami (pro Deploy to Cloudflare button). Pro lokální vývoj a produkci vyplňte své hodnoty:

| Pole | Kde ho najdete |
|---|---|
| `account_id` | Přidejte — `npx wrangler whoami` |
| `d1_databases[0].database_id` | `npx wrangler d1 create bee-champs-db` (viz krok 3) |
| `kv_namespaces[0].id` | `npx wrangler kv namespace create SESSION` (viz krok 3) |
| `vars.APP_URL` | Vaše produkční URL |
| `routes` | Přidejte sekci s vaší custom doménou (volitelné) |

Aby git netrackoval vaše lokální změny:

```bash
git update-index --skip-worktree wrangler.jsonc
```

## 2. Cloudflare účet a nástroje

### Přihlášení přes Wrangler

```bash
npx wrangler login
```

Otevře se prohlížeč, přihlaste se do Cloudflare a autorizujte Wrangler.

## 3. Vytvoření D1 databáze a KV namespace

```bash
# Vytvořit D1 databázi
npx wrangler d1 create bee-champs-db
```

Výstup ukáže `database_id` — vložte ho do `wrangler.jsonc` jako `d1_databases[0].database_id`.

```bash
# Vytvořit KV namespace pro sessions
npx wrangler kv namespace create SESSION
```

Výstup ukáže `id` — vložte ho do `wrangler.jsonc` jako `kv_namespaces[0].id`.

```bash
# Spustit migrace na produkci
npx wrangler d1 migrations apply bee-champs-db --remote
```

Toto vytvoří tabulky v produkční D1 databázi.

## 4. Nastavení secrets

Secrets se nastaví přes CLI — NIKDY je nedávejte do kódu nebo wrangler.jsonc:

```bash
# Admin přihlašovací token (libovolný bezpečný řetězec)
npx wrangler secret put ADMIN_TOKEN

# Superadmin přihlašovací token
npx wrangler secret put SUPERADMIN_TOKEN

# Resend API klíč pro odesílání emailů (https://resend.com)
npx wrangler secret put RESEND_API_KEY

# Cloudflare API token (pro superadmin nástroje — logy, export DB, cache purge)
npx wrangler secret put CF_API_TOKEN
```

Každý příkaz vás vyzve k zadání hodnoty.

### Jak získat tokeny

- **ADMIN_TOKEN / SUPERADMIN_TOKEN**: Vygenerujte náhodný řetězec, např. `openssl rand -hex 32`
- **RESEND_API_KEY**: Zaregistrujte se na [resend.com](https://resend.com), vytvořte API klíč
- **CF_API_TOKEN**: V Cloudflare dashboard > My Profile > API Tokens > Create Token. Potřebuje oprávnění: `Account > Workers Scripts > Edit`, `Account > D1 > Edit`

## 5. Build a deploy

```bash
# Z kořene repozitáře
pnpm install
pnpm run deploy
```

Deploy script automaticky spustí build, aplikuje D1 migrace a nasadí worker.

Po úspěšném deployi se v terminálu zobrazí URL workeru (např. `https://bee-champs-hub-web.UZIVATEL.workers.dev`).

**Pozor:** `pnpm deploy` je rezervovaný příkaz pnpm — vždy používejte `pnpm run deploy`.

## 6. Custom doména (volitelné)

Do `wrangler.jsonc` přidejte sekci `routes`:

```jsonc
"routes": [
  { "pattern": "vase-domena.cz", "custom_domain": true }
]
```

Podmínka: doména musí být přidaná v Cloudflare DNS (stačí Free plan). Po deploy se automaticky vytvoří DNS záznam.

## 7. Lokální vývoj

```bash
# Nainstalovat závislosti
pnpm install

# Spustit dev server (Astro + Wrangler)
pnpm dev
```

Dev server běží na `http://localhost:4321`. Používá lokální D1 databázi (soubor v `.wrangler/`).

### Lokální secrets

Vytvořte soubor `apps/web/.dev.vars` (viz `.dev.vars.example`):

```
ADMIN_TOKEN=test-admin-token
SUPERADMIN_TOKEN=test-superadmin-token
RESEND_API_KEY=re_xxxxx
CF_API_TOKEN=xxxxx
```

Tento soubor je v `.gitignore` a používá se pouze lokálně.

## 8. Databázové migrace

Schéma je v `packages/db/src/schema/`. Pokud změníte schéma:

```bash
# Vygenerovat migraci
pnpm db:generate

# Aplikovat lokálně
npx wrangler d1 migrations apply bee-champs-db --local

# Aplikovat na produkci
npx wrangler d1 migrations apply bee-champs-db --remote
```

## 9. Struktura projektu

```
bee-champs/
├── wrangler.jsonc          # Cloudflare konfigurace (placeholder v gitu, lokálně vaše hodnoty)
├── .dev.vars.example       # Šablona secrets
├── apps/
│   └── web/              # Astro 5 + Svelte 5 + API (Effect TS)
│       ├── src/
│       │   ├── api/      # Sdílený API kód (runtime, auth, db, errors, schemas)
│       │   ├── pages/
│       │   │   ├── api/  # API endpointy (Astro server endpoints)
│       │   │   ├── admin/   # Admin panel
│       │   │   └── ...      # Veřejné stránky
│       │   ├── components/  # Svelte 5 komponenty
│       │   └── layouts/     # Astro layouty
│       └── .dev.vars        # Lokální secrets (ne v gitu)
├── packages/
│   ├── shared/           # Sdílené typy, kategorie, programy
│   └── db/               # Drizzle schéma + migrace
└── docs/                 # Dokumentace
```

## 10. Důležité URL

- **Produkční web**: URL z wrangler deploy nebo custom doména
- **Admin panel**: `/admin` (chráněno tokenem)
- **Superadmin**: `/superadmin` (chráněno tokenem)
- **API health check**: `/api/health`

## Řešení problémů

### D1 migrace selhává
Zkontrolujte že `database_id` v wrangler.jsonc odpovídá skutečné D1 databázi. Ověření: `npx wrangler d1 list`.
