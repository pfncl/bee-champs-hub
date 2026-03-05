/**
 * Superadmin API routes — dashboard stats, D1 konzole, worker logy, cache purge
 */
import { Hono } from "hono"
import { Effect, Schema, pipe } from "effect"
import { drizzle } from "drizzle-orm/d1"
import { sql } from "drizzle-orm"
import type { Env } from "../types"
import { makeHonoRuntime } from "../runtime"
import { DbRepository, DbRepositoryLive } from "../db"
import { ValidationError, ServiceUnavailableError, CloudflareApiError } from "../errors"
import { superadminAuth } from "./middleware"

const superadmin = new Hono<{ Bindings: Env }>()

const withDb = makeHonoRuntime((env) => DbRepositoryLive(env.DB))

// === Helpers ===

const LoginRequest = Schema.Struct({ token: Schema.NonEmptyString })

const requireCfToken = (env: Env): Effect.Effect<string, ServiceUnavailableError> =>
  env.CF_API_TOKEN
    ? Effect.succeed(env.CF_API_TOKEN)
    : Effect.fail(new ServiceUnavailableError({ message: "CF_API_TOKEN neni nastaven" }))

const cfAccountId = (env: Env): string => env.CF_ACCOUNT_ID ?? "a6f73612807840e33437c92d3771f8be"
const cfD1DatabaseId = (env: Env): string => env.CF_D1_DATABASE_ID ?? "0462ef41-dd80-47e5-baa5-7e8814546e14"

const cfFetch = <T>(url: string, token: string, options?: RequestInit): Effect.Effect<T, CloudflareApiError> =>
  Effect.gen(function* () {
    const res = yield* Effect.tryPromise({
      try: () => fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options?.headers,
        },
      }),
      catch: (cause) => new CloudflareApiError({ message: `CF fetch selhal: ${String(cause)}` }),
    })

    if (!res.ok) {
      const text = yield* Effect.tryPromise({
        try: () => res.text(),
        catch: () => new CloudflareApiError({ message: `CF API: ${res.status}`, status: res.status }),
      })
      return yield* Effect.fail(new CloudflareApiError({ message: `CF API: ${res.status} ${text}`, status: res.status }))
    }

    return yield* Effect.tryPromise({
      try: () => res.json() as Promise<T>,
      catch: () => new CloudflareApiError({ message: "Neplatna CF API odpoved" }),
    })
  })

// === Login (PRED middleware) ===

superadmin.post("/login", withDb((c) =>
  Effect.gen(function* () {
    const raw = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ValidationError({ message: "Neplatny JSON" }),
    })
    const decode = Schema.decodeUnknown(LoginRequest)
    const decoded = decode(raw)
    const body = yield* pipe(
      decoded,
      Effect.mapError(() => new ValidationError({ message: "Neplatna data" })),
    )
    if (body.token === c.env.SUPERADMIN_TOKEN) {
      const isProduction = c.env.ENVIRONMENT === "production"
      const cookie = `superadmin_token=${body.token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`
      c.header("Set-Cookie", cookie)
      return c.json({ data: { success: true } }, 200)
    }
    return c.json({ error: "Neplatny token" }, 401)
  })
))

superadmin.post("/logout", withDb((c) =>
  Effect.gen(function* () {
    const isProduction = c.env.ENVIRONMENT === "production"
    c.header("Set-Cookie", `superadmin_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`)
    return c.json({ data: { success: true } })
  })
))

// Vsechny ostatni routes chranene tokenem
superadmin.use("*", superadminAuth)

// ==================== DASHBOARD STATS ====================

superadmin.get("/stats", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const countQuery = (table: string) =>
      db.query((d1) => d1.all<{ readonly count: number }>(sql.raw(`SELECT COUNT(*) as count FROM ${table}`)))

    const [prg, cat, inq, tst, stg] = yield* Effect.all([
      countQuery("programs"),
      countQuery("categories"),
      countQuery("inquiries"),
      countQuery("testimonials"),
      countQuery("settings"),
    ], { concurrency: "unbounded" })

    const getCount = (rows: ReadonlyArray<{ readonly count: number }>): number =>
      rows[0]?.count ?? 0

    return c.json({
      data: {
        programs: getCount(prg),
        categories: getCount(cat),
        inquiries: getCount(inq),
        testimonials: getCount(tst),
        settings: getCount(stg),
      },
    })
  })
))

// ==================== D1 KONZOLE ====================

superadmin.post("/d1/query", withDb((c) =>
  Effect.gen(function* () {
    const body = yield* Effect.tryPromise({
      try: () => c.req.json() as Promise<{ readonly sql?: string }>,
      catch: () => new ValidationError({ message: "Neplatny JSON" }),
    })
    const sqlQuery = body.sql?.trim() ?? ""
    if (sqlQuery === "") {
      return c.json({ error: "SQL dotaz je prazdny" }, 400)
    }

    // Blokuj destruktivni DDL prikazy
    const forbidden = /^\s*(DROP\s+TABLE|DROP\s+DATABASE|ALTER\s+TABLE\s+\w+\s+RENAME|ATTACH|DETACH|PRAGMA\s+(?!table_info|table_list))/i
    if (forbidden.test(sqlQuery)) {
      return c.json({ error: "Tento prikaz je zakazany v D1 konzoli" }, 403)
    }

    yield* Effect.logInfo(`[D1 Konzole] ${sqlQuery.slice(0, 200)}`)

    const result = yield* Effect.tryPromise({
      try: () => {
        const stmt = c.env.DB.prepare(sqlQuery)
        return stmt.all()
      },
      catch: (cause) => new ValidationError({ message: String(cause) }),
    })

    return c.json({
      data: {
        results: result.results ?? [],
        meta: result.meta ?? {},
      },
    })
  })
))

