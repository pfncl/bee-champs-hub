import { defineConfig } from "astro/config"
import cloudflare from "@astrojs/cloudflare"
import svelte from "@astrojs/svelte"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  site: "https://beechampshub.cz",
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      persist: { path: "../api/.wrangler/state/v3" },
    },
  }),
  integrations: [
    svelte(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
