/**
 * Superadmin API routes — dashboard stats, D1 konzole, worker logy, cache purge
 */
import { Hono } from "hono"
import { drizzle } from "drizzle-orm/d1"
import { sql } from "drizzle-orm"
import type { Env } from "../types"
import { superadminAuth } from "./middleware"

const CF_ACCOUNT_ID = "a6f73612807840e33437c92d3771f8be"
const CF_D1_DATABASE_ID = "0462ef41-dd80-47e5-baa5-7e8814546e14"

const superadmin = new Hono<{ Bindings: Env }>()

// Login PRED middleware
superadmin.post("/login", async (c) => {
  const { token } = await c.req.json() as { token: string }
  if (token === c.env.SUPERADMIN_TOKEN) {
    const isProduction = c.env.ENVIRONMENT === "production"
    const cookie = `superadmin_token=${token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`
    c.header("Set-Cookie", cookie)
    return c.json({ data: { success: true } }, 200)
  }
  return c.json({ error: "Neplatny token" }, 401)
})

// Logout — smaze HttpOnly cookie
superadmin.post("/logout", async (c) => {
  const isProduction = c.env.ENVIRONMENT === "production"
  c.header("Set-Cookie", `superadmin_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`)
  return c.json({ data: { success: true } })
})

// Vsechny ostatni routes chranene tokenem
superadmin.use("*", superadminAuth)

// ==================== DASHBOARD STATS ====================

