<script lang="ts">
  import { SCHOOL_MONTHS, getCategoryColor, type MonthIndex, type usePlanner } from "./plannerState.svelte"

  let { planner }: { planner: ReturnType<typeof usePlanner> } = $props()
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
  {#each SCHOOL_MONTHS as month}
    {@const monthPrograms = planner.getMonthPrograms(month.index)}
    <div class="bg-white rounded-xl border border-border-light overflow-hidden group/month hover:shadow-md transition-shadow">
      <!-- Hlavicka mesice -->
      <div class="px-4 py-3 bg-bg-primary flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-white font-heading">{month.name}</span>
          {#if monthPrograms.length > 0}
            <span class="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {monthPrograms.length}
            </span>
          {/if}
        </div>
        <button
          onclick={() => {
            // Otevrit modal s vyberem programu pro tento mesic
            // Pouzijeme specialni ID pro "pridat k mesici"
            planner.openModal(`__month__${month.index}`)
          }}
          class="text-text-secondary hover:text-primary transition-colors opacity-0 group-hover/month:opacity-100"
          title="Přidat program do tohoto měsíce"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        </button>
      </div>

      <!-- Obsah mesice -->
      <div class="p-3 min-h-[80px]">
        {#if monthPrograms.length > 0}
          <div class="flex flex-wrap gap-1.5">
            {#each monthPrograms as program}
              {@const color = getCategoryColor(program.category)}
              <div
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group/tag"
                style:background-color="{color}12"
                style:color={color}
                style:border="1px solid {color}25"
              >
                <span>{program.icon}</span>
                <span class="max-w-[120px] truncate">{program.name}</span>
                <button
                  onclick={() => planner.removeProgramFromMonth(program.id, month.index)}
                  class="ml-0.5 opacity-0 group-hover/tag:opacity-100 hover:bg-white/50 rounded transition-all"
                  title="Odebrat z tohoto měsíce"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex items-center justify-center h-full text-text-muted text-xs py-4">
            Žádné programy
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>
