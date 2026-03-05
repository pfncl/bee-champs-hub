/**
 * POST /inquiries — prijme poptavku, ulozi do D1, posle email notifikaci
 */
import { Effect, Schema } from "effect"
import type { Context } from "hono"
import type { Env } from "../types"
import { InquiryRequest } from "./schema"
import { InquiryRepository } from "./repository"
import { sendInquiryNotification } from "../utils/email"
import { drizzle } from "drizzle-orm/d1"
import { settings } from "@bee-champs/db"
import { eq } from "drizzle-orm"

type HonoContext = Context<{ readonly Bindings: Env }>

export const handleCreateInquiry = (c: HonoContext): Effect.Effect<Response, never, InquiryRepository> =>
  Effect.gen(function* () {
    // Parsuj a validuj request body
    const body = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => ({ type: "parse" as const, detail: "Neplatný JSON" }),
    })

    const decoded = yield* Schema.decodeUnknown(InquiryRequest)(body).pipe(
      Effect.mapError((parseError) => ({
        type: "validation" as const,
        detail: String(parseError),
      }))
    )

    // Uloz do DB
    const repo = yield* InquiryRepository
    const result = yield* repo.insert({
      schoolName: decoded.schoolName,
      schoolType: decoded.schoolType,
      city: decoded.city,
      childrenCount: decoded.childrenCount,
      ageRange: decoded.ageRange,
      contactName: decoded.contactName,
      contactPosition: decoded.contactPosition,
      contactPhone: decoded.contactPhone,
      contactEmail: decoded.contactEmail,
      hasGym: decoded.hasGym,
      hasPlayground: decoded.hasPlayground,
      notes: decoded.notes,
      selectedPrograms: decoded.selectedPrograms,
    }).pipe(
      Effect.mapError((insertError) => ({
        type: "db" as const,
        detail: String(insertError.cause),
      }))
    )

    // Email notifikace (fire-and-forget — nesmi blokovat odpoved)
    const resendKey = c.env.RESEND_API_KEY
    if (resendKey) {
      yield* Effect.catchAll(
        Effect.gen(function* () {
          const d1 = drizzle(c.env.DB)
          const rows = yield* Effect.tryPromise({
            try: () => d1.select().from(settings).where(eq(settings.key, "notification_emails")),
            catch: () => ({ type: "db" as const, detail: "Nelze nacist nastaveni" }),
          })
          const emails = rows[0]?.value?.split(",").map((e: string) => e.trim()).filter(Boolean) ?? []
          if (emails.length === 0) return

          const parsedPrograms: { name: string; month: string }[] = (() => {
            try {
              const arr = JSON.parse(decoded.selectedPrograms)
              if (!Array.isArray(arr)) return []
              return arr.flatMap((p: { name?: string; months?: string[]; month?: string }) => {
                const name = String(p.name ?? "")
                // Frontend posila months jako pole stringu (vice mesicu na program)
                if (Array.isArray(p.months) && p.months.length > 0) {
                  return [{ name, month: p.months.join(", ") }]
                }
                return [{ name, month: String(p.month ?? "") }]
              })
            } catch { return [] }
          })()

          // Kopie i na email kontaktni osoby
          const allRecipients = [...emails]
          if (decoded.contactEmail && !allRecipients.includes(decoded.contactEmail.trim())) {
            allRecipients.push(decoded.contactEmail.trim())
          }

          yield* sendInquiryNotification({
            apiKey: resendKey,
            to: allRecipients,
            schoolName: decoded.schoolName,
            schoolType: decoded.schoolType,
            contactName: decoded.contactName,
            contactEmail: decoded.contactEmail,
            contactPhone: decoded.contactPhone,
            contactPosition: decoded.contactPosition ?? "",
            city: decoded.city,
            childrenCount: decoded.childrenCount,
            ageRange: decoded.ageRange,
            hasGym: decoded.hasGym ?? "",
            hasPlayground: decoded.hasPlayground ?? "",
            notes: decoded.notes ?? "",
            programCount: parsedPrograms.length,
            programs: parsedPrograms,
            appUrl: c.env.APP_URL ?? "https://beechampshub.cz",
          })
        }),
        (err) => Effect.logWarning(`[Inquiry] Email notifikace selhala: ${String(err)}`),
      )
    }

    return c.json({ success: true, id: result.id }, 201)
  }).pipe(
    Effect.catchAll((error) =>
      Effect.succeed(
        c.json(
          { error: error.type === "validation" ? "Neplatná data" : error.type === "parse" ? "Neplatný JSON" : "Chyba při ukládání", detail: error.detail },
          error.type === "db" ? 500 : 400
        )
      )
    )
  )