superadmin.get("/stats", async (c) => {
  const db = drizzle(c.env.DB)
  try {
    const [programsCount, categoriesCount, inquiriesCount, testimonialsCount, settingsCount] = await Promise.all([
      db.all(sql`SELECT COUNT(*) as count FROM programs`),
      db.all(sql`SELECT COUNT(*) as count FROM categories`),
      db.all(sql`SELECT COUNT(*) as count FROM inquiries`),
      db.all(sql`SELECT COUNT(*) as count FROM testimonials`),
      db.all(sql`SELECT COUNT(*) as count FROM settings`),
    ])
    return c.json({
      data: {
        programs: (programsCount[0] as { count: number })?.count ?? 0,
        categories: (categoriesCount[0] as { count: number })?.count ?? 0,
        inquiries: (inquiriesCount[0] as { count: number })?.count ?? 0,
        testimonials: (testimonialsCount[0] as { count: number })?.count ?? 0,
        settings: (settingsCount[0] as { count: number })?.count ?? 0,
      },
    })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// ==================== D1 KONZOLE ====================

superadmin.post("/d1/query", async (c) => {
  const { sql: sqlQuery } = await c.req.json() as { sql: string }
  if (!sqlQuery?.trim()) {
    return c.json({ error: "SQL dotaz je prazdny" }, 400)
  }

  // Blokuj destruktivni DDL prikazy
  const forbidden = /^\s*(DROP\s+TABLE|DROP\s+DATABASE|ALTER\s+TABLE\s+\w+\s+RENAME|ATTACH|DETACH|PRAGMA\s+(?!table_info|table_list))/i
  if (forbidden.test(sqlQuery)) {
    return c.json({ error: "Tento prikaz je zakazany v D1 konzoli" }, 403)
  }

  try {
    const db = c.env.DB
    console.log(`[D1 Konzole] ${sqlQuery.slice(0, 200)}`)
    const stmt = db.prepare(sqlQuery)
    const result = await stmt.all()
    return c.json({
      data: {
        results: result.results ?? [],
        meta: result.meta ?? {},
      },
    })
  } catch (e) {
    return c.json({ error: String(e) }, 400)
  }
})

// D1 export pres Cloudflare REST API
superadmin.post("/d1/export", async (c) => {
  const cfToken = c.env.CF_API_TOKEN
  if (!cfToken) {
    return c.json({ error: "CF_API_TOKEN neni nastaven" }, 503)
  }

  try {
    // Zahajit export
    const exportRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/export`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          output_format: "polling",
          dump_options: { no_schema: false, no_data: false, tables: [] },
        }),
      }
    )

    if (!exportRes.ok) {
      const text = await exportRes.text()
      return c.json({ error: `CF API: ${exportRes.status} ${text}` }, 500)
    }

    const exportData = await exportRes.json() as {
      result: { filename: string; signed_url?: string; status?: string; at_bookmark?: string }
    }

    // Polling — cekame na dokonceni (max 30s)
    const startTime = Date.now()
    let currentBookmark = exportData.result.at_bookmark ?? ""

    while (Date.now() - startTime < 30000) {
      const pollRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/export`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            output_format: "polling",
            current_bookmark: currentBookmark,
            dump_options: { no_schema: false, no_data: false, tables: [] },
          }),
        }
      )

      if (!pollRes.ok) break

      const pollData = await pollRes.json() as {
        result: { status: string; signed_url?: string; at_bookmark?: string }
      }

      if (pollData.result.status === "complete" && pollData.result.signed_url) {
        return c.json({ data: { url: pollData.result.signed_url } })
      }

      currentBookmark = pollData.result.at_bookmark ?? currentBookmark
      await new Promise(r => setTimeout(r, 1000))
    }

    return c.json({ error: "Export timeout" }, 504)
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// ==================== WORKER LOGY ====================

superadmin.post("/logs/tail", async (c) => {
  const cfToken = c.env.CF_API_TOKEN
  if (!cfToken) {
    return c.json({ error: "CF_API_TOKEN neni nastaven" }, 503)
  }

  const { scriptName } = await c.req.json() as { scriptName: string }
  const allowed = ["bee-champs-hub-api", "bee-champs-hub-web"]
  if (!allowed.includes(scriptName)) {
    return c.json({ error: `Neplatny worker: ${scriptName}` }, 400)
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${scriptName}/tails`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return c.json({ error: `CF API: ${res.status} ${text}` }, 500)
    }

    const data = await res.json() as {
      result: { id: string; url: string; expires_at: string }
    }

    return c.json({
      data: {
        id: data.result.id,
        url: data.result.url,
        expiresAt: data.result.expires_at,
        scriptName,
      },
    })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

superadmin.delete("/logs/tail/:tailId", async (c) => {
  const cfToken = c.env.CF_API_TOKEN
  if (!cfToken) {
    return c.json({ error: "CF_API_TOKEN neni nastaven" }, 503)
  }

  const tailId = c.req.param("tailId")
  const body = await c.req.json().catch(() => ({})) as { scriptName?: string }
  const scriptName = body.scriptName ?? c.req.query("scriptName") ?? "bee-champs-hub-api"

  try {
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${scriptName}/tails/${tailId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${cfToken}` },
      }
    )
    return c.json({ data: { success: true } })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// ==================== CACHE PURGE ====================

superadmin.post("/cache/purge", async (c) => {
  const cfToken = c.env.CF_API_TOKEN
  if (!cfToken) {
    return c.json({ error: "CF_API_TOKEN neni nastaven" }, 503)
  }

  const body = await c.req.json() as { purgeEverything?: boolean; files?: string[] }

  // Potrebujeme zone ID — pouzijeme env nebo konstantu
  const zoneId = "beechampshub.cz"

  try {
    // Nejdriv ziskame zone ID z API
    const zonesRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${zoneId}`,
      {
        headers: { Authorization: `Bearer ${cfToken}` },
      }
    )

    let cfZoneId: string | null = null
    if (zonesRes.ok) {
      const zonesData = await zonesRes.json() as { result: { id: string }[] }
      cfZoneId = zonesData.result?.[0]?.id ?? null
    }

    if (!cfZoneId) {
      return c.json({ error: "Zona nenalezena. Cache purge vyzaduje CF zone." }, 400)
    }

    const purgeBody = body.purgeEverything
      ? { purge_everything: true }
      : { files: body.files ?? [] }

    const purgeRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purgeBody),
      }
    )

    if (!purgeRes.ok) {
      const text = await purgeRes.text()
      return c.json({ error: `CF API: ${purgeRes.status} ${text}` }, 500)
    }

    const purgeData = await purgeRes.json() as { result: { id: string } }
    return c.json({ data: { ok: true, id: purgeData.result?.id } })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

export { superadmin }
