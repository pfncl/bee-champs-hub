// API helper pro serverove volani (Astro SSR)
const API_BASE = import.meta.env.PUBLIC_API_URL ?? "https://bee-champs-hub-api.webmaster4329.workers.dev"

export async function apiFetchSSR<T>(path: string, cookie?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((error as { error: string }).error ?? "Chyba pozadavku")
  }

  const json = (await res.json()) as { data: T }
  return json.data
}