// D1 export pres Cloudflare REST API
superadmin.post("/d1/export", withDb((c) =>
  Effect.gen(function* () {
    const cfToken = yield* requireCfToken(c.env)
    const accountId = cfAccountId(c.env)
    const databaseId = cfD1DatabaseId(c.env)
    const exportUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/export`

    // Zahajit export
    const exportData = yield* cfFetch<{
      readonly result: { readonly filename: string; readonly signed_url?: string; readonly status?: string; readonly at_bookmark?: string }
    }>(exportUrl, cfToken, {
      method: "POST",
      body: JSON.stringify({
        output_format: "polling",
        dump_options: { no_schema: false, no_data: false, tables: [] },
      }),
    })

    // Polling — cekame na dokonceni (max 30s)
    const startTime = Date.now()
    let currentBookmark = exportData.result.at_bookmark ?? ""

    while (Date.now() - startTime < 30000) {
      const pollData = yield* cfFetch<{
        readonly result: { readonly status: string; readonly signed_url?: string; readonly at_bookmark?: string }
      }>(exportUrl, cfToken, {
        method: "POST",
        body: JSON.stringify({
          output_format: "polling",
          current_bookmark: currentBookmark,
          dump_options: { no_schema: false, no_data: false, tables: [] },
        }),
      })

      if (pollData.result.status === "complete" && pollData.result.signed_url) {
        return c.json({ data: { url: pollData.result.signed_url } })
      }

      currentBookmark = pollData.result.at_bookmark ?? currentBookmark
      yield* Effect.sleep("1 second")
    }

    return c.json({ error: "Export timeout" }, 504)
  })
))

// ==================== WORKER LOGY ====================

const ScriptNameRequest = Schema.Struct({ scriptName: Schema.NonEmptyString })
const ALLOWED_SCRIPTS = ["bee-champs-hub-api", "bee-champs-hub-web"] as const

superadmin.post("/logs/tail", withDb((c) =>
  Effect.gen(function* () {
    const cfToken = yield* requireCfToken(c.env)
    const rawBody = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ValidationError({ message: "Neplatny JSON" }),
    })
    const decodeScript = Schema.decodeUnknown(ScriptNameRequest)
    const decoded = decodeScript(rawBody)
    const body = yield* pipe(
      decoded,
      Effect.mapError(() => new ValidationError({ message: "Neplatna data" })),
    )

    if (!ALLOWED_SCRIPTS.includes(body.scriptName as typeof ALLOWED_SCRIPTS[number])) {
      return c.json({ error: `Neplatny worker: ${body.scriptName}` }, 400)
    }

    const accountId = cfAccountId(c.env)
    const data = yield* cfFetch<{
      readonly result: { readonly id: string; readonly url: string; readonly expires_at: string }
    }>(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${body.scriptName}/tails`,
      cfToken,
      { method: "POST", body: JSON.stringify({}) },
    )

    return c.json({
      data: {
        id: data.result.id,
        url: data.result.url,
        expiresAt: data.result.expires_at,
        scriptName: body.scriptName,
      },
    })
  })
))

superadmin.delete("/logs/tail/:tailId", withDb((c) =>
  Effect.gen(function* () {
    const cfToken = yield* requireCfToken(c.env)
    const tailId = c.req.param("tailId")
    const body = yield* Effect.tryPromise({
      try: () => c.req.json().catch(() => ({})) as Promise<{ readonly scriptName?: string }>,
      catch: () => new ValidationError({ message: "Neplatny JSON" }),
    })
    const scriptName = body.scriptName ?? c.req.query("scriptName") ?? "bee-champs-hub-api"
    const accountId = cfAccountId(c.env)

    yield* Effect.tryPromise({
      try: () => fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}/tails/${tailId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${cfToken}` } },
      ),
      catch: (cause) => new CloudflareApiError({ message: `Delete tail selhal: ${String(cause)}` }),
    })

    return c.json({ data: { success: true } })
  })
))

// ==================== CACHE PURGE ====================

const CachePurgeRequest = Schema.Struct({
  purgeEverything: Schema.optional(Schema.Boolean),
  files: Schema.optional(Schema.Array(Schema.String)),
})

superadmin.post("/cache/purge", withDb((c) =>
  Effect.gen(function* () {
    const cfToken = yield* requireCfToken(c.env)
    const rawPurge = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ValidationError({ message: "Neplatny JSON" }),
    })
    const decodePurge = Schema.decodeUnknown(CachePurgeRequest)
    const decoded = decodePurge(rawPurge)
    const body = yield* pipe(
      decoded,
      Effect.mapError(() => new ValidationError({ message: "Neplatna data" })),
    )

    const accountId = cfAccountId(c.env)

    // Ziskame zone ID z API
    const zonesData = yield* cfFetch<{
      readonly result: ReadonlyArray<{ readonly id: string }>
    }>(`https://api.cloudflare.com/client/v4/zones?name=beechampshub.cz`, cfToken)

    const cfZoneId = zonesData.result[0]?.id
    if (!cfZoneId) {
      return c.json({ error: "Zona nenalezena. Cache purge vyzaduje CF zone." }, 400)
    }

    const purgeBody = body.purgeEverything
      ? { purge_everything: true }
      : { files: body.files ?? [] }

    const purgeData = yield* cfFetch<{
      readonly result: { readonly id: string }
    }>(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`, cfToken, {
      method: "POST",
      body: JSON.stringify(purgeBody),
    })

    return c.json({ data: { ok: true, id: purgeData.result?.id } })
  })
))

export { superadmin }
