<script lang="ts">
  import { t } from "../../i18n"
  import { getCategoryColor, type usePlanner } from "./plannerState.svelte"

  let { planner, oninquiry }: { planner: ReturnType<typeof usePlanner>; oninquiry: () => void } = $props()
</script>

<div class="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-bg-primary to-bg-secondary border-t border-primary/20 shadow-2xl">
  <div class="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
    <!-- Vyber label -->
    <span class="text-xs text-text-secondary shrink-0 font-semibold flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
      {t.planner.summary.selected}
    </span>

    <!-- Chipy programu -->
    <div class="flex-1 flex gap-2 overflow-x-auto">
      {#each planner.assignedPrograms as program}
        {@const color = getCategoryColor(program.category)}
        {@const months = planner.getProgramMonths(program.id)}
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0 whitespace-nowrap border"
          style:background-color="{color}20"
          style:border-color="{color}40"
          style:color={color}
        >
          {program.icon} {program.name}
          <span class="opacity-60">{months.map((m) => {
            const names = ["Zar", "Rij", "Lis", "Pro", "Led", "Uno", "Bre", "Dub", "Kve", "Cer", "Cvc", "Srp"]
            return names[m]
          }).join(", ")}</span>
        </span>
      {/each}
    </div>

    <!-- Akce -->
    <div class="flex items-center gap-3 shrink-0">
      <button
        onclick={() => planner.clearAll()}
        class="text-xs text-text-secondary hover:text-cat-events transition-colors font-semibold px-3 py-1.5 rounded-lg hover:bg-white/5"
      >
        {t.planner.summary.clearAll}
      </button>
      <button
        onclick={oninquiry}
        class="bg-primary hover:bg-primary-hover text-bg-primary px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02] inline-flex items-center gap-2"
        disabled={planner.totalAssignments === 0}
        class:opacity-50={planner.totalAssignments === 0}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
        {t.planner.submitInquiry}
      </button>
    </div>
  </div>
</div>
