<script lang="ts">
  import { Button, Input, Select, Textarea, Label } from "flowbite-svelte"
  import { apiFetch } from "../../lib/api"

  type Category = { id: number; slug: string; name: string; label: string; color: string }
  type Program = {
    id: number; slug: string; categorySlug: string; name: string; icon: string;
    description: string; ageRange: string; duration: string; instructors: string;
    active: boolean; sortOrder: number;
  }

  let {
    initialPrograms,
    categories,
    adminToken,
  }: {
    initialPrograms: Program[]
    categories: Category[]
    adminToken: string
  } = $props()

  let programs = $state<Program[]>(initialPrograms)
  let editingId = $state<number | null>(null)
  let creating = $state(false)
  let saving = $state(false)
  let message = $state<string | null>(null)
  let messageType = $state<"success" | "error">("success")
  let filterCategory = $state("all")

  // Formularove pole
  let formSlug = $state("")
  let formName = $state("")
  let formCategory = $state("")
  let formIcon = $state("")
  let formDescription = $state("")
  let formAgeRange = $state("")
  let formDuration = $state("")
  let formInstructors = $state("")

  const categoryItems = categories.map(c => ({ value: c.slug, name: c.name }))
  const filterItems = [
    { value: "all", name: "Vše" },
    ...categoryItems,
  ]

  const filteredPrograms = $derived(
    filterCategory === "all" ? programs : programs.filter(p => p.categorySlug === filterCategory)
  )

  const groupedPrograms = $derived.by(() => {
    const groups: { slug: string; name: string; color: string; items: Program[] }[] = []
    for (const cat of categories) {
      const items = filteredPrograms.filter(p => p.categorySlug === cat.slug)
      if (items.length > 0) groups.push({ slug: cat.slug, name: cat.name, color: cat.color, items })
    }
    return groups
  })

  const authHeaders = { Authorization: `Bearer ${adminToken}` }

  function showMessage(text: string, type: "success" | "error") {
    message = text
    messageType = type
    setTimeout(() => message = null, 3000)
  }

  function startCreate() {
    creating = true
    editingId = null
    formSlug = ""
    formName = ""
    formCategory = categories[0]?.slug ?? ""
    formIcon = ""
    formDescription = ""
    formAgeRange = ""
    formDuration = ""
    formInstructors = ""
  }

  function startEdit(p: Program) {
    editingId = p.id
    creating = false
    formSlug = p.slug
    formName = p.name
    formCategory = p.categorySlug
    formIcon = p.icon
    formDescription = p.description
    formAgeRange = p.ageRange
    formDuration = p.duration
    formInstructors = p.instructors
  }

  function cancelEdit() {
    editingId = null
    creating = false
  }

  async function saveProgram() {
    if (!formName.trim() || !formSlug.trim()) return
    saving = true

    try {
      if (creating) {
        const result = await apiFetch<Program>("/admin/programs", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            slug: formSlug.trim(),
            categorySlug: formCategory,
            name: formName.trim(),
            icon: formIcon.trim(),
            description: formDescription.trim(),
            ageRange: formAgeRange.trim(),
            duration: formDuration.trim(),
            instructors: formInstructors.trim(),
            sortOrder: programs.length,
          }),
        })
        programs = [...programs, result]
        showMessage("Program vytvořen", "success")
      } else if (editingId) {
        const result = await apiFetch<Program>(`/admin/programs/${editingId}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({
            slug: formSlug.trim(),
            categorySlug: formCategory,
            name: formName.trim(),
            icon: formIcon.trim(),
            description: formDescription.trim(),
            ageRange: formAgeRange.trim(),
            duration: formDuration.trim(),
            instructors: formInstructors.trim(),
          }),
        })
        programs = programs.map(p => p.id === editingId ? result : p)
        showMessage("Program uložen", "success")
      }
      cancelEdit()
    } catch (e) {
      showMessage(e instanceof Error ? e.message : "Chyba", "error")
    } finally {
      saving = false
    }
  }

  async function toggleActive(p: Program) {
    saving = true
    try {
      const result = await apiFetch<Program>(`/admin/programs/${p.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ ...p, active: !p.active }),
      })
      programs = programs.map(pr => pr.id === p.id ? result : pr)
      showMessage(result.active ? "Program aktivován" : "Program deaktivován", "success")
    } catch (e) {
      showMessage(e instanceof Error ? e.message : "Chyba", "error")
    } finally {
      saving = false
    }
  }

  async function deleteProgram(p: Program) {
    if (!confirm(`Smazat program "${p.name}"?`)) return
    saving = true
    try {
      await apiFetch(`/admin/programs/${p.id}`, {
        method: "DELETE",
        headers: authHeaders,
      })
      programs = programs.filter(pr => pr.id !== p.id)
      showMessage("Program smazán", "success")
    } catch (e) {
      showMessage(e instanceof Error ? e.message : "Chyba", "error")
    } finally {
      saving = false
    }
  }
</script>

