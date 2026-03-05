<script lang="ts">
  import { programs } from "@bee-champs/shared"
  import { t } from "../../i18n"
  import { SCHOOL_MONTHS, getCategoryColor, getProgramById, type MonthIndex, type usePlanner } from "./plannerState.svelte"

  let { planner }: { planner: ReturnType<typeof usePlanner> } = $props()

  // Rozlišení: přiřazení programu→měsíce vs. měsíc→programy
  const isMonthMode = $derived(planner.modalProgramId?.startsWith("__month__") ?? false)
  const monthIndex = $derived(
    isMonthMode ? parseInt(planner.modalProgramId!.replace("__month__", "")) as MonthIndex : null
  )
  const program = $derived(
    !isMonthMode && planner.modalProgramId ? getProgramById(planner.modalProgramId) : null
  )

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) planner.closeModal()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") planner.closeModal()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={handleBackdropClick}
>
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" role="dialog" aria-modal="true">
    <!-- Hlavička -->
    <div class="px-5 py-4 border-b border-border-light flex items-center justify-between">
      <div>
        {#if isMonthMode && monthIndex !== null}
          <h3 class="text-base font-bold text-text-dark font-heading">{SCHOOL_MONTHS[monthIndex].name}</h3>
          <p class="text-text-muted text-xs mt-0.5">{t.planner.modal.selectPrograms}</p>
        {:else if program}
          <h3 class="text-base font-bold text-text-dark font-heading">
            {program.icon} {program.name}
          </h3>
          <p class="text-text-muted text-xs mt-0.5">{t.planner.modal.selectMonths}</p>
        {/if}
      </div>
      <button
        onclick={() => planner.closeModal()}
        class="text-text-muted hover:text-text-dark transition-colors p-1 rounded-lg hover:bg-bg-warm"
        aria-label={t.planner.modal.close}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <!-- Obsah -->
    <div class="p-5">
      {#if !isMonthMode && program}
        <!-- Mód: program → měsíce -->
        <p class="text-text-muted text-xs mb-3">{t.planner.modal.clickMonths}</p>
        <div class="grid grid-cols-3 gap-2.5">
          {#each SCHOOL_MONTHS as month}
            {@const isAssigned = planner.getProgramMonths(program.id).includes(month.index)}
            {@const color = getCategoryColor(program.category)}
            <button
              onclick={() => planner.toggleMonthForProgram(program.id, month.index)}
              class="px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-center"
              style:border-color={isAssigned ? color : "#E2E8F0"}
              style:background-color={isAssigned ? `${color}10` : "transparent"}
              style:color={isAssigned ? color : "#64748B"}
            >
              {month.name}
              {#if isAssigned}
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="inline ml-1"><path d="M20 6 9 17l-5-5"/></svg>
              {/if}
            </button>
          {/each}
        </div>

      {:else if isMonthMode && monthIndex !== null}
        <!-- Mód: měsíc → programy -->
        {@const allPrograms = programs}
        {#if allPrograms.length === 0}
          <p class="text-text-muted text-sm text-center py-4">{t.planner.modal.noPrograms}</p>
        {:else}
          <div class="space-y-1 max-h-[360px] overflow-y-auto">
            {#each allPrograms as prog}
              {@const color = getCategoryColor(prog.category)}
              {@const isAssigned = planner.getMonthPrograms(monthIndex).some((p) => p.id === prog.id)}
              <button
                onclick={() => planner.toggleMonthForProgram(prog.id, monthIndex)}
                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left"
                style:border-color={isAssigned ? color : "transparent"}
                style:background-color={isAssigned ? `${color}08` : "transparent"}
              >
                <div
                  class="w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  style:border-color={isAssigned ? color : "#CBD5E1"}
                  style:background-color={isAssigned ? color : "transparent"}
                >
                  {#if isAssigned}
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  {/if}
                </div>
                <span class="text-xs shrink-0">{prog.icon}</span>
                <span class="text-[13px] font-medium truncate" style:color={isAssigned ? color : "#0D1B2E"}>
                  {prog.name}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <!-- Patička -->
    <div class="px-5 py-3 border-t border-border-light flex justify-end">
      <button
        onclick={() => planner.closeModal()}
        class="bg-primary hover:bg-primary-hover text-bg-primary px-5 py-2 rounded-lg font-semibold text-sm transition-all"
      >
        {t.planner.modal.done}
      </button>
    </div>
  </div>
</div>
