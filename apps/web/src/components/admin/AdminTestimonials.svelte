<script lang="ts">
  import { Button, Input, Textarea, Label } from "flowbite-svelte"
  import { apiFetch } from "../../lib/api"

  type Testimonial = { id: number; text: string; name: string; role: string; initials: string; active: boolean; sortOrder: number }

  let { initialTestimonials, adminToken }: { initialTestimonials: Testimonial[]; adminToken: string } = $props()

  let items = $state<Testimonial[]>(initialTestimonials)
  let editingId = $state<number | null>(null)
  let creating = $state(false)
  let saving = $state(false)
  let message = $state<string | null>(null)
  let messageType = $state<"success" | "error">("success")

  let formText = $state("")
  let formName = $state("")
  let formRole = $state("")
  let formInitials = $state("")

  const authHeaders = { Authorization: `Bearer ${adminToken}` }

  function showMessage(text: string, type: "success" | "error") {
    message = text
    messageType = type
    setTimeout(() => message = null, 3000)
  }

  function startCreate() {
    creating = true; editingId = null
    formText = ""; formName = ""; formRole = ""; formInitials = ""
  }

  function startEdit(t: Testimonial) {
    editingId = t.id; creating = false
    formText = t.text; formName = t.name; formRole = t.role; formInitials = t.initials
  }

  function cancelEdit() { editingId = null; creating = false }

  async function save() {
    if (!formText.trim() || !formName.trim()) return
    saving = true
    try {
      if (creating) {
        const result = await apiFetch<Testimonial>("/admin/testimonials", {
          method: "POST", headers: authHeaders,
          body: JSON.stringify({ text: formText.trim(), name: formName.trim(), role: formRole.trim(), initials: formInitials.trim(), sortOrder: items.length }),
        })
        items = [...items, result]
        showMessage("Reference vytvořena", "success")
      } else if (editingId) {
        const result = await apiFetch<Testimonial>(`/admin/testimonials/${editingId}`, {
          method: "PUT", headers: authHeaders,
          body: JSON.stringify({ text: formText.trim(), name: formName.trim(), role: formRole.trim(), initials: formInitials.trim() }),
        })
        items = items.map(i => i.id === editingId ? result : i)
        showMessage("Reference uložena", "success")
      }
      cancelEdit()
    } catch (e) {
      showMessage(e instanceof Error ? e.message : "Chyba", "error")
    } finally { saving = false }
  }

  async function deleteItem(t: Testimonial) {
    if (!confirm(`Smazat referenci od "${t.name}"?`)) return
    try {
      await apiFetch(`/admin/testimonials/${t.id}`, { method: "DELETE", headers: authHeaders })
      items = items.filter(i => i.id !== t.id)
      showMessage("Reference smazána", "success")
    } catch (e) {
      showMessage(e instanceof Error ? e.message : "Chyba", "error")
    }
  }
</script>

{#snippet editForm()}
  <div class="bg-bg-warm rounded-xl border border-primary/20 p-5 mt-2">
    <div class="grid gap-3 sm:grid-cols-2">
      <div class="sm:col-span-2">
        <Label class="mb-1">Text recenze</Label>
        <Textarea bind:value={formText} placeholder="Text recenze..." rows={3} class="w-full" />
      </div>
      <div>
        <Label class="mb-1">Jméno</Label>
        <Input bind:value={formName} placeholder="Mgr. Jana Nováková" size="sm" />
      </div>
      <div>
        <Label class="mb-1">Pozice</Label>
        <Input bind:value={formRole} placeholder="Ředitelka ZŠ Květinová" size="sm" />
      </div>
      <div>
        <Label class="mb-1">Iniciály</Label>
        <Input bind:value={formInitials} placeholder="JN" size="sm" />
      </div>
    </div>
    <div class="flex gap-3 mt-4">
      <Button color="primary" size="sm" onclick={save} disabled={saving} class="rounded-lg!">
        {saving ? "Ukládám..." : creating ? "Vytvořit" : "Uložit"}
      </Button>
      <Button color="alternative" size="sm" onclick={cancelEdit} class="rounded-lg!">Zrušit</Button>
    </div>
  </div>
{/snippet}

<div>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-text-dark font-heading">Reference</h1>
      <p class="text-text-muted text-sm mt-1">Recenze a hodnocení od škol ({items.length})</p>
    </div>
    <Button color="primary" size="sm" onclick={startCreate} class="rounded-lg!">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      Nová reference
    </Button>
  </div>

  {#if message}
    <div class="mb-4 px-4 py-3 rounded-lg text-sm border {messageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">
      {message}
    </div>
  {/if}

  <!-- Formulář pro novou referenci (nahoře, protože ještě nemá řádek) -->
  {#if creating}
    <div class="mb-4">
      {@render editForm()}
    </div>
  {/if}

  <div class="space-y-3">
    {#each items as item}
      <div>
        <div class="bg-white rounded-xl border border-black/6 p-5 {!item.active ? 'opacity-50' : ''} {editingId === item.id ? 'border-primary/30' : ''}">
          <div class="flex gap-4">
            <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {item.initials}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-text-dark text-sm italic mb-2">„{item.text}"</p>
              <p class="text-text-dark font-semibold text-sm">{item.name}</p>
              <p class="text-text-muted text-xs">{item.role}</p>
            </div>
            <div class="flex items-start gap-1 shrink-0">
              <button
                onclick={() => editingId === item.id ? cancelEdit() : startEdit(item)}
                class="p-1.5 rounded-lg transition-colors {editingId === item.id ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-primary/10'}"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button onclick={() => deleteItem(item)} class="p-1.5 rounded-lg text-text-muted hover:text-cat-events hover:bg-cat-events/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
        <!-- Inline editační formulář pod referencí -->
        {#if editingId === item.id}
          {@render editForm()}
        {/if}
      </div>
    {/each}

    {#if items.length === 0}
      <div class="bg-white rounded-xl border border-black/6 p-12 text-center text-text-muted text-sm">
        Žádné reference
      </div>
    {/if}
  </div>
</div>
