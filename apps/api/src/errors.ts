/**
 * Sdilene TaggedError tridy pro cely API
 */
import { Data } from "effect"

// === DB ===

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly cause: unknown
}> {}

// === Auth ===

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string
}> {}

export class ServiceUnavailableError extends Data.TaggedError("ServiceUnavailableError")<{
  readonly message: string
}> {}

// === Validace ===

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string
  readonly detail?: string
}> {}

// === CRUD ===

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly entity: string
  readonly id: number | string
}> {}

// === Cloudflare API ===

export class CloudflareApiError extends Data.TaggedError("CloudflareApiError")<{
  readonly message: string
  readonly status?: number
}> {}
