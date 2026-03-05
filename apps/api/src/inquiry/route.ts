/**
 * POST /inquiries — prijme poptavku a ulozi do D1
 */
import { Effect, Schema } from "effect"
import type { Context } from "hono"
import { InquiryRequest } from "./schema"
import { InquiryRepository } from "./repository"

type Env = {
  readonly DB: D1Database
}

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