{#snippet editForm()}
  <div class="bg-bg-warm rounded-xl border border-primary/20 p-5 mt-2">
    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <Label class="mb-1">Název</Label>
        <Input bind:value={formName} placeholder="Název programu" size="sm" />
      </div>
      <div>
        <Label class="mb-1">Slug</Label>
        <Input bind:value={formSlug} placeholder="nazev-programu" size="sm" />
      </div>
      <div>
        <Label class="mb-1">Kategorie</Label>
        <Select bind:value={formCategory} items={categoryItems} size="sm" />
      </div>
      <div>
        <Label class="mb-1">Ikona (emoji)</Label>
        <Input bind:value={formIcon} placeholder="🏀" size="sm" />
      </div>
      <div class="sm:col-span-2">
        <Label class="mb-1">Popis</Label>
        <Textarea bind:value={formDescription} placeholder="Krátký popis programu" rows={2} class="w-full" />
      </div>
      <div>
        <Label class="mb-1">Věkové rozmezí</Label>
        <Input bind:value={formAgeRange} placeholder="MŠ–ZŠ" size="sm" />
      </div>
      <div>
        <Label class="mb-1">Délka</Label>
        <Input bind:value={formDuration} placeholder="90 min" size="sm" />
      </div>
      <div>
        <Label class="mb-1">Lektoři</Label>
        <Input bind:value={formInstructors} placeholder="1–2" size="sm" />
      </div>
    </div>
    <div class="flex gap-3 mt-4">
      <Button color="primary" size="sm" onclick={saveProgram} disabled={saving} class="rounded-lg!">
        {saving ? "Ukládám..." : creating ? "Vytvořit" : "Uložit"}
      </Button>
      <Button color="alternative" size="sm" onclick={cancelEdit} class="rounded-lg!">
        Zrušit
      </Button>
    </div>
  </div>
{/snippet}

<div>
  <!-- Hlavicka -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-text-dark font-heading">Programy</h1>
      <p class="text-text-muted text-sm mt-1">Správa nabídky programů ({programs.length})</p>
    </div>
    <Button color="primary" size="sm" onclick={startCreate} class="rounded-lg!">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="me-1.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      Nový program
    </Button>
  </div>

  <!-- Toast -->
  {#if message}
    <div class="mb-4 px-4 py-3 rounded-lg text-sm border {messageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">
      {message}
    </div>
  {/if}

  <!-- Formular pro novy program (nahoze, protoze jeste nema radek) -->
  {#if creating}
    <div class="mb-6">
      {@render editForm()}
    </div>
  {/if}

  <!-- Filtr -->
  <div class="flex gap-2 mb-4">
    {#each filterItems as item}
      <button
        onclick={() => filterCategory = item.value}
        class="px-3 py-1.5 rounded-full text-xs font-bold transition-all {filterCategory === item.value ? 'bg-primary/15 text-primary' : 'text-text-muted hover:bg-black/5'}"
      >
        {item.name}
      </button>
    {/each}
  </div>

  <!-- Seznam programu -->
  {#each groupedPrograms as group}
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-3 h-3 rounded-full" style:background-color={group.color}></span>
        <span class="text-xs font-bold uppercase tracking-wider" style:color={group.color}>{group.name}</span>
        <span class="text-xs text-text-muted/50">({group.items.length})</span>
      </div>
      <div class="space-y-2">
        {#each group.items as program}
          <div>
            <div class="bg-white rounded-xl border border-black/6 px-4 py-3 flex items-center gap-3 {!program.active ? 'opacity-50' : ''} {editingId === program.id ? 'border-primary/30 bg-primary/2' : ''}">
              <span class="text-xl">{program.icon}</span>
              <div class="flex-1 min-w-0">
                <span class="font-semibold text-text-dark text-sm">{program.name}</span>
                <span class="text-text-muted text-xs ml-2">{program.ageRange} · {program.duration}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  onclick={() => editingId === program.id ? cancelEdit() : startEdit(program)}
                  class="p-1.5 rounded-lg transition-colors {editingId === program.id ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-primary/10'}"
                  title="Upravit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button
                  onclick={() => toggleActive(program)}
                  class="p-1.5 rounded-lg transition-colors {program.active ? 'text-green-600 hover:bg-green-50' : 'text-text-muted hover:bg-black/5'}"
                  title={program.active ? "Deaktivovat" : "Aktivovat"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{#if program.active}<path d="M20 6 9 17l-5-5"/>{:else}<circle cx="12" cy="12" r="10"/>{/if}</svg>
                </button>
                <button
                  onclick={() => deleteProgram(program)}
                  class="p-1.5 rounded-lg text-text-muted hover:text-cat-events hover:bg-cat-events/10 transition-colors"
                  title="Smazat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <!-- Inline editacni formular pod programem -->
            {#if editingId === program.id}
              {@render editForm()}
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}

  {#if filteredPrograms.length === 0}
    <div class="text-center py-12 text-text-muted text-sm">Žádné programy v této kategorii</div>
  {/if}
</div>
