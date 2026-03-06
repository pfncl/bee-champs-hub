# Bee Champs Hub - Navod k nasazeni (Deploy)

Tento dokument popisuje jak nasadit Bee Champs Hub na Cloudflare. Cely projekt bezi jako **jeden Cloudflare Worker** — web (Astro SSR) i API endpointy (Effect TS) jsou soucasti jednoho workeru.

## Prerekvizity

- **Node.js** >= 20
- **pnpm** >= 10 (`npm install -g pnpm`)
- **Cloudflare ucet** (zdarma staci)
- **Wrangler CLI** (nainstalovany jako devDependency)

## Architektura

```
Cloudflare Worker: bee-champs-hub-web
├── Astro SSR stranky (/, /planovac, /admin, ...)
├── API endpointy (/api/*)
├── Cloudflare D1 databaze (SQLite)
└── Static assets (CSS, JS, obrazky)
```

Neni zadny oddeleny API worker — vse bezi v jednom.

## 1. Cloudflare ucet a nastroje

### Prihlaseni pres Wrangler

```bash
npx wrangler login
```

Otevri se prohlizec, prihlaste se do Cloudflare a autorizujte Wrangler.

### Zjisteni Account ID

```bash
npx wrangler whoami
```

Account ID je v `wrangler.jsonc` — pokud deploujete na jiny ucet, zmente `account_id`.

## 2. Vytvoreni D1 databaze

```bash
npx wrangler d1 create bee-champs-db
```

Vystup ukaze `database_id` — vlozte ho do `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "bee-champs-db",
    "database_id": "VASE-DATABASE-ID",
    "migrations_dir": "packages/db/drizzle"
  }
]
```

### Vytvoreni KV namespace (pro Astro sessions)

```bash
npx wrangler kv namespace create SESSION
```

Vystup ukaze `id` — vlozte ho do `wrangler.jsonc` misto `SESSION_KV_ID`.

### Spusteni migrace

```bash
npx wrangler d1 migrations apply bee-champs-db --remote
```

Toto vytvori tabulky v produkcni D1 databazi.

## 3. Nastaveni secrets

Secrets se nastavi pres CLI — NIKDY je nedavejte do kodu nebo wrangler.jsonc:

```bash
# Admin prihlasovaci token (libovolny bezpecny retezec)
npx wrangler secret put ADMIN_TOKEN

# Superadmin prihlasovaci token
npx wrangler secret put SUPERADMIN_TOKEN

# Resend API klic pro odesilani emailu (https://resend.com)
npx wrangler secret put RESEND_API_KEY

# Cloudflare API token (pro superadmin nastroje — logy, export DB, cache purge)
npx wrangler secret put CF_API_TOKEN
```

Kazdy prikaz vas vyzve k zadani hodnoty.

### Jak ziskat tokeny

- **ADMIN_TOKEN / SUPERADMIN_TOKEN**: Vygenerujte nahodny retezec, napr. `openssl rand -hex 32`
- **RESEND_API_KEY**: Zaregistrujte se na [resend.com](https://resend.com), vytvorte API klic
- **CF_API_TOKEN**: V Cloudflare dashboard > My Profile > API Tokens > Create Token. Potrebuje opravneni: `Account > Workers Scripts > Edit`, `Account > D1 > Edit`

## 4. Build a deploy

```bash
# Z korene repozitare
pnpm install
pnpm deploy
```

To je ekvivalent:
```bash
pnpm --filter @bee-champs/web build && wrangler deploy
```

Po uspesnem deployi se v terminalu zobrazi URL workeru (napr. `https://bee-champs-hub-web.UZIVATEL.workers.dev`).

## 5. Custom domena (volitelne)

V `wrangler.jsonc` je sekce `routes`:

```jsonc
"routes": [
  { "pattern": "vase-domena.cz", "custom_domain": true }
]
```

Podminka: domena musi byt pridana v Cloudflare DNS (staci Free plan). Po deploy se automaticky vytvori DNS zaznam.

## 6. Lokalni vyvoj

```bash
# Nainstalovat zavislosti
pnpm install

# Spustit dev server (Astro + Wrangler)
pnpm dev
```

Dev server bezi na `http://localhost:4321`. Pouziva lokalni D1 databazi (soubor v `.wrangler/`).

### Lokalni secrets

Vytvorte soubor `apps/web/.dev.vars`:

```
ADMIN_TOKEN=test-admin-token
SUPERADMIN_TOKEN=test-superadmin-token
RESEND_API_KEY=re_xxxxx
CF_API_TOKEN=xxxxx
```

Tento soubor je v `.gitignore` a pouziva se pouze lokalne.

## 7. Databazove migrace

Schema je v `packages/db/src/schema/`. Pokud zmenite schema:

```bash
# Vygenerovat migraci
pnpm db:generate

# Aplikovat lokalne
npx wrangler d1 migrations apply bee-champs-db --local

# Aplikovat na produkci
npx wrangler d1 migrations apply bee-champs-db --remote
```

## 8. Struktura projektu

```
bee-champs/
├── wrangler.jsonc          # Cloudflare konfigurace (koren)
├── apps/
│   └── web/              # Astro 5 + Svelte 5 + API (Effect TS)
│       ├── src/
│       │   ├── api/      # Sdileny API kod (runtime, auth, db, errors, schemas)
│       │   ├── pages/
│       │   │   ├── api/  # API endpointy (Astro server endpoints)
│       │   │   ├── admin/   # Admin panel
│       │   │   └── ...      # Verejne stranky
│       │   ├── components/  # Svelte 5 komponenty
│       │   └── layouts/     # Astro layouty
│       └── .dev.vars        # Lokalni secrets (ne v gitu)
├── packages/
│   ├── shared/           # Sdilene typy, kategorie, programy
│   └── db/               # Drizzle schema + migrace
└── docs/                 # Dokumentace
```

## 9. Dulezite URL

- **Produkcni web**: URL z wrangler deploy nebo custom domena
- **Admin panel**: `/admin` (chraneno tokenem)
- **Superadmin**: `/superadmin` (chraneno tokenem)
- **API health check**: `/api/health`

## Reseni problemu

### D1 migrace selhava
Zkontrolujte ze `database_id` v wrangler.jsonc odpovida skutecne D1 databazi. Overeni: `npx wrangler d1 list`.
