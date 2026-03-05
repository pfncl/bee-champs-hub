<script lang="ts">
  import { categories, programs, type CategorySlug } from "@bee-champs/shared"
  import { getCategoryColor, type usePlanner } from "./plannerState.svelte"

  let { planner }: { planner: ReturnType<typeof usePlanner> } = $props()

  /** Seskupeni filtrovanych programu podle kategorie */
  const groupedPrograms = $derived.by(() => {
    const groups: { slug: CategorySlug; name: string; color: string; programs: typeof programs[number][] }[] = []

    for (const cat of categories) {
      const catPrograms = planner.filteredPrograms.filter((p) => p.category === cat.slug)
      if (catPrograms.length > 0) {
        groups.push({
          slug: cat.slug,
          name: cat.name,
          color: cat.color,
          programs: catPrograms,
        })
      }
    }

    return groups
  })

  const categoryFilters: { slug: CategorySlug | "all"; label: string; color: string }[] = [
    { slug: "all", label: "Vše", color: "#94A3B8" },
    ...categories.map((c) => ({ slug: c.slug as CategorySlug, label: c.label, color: c.color })),
  ]
</script>

<div class="p-4 sm:p-5">
  <!-- Hlavicka -->
  <div class="mb-5">
    <h2 class="text-lg font-bold text-text-dark font-heading">Programy</h2>
    <p class="text-text-muted text-xs mt-1">Vyberte programy a přiřaďte je do měsíců</p>
  </div>

  <!-- Vyhledavani -->
  <div class="relative mb-4">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    <input
      type="text"
      placeholder="Hledat program..."
      value={planner.searchQuery}
      oninput={(e) => planner.setSearchQuery(e.currentTarget.value)}
      class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border-light bg-bg-warm text-text-dark text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
    />
  </div>

  <!-- Filtracni tlacitka kategorii -->
  <div class="flex flex-wrap gap-1.5 mb-5">
    {#each categoryFilters as filter}
      <button
        onclick={() => planner.setActiveCategory(filter.slug)}
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
        style:border-color={planner.activeCategory === filter.slug ? filter.color : "transparent"}
        style:background-color={planner.activeCategory === filter.slug ? `${filter.color}15` : "transparent"}
        style:color={planner.activeCategory === filter.slug ? filter.color : "#64748B"}
      >
        {filter.label}
      </button>
    {/each}
  </div>

  <!-- Seznam programu seskupenych pod kategoriemi -->
  <div class="space-y-4">
    {#each groupedPrograms as group}
      <div>
        <!-- Hlavicka kategorie -->
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full" style:background-color={group.color}></div>
          <span class="text-xs font-bold uppercase tracking-wider" style:color={group.color}>
            {group.name}
          </span>
          <span class="text-[10px] text-text-muted">({group.programs.length})</span>
        </div>

        <!-- Programy -->
        <div class="space-y-1">
          {#each group.programs as program}
            {@const isSelected = planner.selectedProgramIds.has(program.id)}
            {@const assignedMonths = planner.getProgramMonths(program.id)}
            <div
              class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all cursor-pointer group/item hover:bg-bg-warm"
              class:bg-bg-warm={isSelected}
              style:border-left={isSelected ? `3px solid ${group.color}` : "3px solid transparent"}
              onclick={() => planner.toggleProgram(program.id)}
              role="button"
              tabindex="0"
              onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); planner.toggleProgram(program.id) }}}
            >
              <!-- Checkbox -->
              <div
                class="w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                style:border-color={isSelected ? group.color : "#CBD5E1"}
                style:background-color={isSelected ? group.color : "transparent"}
              >
                {#if isSelected}
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                {/if}
              </div>

              <!-- Nazev a info -->
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-text-dark truncate">
                  <span class="mr-1.5">{program.icon}</span>
                  {program.name}
                </div>
                {#if assignedMonths.length > 0}
                  <div class="text-[10px] text-text-muted mt-0.5">
                    Přiřazeno: {assignedMonths.length}× měsíc
                  </div>
                {/if}
              </div>

              <!-- Tlacitko prirazeni mesicu -->
              {#if isSelected}
                <button
                  onclick|stopPropagation={() => planner.openModal(program.id)}
                  class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 hover:bg-white"
                  style:color={group.color}
                  title="Přiřadit do měsíců"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}

    {#if groupedPrograms.length === 0}
      <div class="text-center py-8 text-text-muted text-sm">
        Žádné programy neodpovídají filtru
      </div>
    {/if}
  </div>
</div>
