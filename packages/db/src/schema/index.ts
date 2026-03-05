import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

// Tabulka poptavek
export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Skola
  schoolName: text("school_name").notNull(),
  schoolType: text("school_type").notNull(),
  city: text("city").notNull(),
  childrenCount: integer("children_count").notNull(),
  ageRange: text("age_range").notNull(),

  // Kontakt
  contactName: text("contact_name").notNull(),
  contactPosition: text("contact_position"),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),

  // Doplnujici info
  hasGym: text("has_gym"),
  hasPlayground: text("has_playground"),
  notes: text("notes"),

  // Vybrane programy (JSON pole s mesici)
  selectedPrograms: text("selected_programs").notNull(),

  // Meta
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
})
