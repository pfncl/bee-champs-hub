<script lang="ts">
  import { usePlanner } from "./plannerState.svelte"
  import Sidebar from "./Sidebar.svelte"
  import CalendarGrid from "./CalendarGrid.svelte"
  import MonthAssignModal from "./MonthAssignModal.svelte"
  import SummaryBar from "./SummaryBar.svelte"

  const planner = usePlanner()
</script>

<div class="min-h-screen bg-bg-warm">
  <!-- Horni lista -->
  <div class="bg-white border-b border-border-light sticky top-[68px] z-30">
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text-dark font-heading">Roční plánovač</h1>
        <p class="text-text-muted text-sm mt-0.5">
          Vyberte programy a přiřaďte je do měsíců školního roku
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="hidden sm:flex items-center gap-2 text-sm text-text-muted">
          <span class="inline-flex items-center gap-1.5 bg-bg-warm px-3 py-1.5 rounded-full">
            <span class="w-2 h-2 rounded-full bg-primary"></span>
            {planner.selectedProgramCount} programů vybráno
          </span>
          <span class="inline-flex items-center gap-1.5 bg-bg-warm px-3 py-1.5 rounded-full">
            <span class="w-2 h-2 rounded-full bg-cat-projects"></span>
            {planner.totalAssignments} přiřazení
          </span>
        </div>
        <button
          onclick={() => {
            // TODO: Sprint 5 — otevrit poptavkovy formular
            alert("Funkce bude dostupná v další verzi")
          }}
          class="bg-primary hover:bg-primary-hover text-bg-primary px-5 py-2.5 rounded-lg font-semibold text-sm transition-all inline-flex items-center gap-2"
          disabled={planner.totalAssignments === 0}
          class:opacity-50={planner.totalAssignments === 0}
          class:cursor-not-allowed={planner.totalAssignments === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
          Odeslat poptávku
        </button>
      </div>
    </div>
  </div>

  <!-- Hlavni obsah: sidebar + kalendar -->
  <div class="max-w-[1600px] mx-auto flex flex-col lg:flex-row">
    <!-- Sidebar -->
    <aside class="w-full lg:w-[340px] lg:shrink-0 bg-white border-r border-border-light lg:sticky lg:top-[136px] lg:h-[calc(100vh-136px)] overflow-y-auto">
      <Sidebar {planner} />
    </aside>

    <!-- Kalendar -->
    <div class="flex-1 p-4 sm:p-6 pb-24">
      <CalendarGrid {planner} />
    </div>
  </div>

  <!-- Spodni summary lista -->
  {#if planner.selectedProgramCount > 0}
    <SummaryBar {planner} />
  {/if}

  <!-- Modal prirazeni mesicu -->
  {#if planner.modalOpen && planner.modalProgramId}
    <MonthAssignModal {planner} />
  {/if}
</div>
