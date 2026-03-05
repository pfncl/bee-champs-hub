<script lang="ts">
  import { t } from "../../i18n"
  import { usePlanner } from "./plannerState.svelte"
  import Sidebar from "./Sidebar.svelte"
  import CalendarGrid from "./CalendarGrid.svelte"
  import MonthAssignModal from "./MonthAssignModal.svelte"
  import InquiryModal from "./InquiryModal.svelte"
  import SummaryBar from "./SummaryBar.svelte"

  const planner = usePlanner()
  let inquiryOpen = $state(false)
</script>

<div class="min-h-screen bg-bg-warm">
  <!-- Horni lista -->
  <div class="bg-white border-b border-border-light sticky top-[68px] z-30">
    <div class="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
            <h1 class="text-xl font-bold text-text-dark font-heading">{t.planner.title}</h1>
          </div>
        </div>
        <p class="text-text-muted text-xs mt-0.5">{t.planner.subtitle}</p>
      </div>
      <div class="flex items-center gap-3">
        {#if planner.assignedProgramCount > 0}
          <span class="hidden md:inline-flex items-center gap-1.5 text-xs text-text-muted font-medium">
            <span class="font-bold text-primary">{planner.assignedProgramCount}</span>
            {t.planner.programsSelected}
          </span>
        {/if}
        <button
          onclick={() => inquiryOpen = true}
          class="bg-primary hover:bg-primary-hover text-bg-primary px-5 py-2.5 rounded-lg font-bold text-sm transition-all inline-flex items-center gap-2"
          disabled={planner.totalAssignments === 0}
          class:opacity-50={planner.totalAssignments === 0}
          class:cursor-not-allowed={planner.totalAssignments === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
          {t.planner.submitInquiry}
        </button>
      </div>
    </div>
  </div>

  <!-- Hlavni obsah: sidebar + kalendar -->
  <div class="w-full flex flex-col lg:flex-row">
    <!-- Sidebar -->
    <aside class="w-full lg:w-[360px] lg:shrink-0 bg-white border-r border-border-light lg:sticky lg:top-[130px] lg:h-[calc(100vh-130px)] overflow-y-auto">
      <Sidebar {planner} />
    </aside>

    <!-- Kalendar -->
    <div class="flex-1 p-4 sm:p-6 lg:p-8 pb-24">
      <div class="mb-5">
        <span class="text-[11px] font-bold uppercase tracking-widest text-text-muted/60">{t.planner.schoolYear}</span>
      </div>
      <CalendarGrid {planner} />
    </div>
  </div>

  <!-- Spodni summary lista -->
  {#if planner.assignedProgramCount > 0}
    <SummaryBar {planner} oninquiry={() => inquiryOpen = true} />
  {/if}

  <!-- Modal prirazeni mesicu -->
  {#if planner.modalOpen && planner.modalProgramId}
    <MonthAssignModal {planner} />
  {/if}

  <!-- Modal poptavky -->
  {#if inquiryOpen}
    <InquiryModal {planner} onclose={() => inquiryOpen = false} />
  {/if}
</div>
