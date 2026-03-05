/**
 * Verejne API routes — data pro frontend (bez auth)
 */
import { Hono } from "hono"
import { Effect } from "effect"
import { eq, asc } from "drizzle-orm"
import { programs, categories, testimonials, settings } from "@bee-champs/db"
import type { Env } from "../types"
import { makeHonoRuntime } from "../runtime"
import { DbRepository, DbRepositoryLive } from "../db"

const publicRoutes = new Hono<{ Bindings: Env }>()

const withDb = makeHonoRuntime((env) => DbRepositoryLive(env.DB))

// Mapovani DB programu na frontend format (slug->id, categorySlug->category)
const mapProgram = (row: typeof programs.$inferSelect) => ({
  id: row.slug,
  category: row.categorySlug,
  name: row.name,
  icon: row.icon,
  description: row.description,
  ageRange: row.ageRange,
  duration: row.duration,
  instructors: row.instructors,
})

// Mapovani DB kategorie na frontend format
const mapCategory = (row: typeof categories.$inferSelect) => ({
  slug: row.slug,
  name: row.name,
  label: row.label,
  icon: row.icon,
  color: row.color,
  description: row.description,
})

// Cache header — staticka data, meni se jen v adminu
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
} as const

// Vsechny aktivni programy
publicRoutes.get("/programs", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) =>
      d1.select().from(programs)
        .where(eq(programs.active, true))
        .orderBy(asc(programs.sortOrder))
    )
    return c.json({ data: rows.map(mapProgram) }, 200, CACHE_HEADERS)
  })
))

// Programy dle kategorie
publicRoutes.get("/programs/:categorySlug", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const slug = c.req.param("categorySlug") ?? ""
    const rows = yield* db.query((d1) =>
      d1.select().from(programs)
        .where(eq(programs.categorySlug, slug))
        .orderBy(asc(programs.sortOrder))
    )
    return c.json({ data: rows.filter((r) => r.active).map(mapProgram) }, 200, CACHE_HEADERS)
  })
))

// Vsechny kategorie
publicRoutes.get("/categories", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) =>
      d1.select().from(categories).orderBy(asc(categories.sortOrder))
    )
    return c.json({ data: rows.map(mapCategory) }, 200, CACHE_HEADERS)
  })
))

// Aktivni reference
publicRoutes.get("/testimonials", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) =>
      d1.select().from(testimonials)
        .where(eq(testimonials.active, true))
        .orderBy(asc(testimonials.sortOrder))
    )
    return c.json({ data: rows }, 200, CACHE_HEADERS)
  })
))

// Verejne nastaveni (statistiky apod.)
publicRoutes.get("/settings/public", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) => d1.select().from(settings))
    const publicKeys = ["stat1_value", "stat1_label", "stat2_value", "stat2_label", "stat3_value", "stat3_label"]
    const result: Record<string, string> = {}
    for (const row of rows) {
      if (publicKeys.includes(row.key)) {
        result[row.key] = row.value
      }
    }
    return c.json({ data: result }, 200, CACHE_HEADERS)
  })
))

export { publicRoutes }
