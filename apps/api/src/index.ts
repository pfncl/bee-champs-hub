import { Hono } from "hono"
import { cors } from "hono/cors"
import { makeHonoRuntime } from "./runtime"
import { InquiryRepositoryLive } from "./inquiry/repository"
import { handleCreateInquiry } from "./inquiry/route"

type Env = {
  readonly DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.use("*", cors())

app.get("/health", (c) => c.json({ status: "ok" }))

const withInquiry = makeHonoRuntime((env) => InquiryRepositoryLive(env.DB))
app.post("/inquiries", withInquiry(handleCreateInquiry))

export default app
