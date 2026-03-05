<script lang="ts">
  import { t } from "../../i18n"
  import type { usePlanner } from "./plannerState.svelte"
  import { SCHOOL_MONTHS, getCategoryColor } from "./plannerState.svelte"
  import { Modal, Button } from "flowbite-svelte"

  let { planner, onclose }: {
    planner: ReturnType<typeof usePlanner>
    onclose: () => void
  } = $props()

  let isOpen = $state(true)

  // API URL
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

  function handleClose() {
    isOpen = false
    onclose()
  }

  function hasError(field: string): boolean {
    return !!touched[field] && !requiredFields[field as keyof typeof requiredFields]
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border-light bg-white text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
  const inputErrCls = "w-full px-3 py-2 rounded-lg border border-cat-events/40 bg-cat-events/5 text-sm text-text-dark placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-cat-events/30 focus:border-cat-events/40 transition-all"
  const selectCls = "w-full px-3 py-2 rounded-lg border border-border-light bg-white text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
  const labelCls = "block text-[13px] font-semibold text-text-dark mb-1"
</script>

<Modal bind:open={isOpen} size="lg" title={t.inquiry.title} onclose={handleClose} outsideclose>
  {#if success}
    <!-- Uspesne odeslano -->
    <div class="flex flex-col items-center justify-center py-8 text-center">
      <div class="w-16 h-16 rounded-full bg-cat-education/15 flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </div>
      <h3 class="text-xl font-bold text-text-dark font-heading mb-2">{t.inquiry.successTitle}</h3>
      <p class="text-text-muted text-sm mb-6">{t.inquiry.successMessage}</p>
      <Button onclick={handleClose}>{t.inquiry.successClose}</Button>
    </div>
  {:else}
    <!-- Formular -->
    <div class="space-y-5">
      <!-- Vybrane programy -->
      <div>
        <p class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">{t.inquiry.selectedPrograms}</p>
        <div class="flex flex-wrap gap-1.5">
          {#each planner.assignedPrograms as program}
            {@const color = getCategoryColor(program.category)}
            {@const months = planner.getProgramMonths(program.id).map((mi) => SCHOOL_MONTHS[mi].shortName)}
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style:background-color="{color}12"
              style:color={color}
            >
              {program.icon} {program.name}
              <span class="opacity-50">({months.join(", ")})</span>
            </span>
          {/each}
        </div>
      </div>

      <!-- Udaje o skole -->
      <fieldset>
        <legend class="text-sm font-bold text-text-dark mb-3">{t.inquiry.sectionSchool}</legend>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="sm:col-span-2">
            <label for="schoolName" class={labelCls}>{t.inquiry.schoolName} <span class="text-cat-events">*</span></label>
            <input
              id="schoolName"
              type="text"
              bind:value={schoolName}
              onblur={() => markTouched("schoolName")}
              placeholder={t.inquiry.schoolNamePlaceholder}
              class={hasError("schoolName") ? inputErrCls : inputCls}
            />
            {#if hasError("schoolName")}
              <p class="text-cat-events text-[11px] mt-1">{t.inquiry.required}</p>
            {/if}
          </div>

          <div>
            <label for="schoolType" class={labelCls}>{t.inquiry.schoolType} <span class="text-cat-events">*</span></label>
            <select
              id="schoolType"
              bind:value={schoolType}
              onblur={() => markTouched("schoolType")}
              class={selectCls}
            >
              <option value="">{t.inquiry.schoolTypePlaceholder}</option>
              <option value="ms">{t.inquiry.schoolTypes.ms}</option>
              <option value="zs">{t.inquiry.schoolTypes.zs}</option>
              <option value="ss">{t.inquiry.schoolTypes.ss}</option>
              <option value="other">{t.inquiry.schoolTypes.other}</option>
            </select>
            {#if hasError("schoolType")}
              <p class="text-cat-events text-[11px] mt-1">{t.inquiry.required}</p>
            {/if}
          </div>

          <div>
            <label for="city" class={labelCls}>{t.inquiry.city} <span class="text-cat-events">*</span></label>
            <input
              id="city"
              type="text"
              bind:value={city}
              onblur={() => markTouched("city")}
              placeholder={t.inquiry.cityPlaceholder}
              class={hasError("city") ? inputErrCls : inputCls}
            />
          </div>

          <div>
            <label for="childrenCount" class={labelCls}>{t.inquiry.childrenCount} <span class="text-cat-events">*</span></label>
            <input
              id="childrenCount"
              type="number"
              bind:value={childrenCount}
              onblur={() => markTouched("childrenCount")}
              placeholder={t.inquiry.childrenCountPlaceholder}
              class={hasError("childrenCount") ? inputErrCls : inputCls}
            />
          </div>

          <div>
            <label for="ageRange" class={labelCls}>{t.inquiry.ageRange} <span class="text-cat-events">*</span></label>
            <input
              id="ageRange"
              type="text"
              bind:value={ageRange}
              onblur={() => markTouched("ageRange")}
              placeholder={t.inquiry.ageRangePlaceholder}
              class={hasError("ageRange") ? inputErrCls : inputCls}
            />
          </div>
        </div>
      </fieldset>

      <!-- Kontaktni udaje -->
      <fieldset>
        <legend class="text-sm font-bold text-text-dark mb-3">{t.inquiry.sectionContact}</legend>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="contactName" class={labelCls}>{t.inquiry.contactName} <span class="text-cat-events">*</span></label>
            <input
              id="contactName"
              type="text"
              bind:value={contactName}
              onblur={() => markTouched("contactName")}
              placeholder={t.inquiry.contactNamePlaceholder}
              class={hasError("contactName") ? inputErrCls : inputCls}
            />
          </div>

          <div>
            <label for="contactPosition" class={labelCls}>{t.inquiry.contactPosition}</label>
            <input
              id="contactPosition"
              type="text"
              bind:value={contactPosition}
              placeholder={t.inquiry.contactPositionPlaceholder}
              class={inputCls}
            />
          </div>

          <div>
            <label for="contactPhone" class={labelCls}>{t.inquiry.contactPhone} <span class="text-cat-events">*</span></label>
            <input
              id="contactPhone"
              type="tel"
              bind:value={contactPhone}
              onblur={() => markTouched("contactPhone")}
              placeholder={t.inquiry.contactPhonePlaceholder}
              class={hasError("contactPhone") ? inputErrCls : inputCls}
            />
          </div>

          <div>
            <label for="contactEmail" class={labelCls}>{t.inquiry.contactEmail} <span class="text-cat-events">*</span></label>
            <input
              id="contactEmail"
              type="email"
              bind:value={contactEmail}
              onblur={() => markTouched("contactEmail")}
              placeholder={t.inquiry.contactEmailPlaceholder}
              class={hasError("contactEmail") ? inputErrCls : inputCls}
            />
          </div>
        </div>
      </fieldset>

      <!-- Zazemi skoly -->
      <fieldset>
        <legend class="text-sm font-bold text-text-dark mb-3">{t.inquiry.sectionFacilities}</legend>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="hasGym" class={labelCls}>{t.inquiry.hasGym}</label>
            <select id="hasGym" bind:value={hasGym} class={selectCls}>
              <option value="">—</option>
              <option value="yes">{t.inquiry.hasGymOptions.yes}</option>
              <option value="no">{t.inquiry.hasGymOptions.no}</option>
              <option value="external">{t.inquiry.hasGymOptions.external}</option>
            </select>
          </div>
          <div>
            <label for="hasPlayground" class={labelCls}>{t.inquiry.hasPlayground}</label>
            <select id="hasPlayground" bind:value={hasPlayground} class={selectCls}>
              <option value="">—</option>
              <option value="yes">{t.inquiry.hasPlaygroundOptions.yes}</option>
              <option value="no">{t.inquiry.hasPlaygroundOptions.no}</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- Poznamky -->
      <div>
        <label for="notes" class={labelCls}>{t.inquiry.sectionNotes}</label>
        <textarea
          id="notes"
          bind:value={notes}
          placeholder={t.inquiry.notesPlaceholder}
          rows="3"
          class="{inputCls} resize-none"
        ></textarea>
      </div>

      <!-- Chybova zprava -->
      {#if errorMessage}
        <div class="bg-cat-events/10 border border-cat-events/20 text-cat-events rounded-lg px-4 py-3 text-sm">
          {errorMessage}
        </div>
      {/if}
    </div>

    {#snippet footer()}
      <div class="flex items-center justify-between w-full">
        <span class="text-xs text-text-muted">
          <span class="text-cat-events">*</span> {t.inquiry.required}
        </span>
        <Button
          onclick={handleSubmit}
          disabled={!isValid || submitting}
          class="!bg-primary hover:!bg-primary-hover !text-bg-primary"
        >
          {#if submitting}
            <svg class="animate-spin w-4 h-4 me-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {t.inquiry.submitting}
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-2"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
            {t.inquiry.submit}
          {/if}
        </Button>
      </div>
    {/snippet}
  {/if}
</Modal>
