<script lang="ts">
  import { programs } from "@bee-champs/shared"
  import { SCHOOL_MONTHS, getCategoryColor, getProgramById, type MonthIndex, type usePlanner } from "./plannerState.svelte"

  let { planner }: { planner: ReturnType<typeof usePlanner> } = $props()

  // Rozliseni: prirazeni programu k mesicum vs. prirazeni mesice k programum
  const isMonthMode = $derived(planner.modalProgramId?.startsWith("__month__") ?? false)
  const monthIndex = $derived(
    isMonthMode ? parseInt(planner.modalProgramId!.replace("__month__", "")) as MonthIndex : null
  )
  const program = $derived(
    !isMonthMode && planner.modalProgramId ? getProgramById(planner.modalProgramId) : null
  )

  // V mesicnim modu: zobrazit seznam vybranych programu pro prirazeni
  const availablePrograms = $derived(
    isMonthMode
      ? planner.selectedPrograms
      : []
  )

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      planner.closeModal()
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      planner.closeModal()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={handleBackdropClick}
>
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" role="dialog" aria-modal="true">
    <!-- Hlavicka -->
    <div class="px-6 py-4 bg-bg-primary flex items-center justify-between">
      <div>
        {#if isMonthMode && monthIndex !== null}
          <h3 class="text-lg font-bold text-white font-heading">
            {SCHOOL_MONTHS[monthIndex].name}
          </h3>
          <p class="text-text-secondary text-xs mt-0.5">Vyberte programy pro tento měsíc</p>
        {:else if program}
          <h3 class="text-lg font-bold text-white font-heading">
            {program.icon} {program.name}
          </h3>
          <p class="text-text-secondary text-xs mt-0.5">Přiřaďte do měsíců školního roku</p>
        {/if}
      </div>
      <button
        onclick={() => planner.closeModal()}
        class="text-text-secondary hover:text-white transition-colors p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <!-- Obsah -->
    <div class="p-6">
      {#if !isMonthMode && program}
        <!-- Mod: prirazeni programu k mesicum -->
        <p class="text-text-muted text-sm mb-4">Klikněte na měsíce, ve kterých chcete program mít:</p>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {#each SCHOOL_MONTHS as month}
            {@const isAssigned = planner.getProgramMonths(program.id).includes(month.index)}
            {@const color = getCategoryColor(program.category)}
            <button
              onclick={() => planner.toggleMonthForProgram(program.id, month.index)}
              class="px-3 py-3 rounded-lg border-2 text-sm font-medium transition-all text-center"
              style:border-color={isAssigned ? color : "#E2E8F0"}
              style:background-color={isAssigned ? `${color}12` : "transparent"}
              style:color={isAssigned ? color : "#64748B"}
            >
              {month.name}
              {#if isAssigned}
                <div class="mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
              {/if}
            </button>
          {/each}
        </div>

      {:else if isMonthMode && monthIndex !== null}
        <!-- Mod: prirazeni programu k mesici -->
        {#if availablePrograms.length === 0}
          <p class="text-text-muted text-sm text-center py-4">
            Nejprve vyberte programy v levém panelu
          </p>
        {:else}
          <p class="text-text-muted text-sm mb-4">Vyberte programy pro tento měsíc:</p>
          <div class="space-y-1.5 max-h-[400px] overflow-y-auto">
            {#each availablePrograms as prog}
              {@const color = getCategoryColor(prog.category)}
              {@const isAssigned = planner.getMonthPrograms(monthIndex).some((p) => p.id === prog.id)}
              <button
                onclick={() => planner.toggleMonthForProgram(prog.id, monthIndex)}
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left"
                style:border-color={isAssigned ? color : "#E2E8F0"}
                style:background-color={isAssigned ? `${color}08` : "transparent"}
              >
                <div
                  class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  style:border-color={isAssigned ? color : "#CBD5E1"}
                  style:background-color={isAssigned ? color : "transparent"}
                >
                  {#if isAssigned}
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  {/if}
                </div>
                <span class="text-sm font-medium" style:color={isAssigned ? color : "#0D1B2E"}>
                  {prog.icon} {prog.name}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <!-- Paticka -->
    <div class="px-6 py-4 border-t border-border-light flex justify-end">
      <button
        onclick={() => planner.closeModal()}
        class="bg-primary hover:bg-primary-hover text-bg-primary px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
      >
        Hotovo
      </button>
    </div>
  </div>
</div>
