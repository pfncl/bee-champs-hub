<script lang="ts">
  import { t } from "../../i18n"
  import { getCategoryColor, type usePlanner } from "./plannerState.svelte"

  let { planner }: { planner: ReturnType<typeof usePlanner> } = $props()
</script>

<div class="fixed bottom-0 left-0 right-0 z-40 bg-bg-primary border-t border-border-primary">
  <div class="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
    <!-- Vyber label -->
    <span class="text-xs text-text-secondary shrink-0 font-medium">{t.planner.summary.selected}</span>

    <!-- Chipy programu -->
    <div class="flex-1 flex gap-2 overflow-x-auto">
      {#each planner.assignedPrograms as program}
        {@const color = getCategoryColor(program.category)}
        {@const months = planner.getProgramMonths(program.id)}
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 whitespace-nowrap"
          style:background-color="{color}20"
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
        class="text-xs text-text-secondary hover:text-cat-events transition-colors font-medium"
      >
        {t.planner.summary.clearAll}
      </button>
      <button
        onclick={() => alert(t.planner.featureComingSoon)}
        class="bg-primary hover:bg-primary-hover text-bg-primary px-4 py-2 rounded-lg font-bold text-sm transition-all"
        disabled={planner.totalAssignments === 0}
        class:opacity-50={planner.totalAssignments === 0}
      >
        {t.planner.submitInquiry}
      </button>
    </div>
  </div>
</div>
