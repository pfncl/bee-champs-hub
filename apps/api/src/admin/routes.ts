/**
 * Admin API routes — CRUD pro programy, kategorie, reference, nastaveni, poptavky
 */
import { Hono } from "hono"
import { Effect, Schema, pipe } from "effect"
import { eq, desc, asc } from "drizzle-orm"
import { programs, categories, testimonials, settings, inquiries } from "@bee-champs/db"
import type { Env } from "../types"
import { makeHonoRuntime } from "../runtime"
import { DbRepository, DbRepositoryLive } from "../db"
import { NotFoundError, ValidationError } from "../errors"
import { LoginRequest, ProgramInput, CategoryInput, TestimonialInput } from "./schema"
import { adminAuth } from "./middleware"

const admin = new Hono<{ Bindings: Env }>()

const withDb = makeHonoRuntime((env) => DbRepositoryLive(env.DB))

// === Helpers ===

const decodeBody = <A, I>(
  schema: Schema.Schema<A, I>,
  c: { readonly req: { readonly json: () => Promise<unknown> } },
): Effect.Effect<A, ValidationError> =>
  Effect.gen(function* () {
    const raw = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ValidationError({ message: "Neplatny JSON" }),
    })
    const decode = Schema.decodeUnknown(schema)
    const decoded = decode(raw)
    return yield* pipe(
      decoded,
      Effect.mapError((e) => new ValidationError({ message: "Neplatna data", detail: String(e) })),
    )
  })

const parseId = (raw: string): Effect.Effect<number, ValidationError> => {
  const id = Number(raw)
  return Number.isFinite(id) && id > 0
    ? Effect.succeed(id)
    : Effect.fail(new ValidationError({ message: `Neplatne ID: ${raw}` }))
}

// === Login (PRED middleware — neni chraneny tokenem) ===

admin.post("/login", withDb((c) =>
  Effect.gen(function* () {
    const body = yield* decodeBody(LoginRequest, c)
    if (body.token === c.env.ADMIN_TOKEN) {
      const isProduction = c.env.ENVIRONMENT === "production"
      const cookie = `admin_token=${body.token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`
      c.header("Set-Cookie", cookie)
      return c.json({ data: { success: true } }, 200)
    }
    return c.json({ error: "Neplatny token" }, 401)
  })
))

admin.post("/logout", withDb((c) =>
  Effect.gen(function* () {
    const isProduction = c.env.ENVIRONMENT === "production"
    c.header("Set-Cookie", `admin_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isProduction ? "; Secure" : ""}`)
    return c.json({ data: { success: true } })
  })
))

// Vsechny ostatni admin routes chranene tokenem
admin.use("*", adminAuth)

// ==================== PROGRAMY ====================

admin.get("/programs", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) => d1.select().from(programs).orderBy(asc(programs.sortOrder)))
    return c.json({ data: rows })
  })
))

admin.post("/programs", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const body = yield* decodeBody(ProgramInput, c)
    const result = yield* db.query((d1) =>
      d1.insert(programs).values({
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
    )
    return c.json({ data: result[0] }, 201)
  })
))

admin.put("/programs/:id", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const id = yield* parseId(c.req.param("id") ?? "")
    const body = yield* decodeBody(ProgramInput, c)
    const result = yield* db.query((d1) =>
      d1.update(programs).set({
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
    )
    if (result.length === 0) return yield* Effect.fail(new NotFoundError({ entity: "Program", id }))
    return c.json({ data: result[0] })
  })
))

admin.delete("/programs/:id", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const id = yield* parseId(c.req.param("id") ?? "")
    yield* db.query((d1) => d1.delete(programs).where(eq(programs.id, id)))
    return c.json({ data: { success: true } })
  })
))

// ==================== KATEGORIE ====================

admin.get("/categories", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) => d1.select().from(categories).orderBy(asc(categories.sortOrder)))
    return c.json({ data: rows })
  })
))

admin.put("/categories/:id", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const id = yield* parseId(c.req.param("id") ?? "")
    const body = yield* decodeBody(CategoryInput, c)
    const result = yield* db.query((d1) =>
      d1.update(categories).set({
        name: body.name,
        label: body.label,
        icon: body.icon,
        color: body.color,
        description: body.description,
      }).where(eq(categories.id, id)).returning()
    )
    if (result.length === 0) return yield* Effect.fail(new NotFoundError({ entity: "Kategorie", id }))
    return c.json({ data: result[0] })
  })
))

// ==================== REFERENCE ====================

admin.get("/testimonials", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) => d1.select().from(testimonials).orderBy(asc(testimonials.sortOrder)))
    return c.json({ data: rows })
  })
))

admin.post("/testimonials", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const body = yield* decodeBody(TestimonialInput, c)
    const result = yield* db.query((d1) =>
      d1.insert(testimonials).values({
        text: body.text,
        name: body.name,
        role: body.role,
        initials: body.initials,
        sortOrder: body.sortOrder ?? 0,
      }).returning()
    )
    return c.json({ data: result[0] }, 201)
  })
))

admin.put("/testimonials/:id", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const id = yield* parseId(c.req.param("id") ?? "")
    const body = yield* decodeBody(TestimonialInput, c)
    const result = yield* db.query((d1) =>
      d1.update(testimonials).set({
        text: body.text,
        name: body.name,
        role: body.role,
        initials: body.initials,
        active: body.active,
        sortOrder: body.sortOrder,
      }).where(eq(testimonials.id, id)).returning()
    )
    if (result.length === 0) return yield* Effect.fail(new NotFoundError({ entity: "Reference", id }))
    return c.json({ data: result[0] })
  })
))

admin.delete("/testimonials/:id", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const id = yield* parseId(c.req.param("id") ?? "")
    yield* db.query((d1) => d1.delete(testimonials).where(eq(testimonials.id, id)))
    return c.json({ data: { success: true } })
  })
))

// ==================== NASTAVENI ====================

admin.get("/settings", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) => d1.select().from(settings))
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return c.json({ data: result })
  })
))

admin.put("/settings", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const body = yield* Effect.tryPromise({
      try: () => c.req.json() as Promise<Record<string, string>>,
      catch: () => new ValidationError({ message: "Neplatny JSON" }),
    })
    yield* Effect.forEach(
      Object.entries(body),
      ([key, value]) => db.query((d1) =>
        d1.insert(settings).values({ key, value })
          .onConflictDoUpdate({ target: settings.key, set: { value } })
      ),
      { concurrency: 1 },
    )
    return c.json({ data: { success: true } })
  })
))

// ==================== POPTAVKY ====================

admin.get("/inquiries", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const rows = yield* db.query((d1) => d1.select().from(inquiries).orderBy(desc(inquiries.createdAt)))
    return c.json({ data: rows })
  })
))

admin.get("/inquiries/:id", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const id = yield* parseId(c.req.param("id") ?? "")
    const rows = yield* db.query((d1) => d1.select().from(inquiries).where(eq(inquiries.id, id)))
    if (rows.length === 0) return yield* Effect.fail(new NotFoundError({ entity: "Poptavka", id }))
    return c.json({ data: rows[0] })
  })
))

admin.delete("/inquiries/:id", withDb((c) =>
  Effect.gen(function* () {
    const db = yield* DbRepository
    const id = yield* parseId(c.req.param("id") ?? "")
    yield* db.query((d1) => d1.delete(inquiries).where(eq(inquiries.id, id)))
    return c.json({ data: { success: true } })
  })
))

export { admin }
