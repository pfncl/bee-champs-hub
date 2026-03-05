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

<div class="min-h-screen bg-[#F0EDE8]">
  <!-- Horni lista - navy gradient -->
  <div class="bg-gradient-to-r from-bg-primary to-bg-secondary sticky top-[68px] z-30 shadow-lg">
    <div class="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-white font-heading">{t.planner.title}</h1>
            <p class="text-text-secondary text-xs">{t.planner.subtitle}</p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        {#if planner.assignedProgramCount > 0}
          <div class="hidden md:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
            <span class="text-2xl font-bold text-primary font-heading">{planner.assignedProgramCount}</span>
            <span class="text-xs text-text-secondary leading-tight">{t.planner.programsSelected}</span>
          </div>
        {/if}
        <button
          onclick={() => inquiryOpen = true}
          class="bg-primary hover:bg-primary-hover text-bg-primary px-5 py-2.5 rounded-xl font-bold text-sm transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02]"
          disabled={planner.totalAssignments === 0}
          class:opacity-40={planner.totalAssignments === 0}
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
    <aside class="w-full lg:w-[380px] lg:shrink-0 bg-white border-r border-black/[0.06] lg:sticky lg:top-[136px] lg:h-[calc(100vh-136px)] overflow-y-auto shadow-sm">
      <Sidebar {planner} />
    </aside>

    <!-- Kalendar -->
    <div class="flex-1 p-4 sm:p-6 lg:p-8 pb-28">
      <div class="mb-6 flex items-center gap-3">
        <div class="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent"></div>
        <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted/70 bg-[#F0EDE8] px-3">{t.planner.schoolYear}</span>
        <div class="h-px flex-1 bg-gradient-to-l from-primary/40 to-transparent"></div>
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
