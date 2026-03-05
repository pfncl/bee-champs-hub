<script lang="ts">
  import { getCategoryColor, type usePlanner } from "./plannerState.svelte"

  let { planner }: { planner: ReturnType<typeof usePlanner> } = $props()
</script>

<div class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-light shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
  <div class="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
    <!-- Vybrane programy cipy -->
    <div class="flex-1 flex items-center gap-2 overflow-x-auto">
      <span class="text-xs text-text-muted shrink-0 font-medium">Vybrané:</span>
      <div class="flex gap-1.5 overflow-x-auto pb-0.5">
        {#each planner.selectedPrograms as program}
          {@const color = getCategoryColor(program.category)}
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 whitespace-nowrap"
            style:background-color="{color}12"
            style:color={color}
          >
            {program.icon} {program.name}
          </span>
        {/each}
      </div>
    </div>

    <!-- Akce -->
    <div class="flex items-center gap-3 shrink-0">
      <button
        onclick={() => planner.clearAll()}
        class="text-xs text-text-muted hover:text-cat-events transition-colors font-medium"
      >
        Vymazat vše
      </button>
      <button
        onclick={() => {
          // TODO: Sprint 5 — poptavkovy formular
          alert("Funkce bude dostupná v další verzi")
        }}
        class="bg-primary hover:bg-primary-hover text-bg-primary px-4 py-2 rounded-lg font-semibold text-xs transition-all"
        disabled={planner.totalAssignments === 0}
        class:opacity-50={planner.totalAssignments === 0}
      >
        Odeslat poptávku
      </button>
    </div>
  </div>
</div>
