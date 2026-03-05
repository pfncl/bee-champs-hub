/**
 * Admin API routes — CRUD pro programy, kategorie, reference, nastaveni, poptavky
 */
import { Hono } from "hono"
import { drizzle } from "drizzle-orm/d1"
import { eq, desc, asc } from "drizzle-orm"
import { programs, categories, testimonials, settings, inquiries } from "@bee-champs/db"
import type { Env } from "../types"
import { adminAuth } from "./middleware"

const admin = new Hono<{ Bindings: Env }>()

// Login PRED middleware — neni chraneny tokenem
admin.post("/login", async (c) => {
  const { token } = await c.req.json() as { token: string }
  if (token === c.env.ADMIN_TOKEN) {
    const isProduction = c.env.ENVIRONMENT === "production"
    const cookie = `admin_token=${token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`
    c.header("Set-Cookie", cookie)
    return c.json({ data: { success: true } }, 200)
  }
  return c.json({ error: "Neplatny token" }, 401)
})

// Logout — smaze HttpOnly cookie
admin.post("/logout", async (c) => {
  const isProduction = c.env.ENVIRONMENT === "production"
  c.header("Set-Cookie", `admin_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`)
  return c.json({ data: { success: true } })
})

// Vsechny ostatni admin routes chranene tokenem
admin.use("*", adminAuth)

// ==================== PROGRAMY ====================

// Seznam vsech programu
admin.get("/programs", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(programs).orderBy(asc(programs.sortOrder))
  return c.json({ data: rows })
})

// Vytvorit program
admin.post("/programs", async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  const result = await db.insert(programs).values({
    slug: body.slug,
    categorySlug: body.categorySlug,
    name: body.name,
    icon: body.icon,
    description: body.description,
    ageRange: body.ageRange,
    duration: body.duration,
    instructors: body.instructors,
    sortOrder: body.sortOrder ?? 0,
  }).returning()
  return c.json({ data: result[0] }, 201)
})

// Upravit program
admin.put("/programs/:id", async (c) => {
  const db = drizzle(c.env.DB)
  const id = Number(c.req.param("id"))
  const body = await c.req.json()
  const result = await db.update(programs).set({
    name: body.name,
    slug: body.slug,
    categorySlug: body.categorySlug,
    icon: body.icon,
    description: body.description,
    ageRange: body.ageRange,
    duration: body.duration,
    instructors: body.instructors,
    active: body.active,
    sortOrder: body.sortOrder,
  }).where(eq(programs.id, id)).returning()
  if (result.length === 0) return c.json({ error: "Program nenalezen" }, 404)
  return c.json({ data: result[0] })
})

// Smazat program
admin.delete("/programs/:id", async (c) => {
  const db = drizzle(c.env.DB)
  const id = Number(c.req.param("id"))
  await db.delete(programs).where(eq(programs.id, id))
  return c.json({ data: { success: true } })
})

// ==================== KATEGORIE ====================

admin.get("/categories", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder))
  return c.json({ data: rows })
})

admin.put("/categories/:id", async (c) => {
  const db = drizzle(c.env.DB)
  const id = Number(c.req.param("id"))
  const body = await c.req.json()
  const result = await db.update(categories).set({
    name: body.name,
    label: body.label,
    icon: body.icon,
    color: body.color,
    description: body.description,
  }).where(eq(categories.id, id)).returning()
  if (result.length === 0) return c.json({ error: "Kategorie nenalezena" }, 404)
  return c.json({ data: result[0] })
})

// ==================== REFERENCE ====================

admin.get("/testimonials", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(testimonials).orderBy(asc(testimonials.sortOrder))
  return c.json({ data: rows })
})

admin.post("/testimonials", async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json()
  const result = await db.insert(testimonials).values({
    text: body.text,
    name: body.name,
    role: body.role,
    initials: body.initials,
    sortOrder: body.sortOrder ?? 0,
  }).returning()
  return c.json({ data: result[0] }, 201)
})

admin.put("/testimonials/:id", async (c) => {
  const db = drizzle(c.env.DB)
  const id = Number(c.req.param("id"))
  const body = await c.req.json()
  const result = await db.update(testimonials).set({
    text: body.text,
    name: body.name,
    role: body.role,
    initials: body.initials,
    active: body.active,
    sortOrder: body.sortOrder,
  }).where(eq(testimonials.id, id)).returning()
  if (result.length === 0) return c.json({ error: "Reference nenalezena" }, 404)
  return c.json({ data: result[0] })
})

admin.delete("/testimonials/:id", async (c) => {
  const db = drizzle(c.env.DB)
  const id = Number(c.req.param("id"))
  await db.delete(testimonials).where(eq(testimonials.id, id))
  return c.json({ data: { success: true } })
})

// ==================== NASTAVENI ====================

admin.get("/settings", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(settings)
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return c.json({ data: result })
})

admin.put("/settings", async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json() as Record<string, string>
  for (const [key, value] of Object.entries(body)) {
    await db.insert(settings).values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
  }
  return c.json({ data: { success: true } })
})

// ==================== POPTAVKY ====================

admin.get("/inquiries", async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt))
  return c.json({ data: rows })
})

admin.get("/inquiries/:id", async (c) => {
  const db = drizzle(c.env.DB)
  const id = Number(c.req.param("id"))
  const rows = await db.select().from(inquiries).where(eq(inquiries.id, id))
  if (rows.length === 0) return c.json({ error: "Poptavka nenalezena" }, 404)
  return c.json({ data: rows[0] })
})

admin.delete("/inquiries/:id", async (c) => {
  const db = drizzle(c.env.DB)
  const id = Number(c.req.param("id"))
  await db.delete(inquiries).where(eq(inquiries.id, id))
  return c.json({ data: { success: true } })
})

export { admin }
