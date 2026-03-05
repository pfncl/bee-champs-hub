import { Hono } from "hono"
import { cors } from "hono/cors"

type Env = {
  readonly DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.use("*", cors())

app.get("/health", (c) => c.json({ status: "ok" }))

export default app
