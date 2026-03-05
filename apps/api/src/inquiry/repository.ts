/**
 * InquiryRepository — pristup k DB pro poptavky
 */
import { Context, Data, Effect, Layer } from "effect"
import { drizzle } from "drizzle-orm/d1"
import { inquiries } from "@bee-champs/db"

// === Chyby ===

export class InquiryInsertError extends Data.TaggedError("InquiryInsertError")<{
  readonly cause: unknown
}> {}

// === Typy ===

export interface InquiryInput {
  readonly schoolName: string
  readonly schoolType: string
  readonly city: string
  readonly childrenCount: number
  readonly ageRange: string
  readonly contactName: string
  readonly contactPosition: string | undefined
  readonly contactPhone: string
  readonly contactEmail: string
  readonly hasGym: string | undefined
  readonly hasPlayground: string | undefined
  readonly notes: string | undefined
  readonly selectedPrograms: string
}

// === Service ===

export interface InquiryRepository {
  readonly insert: (data: InquiryInput) => Effect.Effect<{ id: number }, InquiryInsertError>
}

export const InquiryRepository = Context.GenericTag<InquiryRepository>("InquiryRepository")

// === Live implementace ===

export const InquiryRepositoryLive = (db: D1Database): Layer.Layer<InquiryRepository> =>
  Layer.succeed(InquiryRepository, {
    insert: (data) =>
      Effect.tryPromise({
        try: () => {
          const d1 = drizzle(db)
          return d1.insert(inquiries).values({
            schoolName: data.schoolName,
            schoolType: data.schoolType,
            city: data.city,
            childrenCount: data.childrenCount,
            ageRange: data.ageRange,
            contactName: data.contactName,
            contactPosition: data.contactPosition ?? null,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
            hasGym: data.hasGym ?? null,
            hasPlayground: data.hasPlayground ?? null,
            notes: data.notes ?? null,
            selectedPrograms: data.selectedPrograms,
          }).returning({ id: inquiries.id })
        },
        catch: (cause) => new InquiryInsertError({ cause }),
      }).pipe(
        Effect.map((rows) => ({ id: rows[0]!.id }))
      ),
  })
