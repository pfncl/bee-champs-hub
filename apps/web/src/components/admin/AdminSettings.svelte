<script lang="ts">
  import { Button, Input, Label } from "flowbite-svelte"
  import { apiFetch } from "../../lib/api"

  let { initialSettings, adminToken }: { initialSettings: Record<string, string>; adminToken: string } = $props()

  let settings = $state<Record<string, string>>({ ...initialSettings })
  let saving = $state(false)
  let message = $state<string | null>(null)
  let messageType = $state<"success" | "error">("success")

  const authHeaders = { Authorization: `Bearer ${adminToken}` }

  // Definice skupin nastaveni
  const groups = [
    {
      title: "Statistiky na homepage",
      description: "Čísla zobrazená v hero sekci.",
      fields: [
        { key: "stat1_value", label: "Statistika 1 — hodnota", placeholder: "240+" },
        { key: "stat1_label", label: "Statistika 1 — popis", placeholder: "Realizovaných akcí" },
        { key: "stat2_value", label: "Statistika 2 — hodnota", placeholder: "85" },
        { key: "stat2_label", label: "Statistika 2 — popis", placeholder: "Zapojených škol" },
        { key: "stat3_value", label: "Statistika 3 — hodnota", placeholder: "98%" },
        { key: "stat3_label", label: "Statistika 3 — popis", placeholder: "Spokojených ředitelů" },
      ],
    },
    {
      title: "E-mailové notifikace",
      description: "E-maily pro příjem notifikací o nových poptávkách.",
      fields: [
        { key: "notification_emails", label: "Notifikační e-maily", placeholder: "info@beechampshub.cz" },
        { key: "admin_email", label: "Hlavní admin e-mail", placeholder: "info@beechampshub.cz" },
      ],
    },
  ]

  function showMessage(text: string, type: "success" | "error" = "success") {
    message = text
    messageType = type
    setTimeout(() => message = null, 3000)
  }

  async function save() {
    saving = true
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      showMessage("Nastavení uloženo")
    } catch {
      showMessage("Nepodařilo se uložit", "error")
    } finally {
      saving = false
    }
  }
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-text-dark font-heading">Nastavení</h1>
      <p class="text-text-muted text-sm mt-1">Globální nastavení webu</p>
    </div>
    <Button color="blue" size="sm" onclick={save} disabled={saving} class="rounded-lg!">
      {saving ? "Ukládám…" : "Uložit změny"}
    </Button>
  </div>

  {#if message}
    <div class="mb-4 px-4 py-3 rounded-lg text-sm border {messageType === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">
      {message}
    </div>
  {/if}

  <div class="space-y-6">
    {#each groups as group}
      <div class="bg-white rounded-xl border border-black/6 p-6">
        <h2 class="font-bold text-text-dark text-lg mb-1">{group.title}</h2>
        <p class="text-text-muted text-sm mb-4">{group.description}</p>
        <div class="grid gap-4 sm:grid-cols-2">
          {#each group.fields as field}
            <Label class="space-y-2">
              <span class="text-sm font-medium text-text-dark">{field.label}</span>
              <Input
                type="text"
                placeholder={field.placeholder}
                value={settings[field.key] ?? ""}
                oninput={(e: Event) => settings[field.key] = (e.target as HTMLInputElement).value}
              />
            </Label>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
