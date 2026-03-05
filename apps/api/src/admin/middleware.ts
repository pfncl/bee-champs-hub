/**
 * Admin auth middleware — kontroluje ADMIN_TOKEN v cookie nebo headeru
 */
import type { Context, Next } from "hono"
import type { Env } from "../types"

type HonoContext = Context<{ Bindings: Env }>

export const adminAuth = async (c: HonoContext, next: Next) => {
  const token = c.env.ADMIN_TOKEN
  if (!token) {
    return c.json({ error: "Admin neni nakonfigurovan" }, 503)
  }

  // Token z cookie nebo Authorization headeru
  const cookie = c.req.header("cookie") ?? ""
  const cookieToken = cookie.match(/admin_token=([^;]+)/)?.[1]
  const headerToken = c.req.header("authorization")?.replace("Bearer ", "")

  if (cookieToken !== token && headerToken !== token) {
    return c.json({ error: "Neautorizovany pristup" }, 401)
  }

  await next()
}
