/**
 * Stav rocniho planovace — Svelte 5 runes
 *
 * Mesice: zari (9) az srpen (8) nasledujiciho roku
 * Kazdy mesic muze mit prirazene programy
 */

import { categories, programs, type CategorySlug, type Program } from "@bee-champs/shared"

// === Typy ===

export interface MonthAssignment {
  readonly programId: string
  readonly monthIndex: number
}

export type MonthIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

/** Mesice skolniho roku: zari (9) az srpen (8) */
export const SCHOOL_MONTHS = [
  { index: 0 as MonthIndex, calendarMonth: 9, name: "Zari" },
  { index: 1 as MonthIndex, calendarMonth: 10, name: "Rijen" },
  { index: 2 as MonthIndex, calendarMonth: 11, name: "Listopad" },
  { index: 3 as MonthIndex, calendarMonth: 12, name: "Prosinec" },
  { index: 4 as MonthIndex, calendarMonth: 1, name: "Leden" },
  { index: 5 as MonthIndex, calendarMonth: 2, name: "Unor" },
  { index: 6 as MonthIndex, calendarMonth: 3, name: "Brezen" },
  { index: 7 as MonthIndex, calendarMonth: 4, name: "Duben" },
  { index: 8 as MonthIndex, calendarMonth: 5, name: "Kveten" },
  { index: 9 as MonthIndex, calendarMonth: 6, name: "Cerven" },
  { index: 10 as MonthIndex, calendarMonth: 7, name: "Cervenec" },
  { index: 11 as MonthIndex, calendarMonth: 8, name: "Srpen" },
] as const

// === Pomocne funkce ===

/** Najde program podle ID */
export function getProgramById(id: string): Program | undefined {
  return programs.find((p) => p.id === id)
}

/** Barva kategorie podle slugu */
export function getCategoryColor(slug: CategorySlug): string {
  return categories.find((c) => c.slug === slug)?.color ?? "#F5A623"
}

/** Nazev kategorie podle slugu */
export function getCategoryName(slug: CategorySlug): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug
}

// === Reaktivni stav ===

// Vybrane programy (zaskrtnute v sidebaru)
let selectedProgramIds = $state<Set<string>>(new Set())

// Prirazeni programu k mesicum
let assignments = $state<MonthAssignment[]>([])

// Filtrace
let searchQuery = $state("")
let activeCategory = $state<CategorySlug | "all">("all")

// Modal
let modalOpen = $state(false)
let modalProgramId = $state<string | null>(null)

// === Derived hodnoty ===

const filteredPrograms = $derived.by(() => {
  let filtered = programs.slice()

  if (activeCategory !== "all") {
    filtered = filtered.filter((p) => p.category === activeCategory)
  }

  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase()
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
    )
  }

  return filtered
})

const selectedProgramCount = $derived(selectedProgramIds.size)

const selectedPrograms = $derived(
  programs.filter((p) => selectedProgramIds.has(p.id))
)

const totalAssignments = $derived(assignments.length)

/** Programy prirazene k danemu mesici */
function getMonthPrograms(monthIndex: MonthIndex): Program[] {
  const ids = assignments
    .filter((a) => a.monthIndex === monthIndex)
    .map((a) => a.programId)
  return ids.map((id) => getProgramById(id)).filter((p): p is Program => p !== undefined)
}

/** Mesice prirazene danemu programu */
function getProgramMonths(programId: string): MonthIndex[] {
  return assignments.filter((a) => a.programId === programId).map((a) => a.monthIndex as MonthIndex)
}

// === Akce ===

function toggleProgram(programId: string) {
  const next = new Set(selectedProgramIds)
  if (next.has(programId)) {
    next.delete(programId)
    // Odebrat vsechna prirazeni tohoto programu
    assignments = assignments.filter((a) => a.programId !== programId)
  } else {
    next.add(programId)
  }
  selectedProgramIds = next
}

function assignProgramToMonth(programId: string, monthIndex: MonthIndex) {
  // Zabranit duplicitam
  const exists = assignments.some(
    (a) => a.programId === programId && a.monthIndex === monthIndex
  )
  if (!exists) {
    assignments = [...assignments, { programId, monthIndex }]
    // Automaticky oznacit program jako vybrany
    if (!selectedProgramIds.has(programId)) {
      const next = new Set(selectedProgramIds)
      next.add(programId)
      selectedProgramIds = next
    }
  }
}

function removeProgramFromMonth(programId: string, monthIndex: MonthIndex) {
  assignments = assignments.filter(
    (a) => !(a.programId === programId && a.monthIndex === monthIndex)
  )
}

function toggleMonthForProgram(programId: string, monthIndex: MonthIndex) {
  const exists = assignments.some(
    (a) => a.programId === programId && a.monthIndex === monthIndex
  )
  if (exists) {
    removeProgramFromMonth(programId, monthIndex)
  } else {
    assignProgramToMonth(programId, monthIndex)
  }
}

function clearAll() {
  selectedProgramIds = new Set()
  assignments = []
}

function openModal(programId: string) {
  modalProgramId = programId
  modalOpen = true
}

function closeModal() {
  modalOpen = false
  modalProgramId = null
}

function setSearchQuery(query: string) {
  searchQuery = query
}

function setActiveCategory(category: CategorySlug | "all") {
  activeCategory = category
}

// === Export ===

export function usePlanner() {
  return {
    // Stav (gettery pro reaktivni cteni)
    get selectedProgramIds() { return selectedProgramIds },
    get assignments() { return assignments },
    get searchQuery() { return searchQuery },
    get activeCategory() { return activeCategory },
    get modalOpen() { return modalOpen },
    get modalProgramId() { return modalProgramId },

    // Derived
    get filteredPrograms() { return filteredPrograms },
    get selectedProgramCount() { return selectedProgramCount },
    get selectedPrograms() { return selectedPrograms },
    get totalAssignments() { return totalAssignments },

    // Pomocne
    getMonthPrograms,
    getProgramMonths,

    // Akce
    toggleProgram,
    assignProgramToMonth,
    removeProgramFromMonth,
    toggleMonthForProgram,
    clearAll,
    openModal,
    closeModal,
    setSearchQuery,
    setActiveCategory,
  }
}
