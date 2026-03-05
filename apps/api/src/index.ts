import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { makeHonoRuntime } from "./runtime"
import { InquiryRepositoryLive } from "./inquiry/repository"
import { handleCreateInquiry } from "./inquiry/route"
import { admin } from "./admin/routes"
import { superadmin } from "./superadmin/routes"
import { publicRoutes } from "./public/routes"
import type { Env } from "./types"

const app = new Hono<{ Bindings: Env }>()

const ALLOWED_ORIGINS = [
  "https://bee.pefen.dev",
  "https://beechampshub.cz",
  "https://www.beechampshub.cz",
  "https://bee-champs-hub-web.webmaster4329.workers.dev",
  "http://localhost:4321",
  "http://localhost:3000",
]

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return "*" // server-to-server (SSR)
    return ALLOWED_ORIGINS.includes(origin) ? origin : ""
  },
  credentials: true,
}))

app.use("*", logger())

app.get("/health", (c) => c.json({ status: "ok" }))

// Verejne API — programy, kategorie, reference (bez auth)
app.route("/api", publicRoutes)

// Admin API — chranene ADMIN_TOKEN
app.route("/admin", admin)

// Superadmin API — chranene SUPERADMIN_TOKEN
app.route("/superadmin", superadmin)

// Poptavky — Effect runtime
const withInquiry = makeHonoRuntime((env) => InquiryRepositoryLive(env.DB))
app.post("/inquiries", withInquiry(handleCreateInquiry))

export default app
