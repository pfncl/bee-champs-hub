/**
 * makeHonoRuntime — wrapper pro Hono handlery s Effect ManagedRuntime
 *
 * Vytvari ManagedRuntime z Layer na zaklade env bindingu (D1, KV...).
 * Kazdy request dostane vlastni runtime s pristupem ke vsem sluzbam.
 * Automaticky mapuje TaggedError na HTTP odpovedi.
 */
import { Effect, Layer, ManagedRuntime, pipe } from "effect"
import type { Context } from "hono"
import type { Env } from "./types"
import type { DatabaseError, NotFoundError, ValidationError, ServiceUnavailableError, CloudflareApiError, UnauthorizedError } from "./errors"

type HonoContext = Context<{ readonly Bindings: Env }>
type AppError = DatabaseError | NotFoundError | ValidationError | ServiceUnavailableError | CloudflareApiError | UnauthorizedError

import type { ContentfulStatusCode } from "hono/utils/http-status"

const errorToStatus = (tag: string): ContentfulStatusCode => {
  const statusMap: Record<string, ContentfulStatusCode> = {
    DatabaseError: 500,
    NotFoundError: 404,
    ValidationError: 400,
    ServiceUnavailableError: 503,
    CloudflareApiError: 502,
    UnauthorizedError: 401,
  }
  return statusMap[tag] ?? 500
}

export const makeHonoRuntime = <R>(
  layerBuilder: (env: Env) => Layer.Layer<R, never, never>
) => (
  handler: (c: HonoContext) => Effect.Effect<Response, AppError, R>
) => (c: HonoContext): Promise<Response> => {
  const effect = handler(c)
  return ManagedRuntime.make(layerBuilder(c.env)).runPromise(
    pipe(
      effect,
      Effect.catchAll((error) =>
        Effect.succeed(
          c.json(
            { error: "message" in error ? error.message : String(error), detail: "detail" in error ? error.detail : undefined },
            errorToStatus("_tag" in error ? error._tag : ""),
          )
        )
      ),
      Effect.catchAllDefect((defect) =>
        Effect.succeed(
          c.json({ error: "Internal Server Error", detail: String(defect) }, 500)
        )
      ),
    )
  )
}
