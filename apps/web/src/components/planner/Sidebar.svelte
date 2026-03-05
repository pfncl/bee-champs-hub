<script lang="ts">
  import { categories, type CategorySlug } from "@bee-champs/shared"
  import { t } from "../../i18n"
  import { getCategoryColor, type usePlanner } from "./plannerState.svelte"

  let { planner }: { planner: ReturnType<typeof usePlanner> } = $props()

  const categoryFilters: { slug: CategorySlug | "all"; label: string; color: string }[] = [
    { slug: "all", label: t.planner.sidebar.filterAll, color: "var(--color-text-secondary)" },
    ...categories.map((c) => ({ slug: c.slug as CategorySlug, label: c.label, color: c.color })),
  ]

  /** Seskupeni filtrovanych programu podle kategorie */
  const groupedPrograms = $derived.by(() => {
    const groups: { slug: CategorySlug; name: string; color: string; programs: typeof planner.filteredPrograms }[] = []
    for (const cat of categories) {
      const catPrograms = planner.filteredPrograms.filter((p) => p.category === cat.slug)
      if (catPrograms.length > 0) {
        groups.push({ slug: cat.slug, name: cat.name, color: cat.color, programs: catPrograms })
      }
    }
    return groups
  })
</script>

<div class="p-4 sm:p-5">
  <!-- Hlavicka -->
  <div class="mb-4">
    <h2 class="text-base font-bold text-text-dark font-heading">{t.planner.sidebar.title}</h2>
    <p class="text-text-muted text-[11px] mt-0.5">{t.planner.sidebar.subtitle}</p>
  </div>

  <!-- Vyhledavani -->
  <div class="relative mb-3">
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    <input
      type="text"
      placeholder={t.planner.sidebar.searchPlaceholder}
      value={planner.searchQuery}
      oninput={(e) => planner.setSearchQuery(e.currentTarget.value)}
      class="w-full pl-9 pr-3 py-2 rounded-lg border border-border-light bg-bg-warm/50 text-text-dark text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
    />
  </div>

  <!-- Filtrace kategorii -->
  <div class="flex flex-wrap gap-1.5 mb-4">
    {#each categoryFilters as filter}
      {@const isActive = planner.activeCategory === filter.slug}
      <button
        onclick={() => planner.setActiveCategory(filter.slug)}
        class="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5"
        class:bg-bg-warm={isActive}
        style:color={isActive ? (filter.slug === "all" ? "var(--color-text-dark)" : filter.color) : "var(--color-text-muted)"}
      >
        <span class="w-2 h-2 rounded-full shrink-0" style:background-color={filter.slug === "all" ? "var(--color-text-muted)" : filter.color}></span>
        {filter.label}
      </button>
    {/each}
  </div>

  <!-- Seznam programu -->
  <div class="space-y-3">
    {#each groupedPrograms as group}
      <div>
        <!-- Hlavicka kategorie -->
        <div class="flex items-center gap-1.5 mb-1.5 px-1">
          <div class="w-1.5 h-1.5 rounded-full" style:background-color={group.color}></div>
          <span class="text-[10px] font-bold uppercase tracking-wider" style:color={group.color}>
            {group.name}
          </span>
        </div>

        <!-- Programy -->
        <div class="space-y-0.5">
          {#each group.programs as program}
            {@const isAssigned = planner.isProgramAssigned(program.id)}
            {@const monthCount = planner.getProgramMonths(program.id).length}
            <button
              onclick={() => planner.openModal(program.id)}
              class="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all cursor-pointer hover:bg-bg-warm text-left"
              class:bg-bg-warm={isAssigned}
              style:border-left={isAssigned ? `3px solid ${group.color}` : "3px solid transparent"}
            >
              <!-- Ikona + nazev -->
              <span
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style:background-color="{group.color}12"
              >{program.icon}</span>
              <div class="flex-1 min-w-0">
                <span class="text-[13px] font-medium text-text-dark truncate block">{program.name}</span>
                <span class="text-[10px] text-text-muted">
                  {#if monthCount > 0}
                    {t.planner.sidebar.assignedCount.replace("{count}", String(monthCount))}
                  {:else}
                    {program.ageRange} · {program.duration}
                  {/if}
                </span>
              </div>

              <!-- Indikator stavu -->
              {#if isAssigned}
                <span class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style:background-color={group.color}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
              {:else}
                <span class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-text-muted/40 hover:text-primary hover:bg-primary/10 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/each}

    {#if groupedPrograms.length === 0}
      <div class="text-center py-6 text-text-muted text-sm">
        {t.planner.sidebar.noResults}
      </div>
    {/if}
  </div>
</div>
