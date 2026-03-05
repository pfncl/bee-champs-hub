/**
 * makeHonoRuntime — wrapper pro Hono handlery s Effect ManagedRuntime
 *
 * Vytvari ManagedRuntime z Layer na zaklade env bindingu (D1, KV...).
 * Kazdy request dostane vlastni runtime s pristupem ke vsem sluzbam.
 */
import { Effect, Layer, ManagedRuntime } from "effect"
import type { Context } from "hono"
import type { Env } from "./types"

type HonoContext = Context<{ readonly Bindings: Env }>

export const makeHonoRuntime = <R>(
  layerBuilder: (env: Env) => Layer.Layer<R, never, never>
) => (
  handler: (c: HonoContext) => Effect.Effect<Response, never, R>
) => (c: HonoContext): Promise<Response> =>
  ManagedRuntime.make(layerBuilder(c.env)).runPromise(
    Effect.catchAllDefect(handler(c), (defect) =>
      Effect.succeed(
        new Response(
          JSON.stringify({ error: "Internal Server Error", detail: String(defect) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      )
    )
  )
