<script lang="ts">
  import { t } from "../../i18n"
  import type { usePlanner } from "./plannerState.svelte"
  import { SCHOOL_MONTHS, getCategoryColor } from "./plannerState.svelte"

  let { planner, onclose }: {
    planner: ReturnType<typeof usePlanner>
    onclose: () => void
  } = $props()

  // API URL — v produkci beechampshub.cz/api, v dev localhost
  const API_URL = import.meta.env.PUBLIC_API_URL ?? "https://bee-champs-hub-api.webmaster4329.workers.dev"

  // Stav formulare
  let schoolName = $state("")
  let schoolType = $state("")
  let city = $state("")
  let childrenCount = $state("")
  let ageRange = $state("")
  let contactName = $state("")
  let contactPosition = $state("")
  let contactPhone = $state("")
  let contactEmail = $state("")
  let hasGym = $state("")
  let hasPlayground = $state("")
  let notes = $state("")

  let submitting = $state(false)
  let success = $state(false)
  let errorMessage = $state("")

  // Validace
  let touched = $state<Record<string, boolean>>({})

  function markTouched(field: string) {
    touched = { ...touched, [field]: true }
  }

  const requiredFields = $derived({
    schoolName: schoolName.trim().length > 0,
    schoolType: schoolType.trim().length > 0,
    city: city.trim().length > 0,
    childrenCount: childrenCount.trim().length > 0 && parseInt(childrenCount) > 0,
    ageRange: ageRange.trim().length > 0,
    contactName: contactName.trim().length > 0,
    contactPhone: contactPhone.trim().length > 0,
    contactEmail: contactEmail.trim().length > 0 && contactEmail.includes("@"),
  })

  const isValid = $derived(Object.values(requiredFields).every(Boolean))

  // Priprava dat o vybranych programech
  const selectedProgramsData = $derived.by(() => {
    return planner.assignedPrograms.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      months: planner.getProgramMonths(p.id).map((mi) => SCHOOL_MONTHS[mi].name),
    }))
  })

  async function handleSubmit() {
    if (!isValid || submitting) return

    submitting = true
    errorMessage = ""

    try {
      const response = await fetch(`${API_URL}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: schoolName.trim(),
          schoolType: schoolType.trim(),
          city: city.trim(),
          childrenCount: parseInt(childrenCount),
          ageRange: ageRange.trim(),
          contactName: contactName.trim(),
          contactPosition: contactPosition.trim() || undefined,
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim(),
          hasGym: hasGym || undefined,
          hasPlayground: hasPlayground || undefined,
          notes: notes.trim() || undefined,
          selectedPrograms: JSON.stringify(selectedProgramsData),
        }),
      })

      if (response.ok) {
        success = true
      } else {
        const data = await response.json().catch(() => null)
        errorMessage = data?.error ?? t.inquiry.errorGeneral
      }
    } catch {
      errorMessage = t.inquiry.errorGeneral
    } finally {
      submitting = false
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onclose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={handleBackdropClick}
>
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" role="dialog" aria-modal="true">
    <!-- Hlavicka -->
    <div class="px-6 py-4 border-b border-border-light flex items-center justify-between shrink-0">
      <div>
        <h3 class="text-lg font-bold text-text-dark font-heading">{t.inquiry.title}</h3>
        <p class="text-text-muted text-xs mt-0.5">{t.inquiry.subtitle}</p>
      </div>
      <button
        onclick={onclose}
        class="text-text-muted hover:text-text-dark transition-colors p-1 rounded-lg hover:bg-bg-warm"
        aria-label={t.planner.modal.close}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    {#if success}
      <!-- Uspesne odeslano -->
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-cat-sport/10 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 class="text-xl font-bold text-text-dark font-heading mb-2">{t.inquiry.successTitle}</h3>
        <p class="text-text-muted text-sm mb-6">{t.inquiry.successMessage}</p>
        <button
          onclick={onclose}
          class="bg-primary hover:bg-primary-hover text-bg-primary px-6 py-2.5 rounded-lg font-bold text-sm transition-all"
        >
          {t.inquiry.successClose}
        </button>
      </div>
    {:else}
      <!-- Formular -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Vybrane programy -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">{t.inquiry.selectedPrograms}</h4>
          <div class="flex flex-wrap gap-1.5">
            {#each planner.assignedPrograms as program}
              {@const color = getCategoryColor(program.category)}
              {@const months = planner.getProgramMonths(program.id).map((mi) => SCHOOL_MONTHS[mi].shortName)}
              <span
                class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium"
                style:background-color="{color}15"
                style:color={color}
              >
                {program.icon} {program.name}
                <span class="opacity-60">({months.join(", ")})</span>
              </span>
            {/each}
          </div>
        </div>

        <!-- Udaje o skole -->
        <fieldset>
          <legend class="text-sm font-bold text-text-dark mb-3">{t.inquiry.sectionSchool}</legend>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-text-muted mb-1" for="schoolName">
                {t.inquiry.schoolName} <span class="text-cat-events">*</span>
              </label>
              <input
                id="schoolName"
                type="text"
                bind:value={schoolName}
                onblur={() => markTouched("schoolName")}
                placeholder={t.inquiry.schoolNamePlaceholder}
                class="w-full px-3 py-2 rounded-lg border text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                class:border-cat-events={touched["schoolName"] && !requiredFields.schoolName}
                class:border-border-light={!touched["schoolName"] || requiredFields.schoolName}
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="schoolType">
                {t.inquiry.schoolType} <span class="text-cat-events">*</span>
              </label>
              <select
                id="schoolType"
                bind:value={schoolType}
                onblur={() => markTouched("schoolType")}
                class="w-full px-3 py-2 rounded-lg border text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                class:border-cat-events={touched["schoolType"] && !requiredFields.schoolType}
                class:border-border-light={!touched["schoolType"] || requiredFields.schoolType}
              >
                <option value="">{t.inquiry.schoolTypePlaceholder}</option>
                <option value="ms">{t.inquiry.schoolTypes.ms}</option>
                <option value="zs">{t.inquiry.schoolTypes.zs}</option>
                <option value="ss">{t.inquiry.schoolTypes.ss}</option>
                <option value="other">{t.inquiry.schoolTypes.other}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="city">
                {t.inquiry.city} <span class="text-cat-events">*</span>
              </label>
              <input
                id="city"
                type="text"
                bind:value={city}
                onblur={() => markTouched("city")}
                placeholder={t.inquiry.cityPlaceholder}
                class="w-full px-3 py-2 rounded-lg border text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                class:border-cat-events={touched["city"] && !requiredFields.city}
                class:border-border-light={!touched["city"] || requiredFields.city}
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="childrenCount">
                {t.inquiry.childrenCount} <span class="text-cat-events">*</span>
              </label>
              <input
                id="childrenCount"
                type="number"
                min="1"
                bind:value={childrenCount}
                onblur={() => markTouched("childrenCount")}
                placeholder={t.inquiry.childrenCountPlaceholder}
                class="w-full px-3 py-2 rounded-lg border text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                class:border-cat-events={touched["childrenCount"] && !requiredFields.childrenCount}
                class:border-border-light={!touched["childrenCount"] || requiredFields.childrenCount}
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="ageRange">
                {t.inquiry.ageRange} <span class="text-cat-events">*</span>
              </label>
              <input
                id="ageRange"
                type="text"
                bind:value={ageRange}
                onblur={() => markTouched("ageRange")}
                placeholder={t.inquiry.ageRangePlaceholder}
                class="w-full px-3 py-2 rounded-lg border text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                class:border-cat-events={touched["ageRange"] && !requiredFields.ageRange}
                class:border-border-light={!touched["ageRange"] || requiredFields.ageRange}
              />
            </div>
          </div>
        </fieldset>

        <!-- Kontaktni udaje -->
        <fieldset>
          <legend class="text-sm font-bold text-text-dark mb-3">{t.inquiry.sectionContact}</legend>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="contactName">
                {t.inquiry.contactName} <span class="text-cat-events">*</span>
              </label>
              <input
                id="contactName"
                type="text"
                bind:value={contactName}
                onblur={() => markTouched("contactName")}
                placeholder={t.inquiry.contactNamePlaceholder}
                class="w-full px-3 py-2 rounded-lg border text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                class:border-cat-events={touched["contactName"] && !requiredFields.contactName}
                class:border-border-light={!touched["contactName"] || requiredFields.contactName}
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="contactPosition">
                {t.inquiry.contactPosition}
              </label>
              <input
                id="contactPosition"
                type="text"
                bind:value={contactPosition}
                placeholder={t.inquiry.contactPositionPlaceholder}
                class="w-full px-3 py-2 rounded-lg border border-border-light text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="contactPhone">
                {t.inquiry.contactPhone} <span class="text-cat-events">*</span>
              </label>
              <input
                id="contactPhone"
                type="tel"
                bind:value={contactPhone}
                onblur={() => markTouched("contactPhone")}
                placeholder={t.inquiry.contactPhonePlaceholder}
                class="w-full px-3 py-2 rounded-lg border text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                class:border-cat-events={touched["contactPhone"] && !requiredFields.contactPhone}
                class:border-border-light={!touched["contactPhone"] || requiredFields.contactPhone}
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="contactEmail">
                {t.inquiry.contactEmail} <span class="text-cat-events">*</span>
              </label>
              <input
                id="contactEmail"
                type="email"
                bind:value={contactEmail}
                onblur={() => markTouched("contactEmail")}
                placeholder={t.inquiry.contactEmailPlaceholder}
                class="w-full px-3 py-2 rounded-lg border text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                class:border-cat-events={touched["contactEmail"] && !requiredFields.contactEmail}
                class:border-border-light={!touched["contactEmail"] || requiredFields.contactEmail}
              />
            </div>
          </div>
        </fieldset>

        <!-- Zazemi skoly -->
        <fieldset>
          <legend class="text-sm font-bold text-text-dark mb-3">{t.inquiry.sectionFacilities}</legend>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="hasGym">
                {t.inquiry.hasGym}
              </label>
              <select
                id="hasGym"
                bind:value={hasGym}
                class="w-full px-3 py-2 rounded-lg border border-border-light text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">—</option>
                <option value="yes">{t.inquiry.hasGymOptions.yes}</option>
                <option value="no">{t.inquiry.hasGymOptions.no}</option>
                <option value="external">{t.inquiry.hasGymOptions.external}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-text-muted mb-1" for="hasPlayground">
                {t.inquiry.hasPlayground}
              </label>
              <select
                id="hasPlayground"
                bind:value={hasPlayground}
                class="w-full px-3 py-2 rounded-lg border border-border-light text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="">—</option>
                <option value="yes">{t.inquiry.hasPlaygroundOptions.yes}</option>
                <option value="no">{t.inquiry.hasPlaygroundOptions.no}</option>
              </select>
            </div>
          </div>
        </fieldset>

        <!-- Poznamky -->
        <fieldset>
          <legend class="text-sm font-bold text-text-dark mb-3">{t.inquiry.sectionNotes}</legend>
          <textarea
            id="notes"
            bind:value={notes}
            placeholder={t.inquiry.notesPlaceholder}
            rows="3"
            class="w-full px-3 py-2 rounded-lg border border-border-light text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          ></textarea>
        </fieldset>

        <!-- Chybova zprava -->
        {#if errorMessage}
          <div class="bg-cat-events/10 border border-cat-events/20 rounded-lg px-4 py-3 text-sm text-cat-events">
            {errorMessage}
          </div>
        {/if}
      </div>

      <!-- Paticka s tlacitkem -->
      <div class="px-6 py-4 border-t border-border-light flex items-center justify-between shrink-0">
        <span class="text-[11px] text-text-muted">
          <span class="text-cat-events">*</span> {t.inquiry.required}
        </span>
        <button
          onclick={handleSubmit}
          disabled={!isValid || submitting}
          class="bg-primary hover:bg-primary-hover text-bg-primary px-6 py-2.5 rounded-lg font-bold text-sm transition-all inline-flex items-center gap-2"
          class:opacity-50={!isValid || submitting}
          class:cursor-not-allowed={!isValid || submitting}
        >
          {#if submitting}
            <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            {t.inquiry.submitting}
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
            {t.inquiry.submit}
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>
