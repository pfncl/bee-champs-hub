/**
 * Verejne API routes — data pro frontend (bez auth)
 */
import { Hono } from "hono"
import { drizzle } from "drizzle-orm/d1"
import { eq, asc } from "drizzle-orm"
import { programs, categories, testimonials, settings } from "@bee-champs/db"
import type { Env } from "../types"

const publicRoutes = new Hono<{ Bindings: Env }>()

// Mapovani DB programu na frontend format (slug->id, categorySlug->category)
function mapProgram(row: typeof programs.$inferSelect) {
  return {
    id: row.slug,
    category: row.categorySlug,
    name: row.name,
    icon: row.icon,
    description: row.description,
    ageRange: row.ageRange,
    duration: row.duration,
    instructors: row.instructors,
  }
}

// Mapovani DB kategorie na frontend format (bez numerickeho id a sortOrder)
function mapCategory(row: typeof categories.$inferSelect) {
  return {
    slug: row.slug,
    name: row.name,
    label: row.label,
    icon: row.icon,
    color: row.color,
    description: row.description,
  }
}

// Cache header — staticka data, meni se jen v adminu
function setCacheHeaders(c: { header: (name: string, value: string) => void }) {
  c.header("Cache-Control", "public, max-age=300, s-maxage=600, stale-while-revalidate=86400")
}

// Vsechny aktivni programy
publicRoutes.get("/programs", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(programs)
    .where(eq(programs.active, true))
    .orderBy(asc(programs.sortOrder))
  setCacheHeaders(c)
  return c.json({ data: rows.map(mapProgram) })
})

// Programy dle kategorie
publicRoutes.get("/programs/:categorySlug", async (c) => {
  const db = drizzle(c.env.DB)
  const slug = c.req.param("categorySlug")
  const rows = await db.select().from(programs)
    .where(eq(programs.categorySlug, slug))
    .orderBy(asc(programs.sortOrder))
  setCacheHeaders(c)
  return c.json({ data: rows.filter(r => r.active).map(mapProgram) })
})

// Vsechny kategorie
publicRoutes.get("/categories", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
  setCacheHeaders(c)
  return c.json({ data: rows.map(mapCategory) })
})

// Aktivni reference
publicRoutes.get("/testimonials", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(testimonials)
    .where(eq(testimonials.active, true))
    .orderBy(asc(testimonials.sortOrder))
  setCacheHeaders(c)
  return c.json({ data: rows })
})

// Verejne nastaveni (statistiky apod.)
publicRoutes.get("/settings/public", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(settings)
  const publicKeys = ["stat1_value", "stat1_label", "stat2_value", "stat2_label", "stat3_value", "stat3_label"]
  const result: Record<string, string> = {}
  for (const row of rows) {
    if (publicKeys.includes(row.key)) {
      result[row.key] = row.value
    }
  }
  setCacheHeaders(c)
  return c.json({ data: result })
})

export { publicRoutes }
