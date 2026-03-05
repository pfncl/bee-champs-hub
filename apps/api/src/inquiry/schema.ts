/**
 * Validacni schema pro poptavkovy formular
 */
import { Schema } from "effect"

export class InquiryRequest extends Schema.Class<InquiryRequest>("InquiryRequest")({
  // Skola
  schoolName: Schema.NonEmptyString,
  schoolType: Schema.NonEmptyString,
  city: Schema.NonEmptyString,
  childrenCount: Schema.Number.pipe(Schema.positive(), Schema.int()),
  ageRange: Schema.NonEmptyString,

  // Kontakt
  contactName: Schema.NonEmptyString,
  contactPhone: Schema.NonEmptyString,
  contactEmail: Schema.NonEmptyString,

  // Volitelne
  contactPosition: Schema.optional(Schema.String),
  hasGym: Schema.optional(Schema.String),
  hasPlayground: Schema.optional(Schema.String),
  notes: Schema.optional(Schema.String),

  // Vybrane programy (JSON string)
  selectedPrograms: Schema.NonEmptyString,
}) {}
