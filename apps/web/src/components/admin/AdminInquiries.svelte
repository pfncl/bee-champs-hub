<script lang="ts">
  import { Button } from "flowbite-svelte"
  import { apiFetch } from "../../lib/api"

  type Inquiry = {
    id: number; schoolName: string; schoolType: string; city: string;
    childrenCount: number; ageRange: string; contactName: string;
    contactPosition: string | null; contactPhone: string; contactEmail: string;
    hasGym: string | null; hasPlayground: string | null; notes: string | null;
    selectedPrograms: string; createdAt: string;
  }

  let { initialInquiries, adminToken }: { initialInquiries: Inquiry[]; adminToken: string } = $props()

  let inquiries = $state<Inquiry[]>(initialInquiries)
  let selectedId = $state<number | null>(null)
  let message = $state<string | null>(null)
  let messageType = $state<"success" | "error">("success")

  const selected = $derived(inquiries.find(i => i.id === selectedId))
  const authHeaders = { Authorization: `Bearer ${adminToken}` }

  const schoolTypeLabels: Record<string, string> = {
    ms: "Mateřská škola",
    zs: "Základní škola",
    ss: "Střední škola",
    other: "Jiné",
  }

  const gymLabels: Record<string, string> = { yes: "Ano, máme", no: "Nemáme", external: "Externí" }
  const playgroundLabels: Record<string, string> = { yes: "Ano, máme", no: "Nemáme" }

  function parsePrograms(json: string): { id: string; name: string; category: string; months: string[] }[] {
    try { return JSON.parse(json) }
    catch { return [] }
  }

  function showMessage(text: string, type: "success" | "error" = "success") {
    message = text
    messageType = type
    setTimeout(() => message = null, 3000)
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("cs", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return "před chvílí"
    if (hours < 24) return `před ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `před ${days}d`
    return `před ${Math.floor(days / 7)} týd.`
  }

  async function deleteInquiry(id: number) {
    if (!confirm("Opravdu smazat tuto poptávku?")) return
    try {
      await apiFetch(`/admin/inquiries/${id}`, { method: "DELETE", headers: authHeaders })
      inquiries = inquiries.filter(i => i.id !== id)
      if (selectedId === id) selectedId = null
      showMessage("Poptávka smazána")
    } catch (e) {
      showMessage(e instanceof Error ? e.message : "Chyba", "error")
    }
  }
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-text-dark font-heading">Poptávky</h1>
      <p class="text-text-muted text-sm mt-1">Přijaté poptávky od škol ({inquiries.length})</p>
    </div>
    {#if selected}
      <Button color="alternative" size="sm" onclick={() => selectedId = null} class="rounded-lg!">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1.5"><path d="m15 18-6-6 6-6"/></svg>
        Zpět na seznam
      </Button>
    {/if}
  </div>

  {#if message}
    <div class="mb-4 px-4 py-3 rounded-lg text-sm border {messageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">
      {message}
    </div>
  {/if}

  {#if selected}
    <!-- ==================== DETAIL POPTÁVKY ==================== -->
    <div class="space-y-4">
      <!-- Hlavička -->
      <div class="bg-white rounded-xl border border-black/6 p-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <h2 class="text-xl font-bold text-text-dark">{selected.schoolName}</h2>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                {parsePrograms(selected.selectedPrograms).length} programů
              </span>
            </div>
            <p class="text-text-muted text-sm">
              {schoolTypeLabels[selected.schoolType] ?? selected.schoolType} · {selected.city} · {selected.childrenCount} dětí · {selected.ageRange}
            </p>
            <p class="text-text-muted/60 text-xs mt-1">{formatDate(selected.createdAt)}</p>
          </div>
          <button onclick={() => deleteInquiry(selected.id)} class="p-2 rounded-lg text-text-muted hover:text-cat-events hover:bg-cat-events/10 transition-colors" title="Smazat">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Kontaktní osoba -->
        <div class="bg-white rounded-xl border border-black/6 p-5">
          <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Kontaktní osoba</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                {selected.contactName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p class="font-semibold text-text-dark text-sm">{selected.contactName}</p>
                {#if selected.contactPosition}
                  <p class="text-text-muted text-xs">{selected.contactPosition}</p>
                {/if}
              </div>
            </div>
            <div class="flex flex-col gap-1.5 pl-13">
              <a href="mailto:{selected.contactEmail}" class="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {selected.contactEmail}
              </a>
              <a href="tel:{selected.contactPhone}" class="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {selected.contactPhone}
              </a>
            </div>
          </div>
        </div>

        <!-- Zázemí školy -->
        <div class="bg-white rounded-xl border border-black/6 p-5">
          <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Zázemí školy</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-text-muted text-xs mb-1">Tělocvična</p>
              <p class="text-text-dark text-sm font-medium">{gymLabels[selected.hasGym ?? ""] ?? "Neuvedeno"}</p>
            </div>
            <div>
              <p class="text-text-muted text-xs mb-1">Venkovní hřiště</p>
              <p class="text-text-dark text-sm font-medium">{playgroundLabels[selected.hasPlayground ?? ""] ?? "Neuvedeno"}</p>
            </div>
            <div>
              <p class="text-text-muted text-xs mb-1">Počet dětí</p>
              <p class="text-text-dark text-sm font-medium">{selected.childrenCount}</p>
            </div>
            <div>
              <p class="text-text-muted text-xs mb-1">Věkové rozmezí</p>
              <p class="text-text-dark text-sm font-medium">{selected.ageRange}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Vybrané programy -->
      <div class="bg-white rounded-xl border border-black/6 p-5">
        <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
          Vybrané programy ({parsePrograms(selected.selectedPrograms).length})
        </h3>
        <div class="space-y-2">
          {#each parsePrograms(selected.selectedPrograms) as program}
            <div class="flex items-center justify-between px-4 py-2.5 bg-bg-warm/50 rounded-lg">
              <span class="font-medium text-text-dark text-sm">{program.name}</span>
              <div class="flex flex-wrap gap-1">
                {#each program.months as month}
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">{month}</span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Poznámky -->
      {#if selected.notes}
        <div class="bg-white rounded-xl border border-black/6 p-5">
          <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Poznámky</h3>
          <p class="text-text-dark text-sm leading-relaxed">{selected.notes}</p>
        </div>
      {/if}
    </div>

  {:else}
    <!-- ==================== SEZNAM POPTÁVEK ==================== -->
    {#if inquiries.length === 0}
      <div class="bg-white rounded-xl border border-black/6 p-12 text-center text-text-muted text-sm">
        Žádné poptávky
      </div>
    {:else}
      <div class="space-y-3">
        {#each inquiries as inq}
          {@const progs = parsePrograms(inq.selectedPrograms)}
          <div class="bg-white rounded-xl border border-black/6 p-5 hover:border-primary/20 transition-colors">
            <div class="flex items-start justify-between gap-4">
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-bold text-text-dark">{inq.schoolName}</h3>
                  <span class="text-text-muted/50 text-xs">{timeAgo(inq.createdAt)}</span>
                </div>
                <p class="text-text-muted text-sm mb-2">
                  {schoolTypeLabels[inq.schoolType] ?? inq.schoolType} · {inq.city} · {inq.contactName}
                  · <a href="mailto:{inq.contactEmail}" class="text-primary hover:underline" onclick={(e: MouseEvent) => e.stopPropagation()}>{inq.contactEmail}</a>
                </p>
                <!-- Programy -->
                <div class="flex flex-wrap gap-1.5">
                  {#each progs as program}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/8 text-primary rounded-full text-[11px] font-medium">
                      {program.name}
                      <span class="opacity-50">({program.months.join(", ")})</span>
                    </span>
                  {/each}
                </div>
              </div>
              <!-- Akce -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  onclick={() => selectedId = inq.id}
                  class="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Detail
                </button>
                <button
                  onclick={() => deleteInquiry(inq.id)}
                  class="p-1.5 rounded-lg text-text-muted hover:text-cat-events hover:bg-cat-events/10 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
