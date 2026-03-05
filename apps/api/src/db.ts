/**
 * DbRepository — sdileny pristup k Drizzle DB pres Effect Layer
 *
 * Pouziti:
 *   const db = yield* DbRepository
 *   const rows = yield* db.query(() => d1.select().from(programs))
 */
import { Context, Effect, Layer } from "effect"
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1"
import { DatabaseError } from "./errors"

export interface DbRepository {
  /** Drizzle instance pro prime pouziti */
  readonly drizzle: DrizzleD1Database
  /** Obaleny DB dotaz s error handlingem */
  readonly query: <T>(fn: (db: DrizzleD1Database) => Promise<T>) => Effect.Effect<T, DatabaseError>
}

export const DbRepository = Context.GenericTag<DbRepository>("DbRepository")

export const DbRepositoryLive = (d1: D1Database): Layer.Layer<DbRepository> => {
  const db = drizzle(d1)
  return Layer.succeed(DbRepository, {
    drizzle: db,
    query: <T>(fn: (db: DrizzleD1Database) => Promise<T>) =>
      Effect.tryPromise({
        try: () => fn(db),
        catch: (cause) => new DatabaseError({ cause }),
      }),
  })
}
