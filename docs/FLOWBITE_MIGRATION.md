# Migrace na Flowbite-Svelte — Predavaci dokument

## Stav: InquiryModal hotovy, zbytek ceka

### Co uz funguje
- Flowbite-Svelte integrovano s Tailwind v4 (`global.css` nakonfigurovano)
- `flowbite: 4.0.1` + `flowbite-svelte: ^1.31.0` nainstalovano
- Primary color skala (50-900) definovana v `@theme`
- MCP server pro Flowbite docs dostupny (`.mcp.json`)
- `InquiryModal.svelte` — kompletne prepsano na Flowbite (Modal, Input, Select, Textarea, Label, Helper, Button)

### Naucene lekce z InquiryModal migrace

1. **`{#snippet footer()}` nefunguje** v nasem setupu — davat Button primo do body obsahu (Flowbite "Form element" pattern)
2. **Scroll u dlouheho obsahu**: obalit formulare pole v `<div class="max-h-[60vh] overflow-y-auto overscroll-contain">`, hlavicku a patickus tlacitkem MIMO tento div
3. **Nepouzivat `title` prop** na Modal — vlastni hlavicka s X buttonem uvnitr, `dismissable={false}`
4. **`color="blue"` na Button** — default primary barva vyzaduje `--color-primary-700` skalu. S nasim `@theme` funguje `color="blue"` vzdy, nebo pouzit default az po pridani primary skaly (uz pridana)
5. **Flowbite Input `bind:value`** funguje v Svelte 5
6. **Input validace**: `color="red"` pro chybu, `undefined` pro default (NE `"base"`)

---

## Komponenty k migraci

### 1. MonthAssignModal.svelte (SLOZITY)
**Soubor**: `apps/web/src/components/planner/MonthAssignModal.svelte`
**Aktualne**: Kompletne custom modal (backdrop, white card, navy gradient header)
**Co prevest**:
- Custom modal -> `<Modal>` (bind:open, outsideclose, dismissable)
- 3x nativni `<button>` -> `<Button>`
- Custom checkbox div -> `<Checkbox>` z flowbite-svelte
- Mesicni vyber buttony (dynamicka barva/border)

**Poznamky**:
- Ma dva mody: vyber mesicu pro program / vyber programu pro mesic
- Pouziva dynamicke barvy z `getCategoryColor()` — bude potreba custom styling
- Gradient header (#35404F) — nahradit cistym Flowbite headerem

---

### 2. CalendarGrid.svelte (STREDNI)
**Soubor**: `apps/web/src/components/planner/CalendarGrid.svelte`
**Aktualne**: Custom card divvy pro mesice, nativni buttony
**Co prevest**:
- Mesicni karty (`bg-white rounded-2xl shadow-sm`) -> `<Card>` z flowbite-svelte
- "Pridat program" button (dashed border) -> `<Button outline>`
- Delete button (ikona X) -> `<Button>` icon-only nebo `<CloseButton>`
- Badge s poctem akci -> `<Badge>`

**Poznamky**:
- Karty maji custom header (#35404F pozadi) — overit `<Card>` classes prop
- Program chipy uvnitr karet maji dynamicke barvy

---

### 3. Sidebar.svelte (STREDNI)
**Soubor**: `apps/web/src/components/planner/Sidebar.svelte`
**Aktualne**: Custom search input, filtracni buttony, seznam programu
**Co prevest**:
- Search `<input>` -> `<Input>` s ikonou (viz Flowbite Input docs — search variant)
- 4x filtracni `<button>` -> `<Button>` group nebo `<ButtonGroup>`
- 26x program buttony -> zustanou custom (komplexni logika, ne pure GUI)

**Poznamky**:
- Filtracni chipy maji dynamicke barvy podle kategorie
- Search input ma custom ikonu (SVG lupa)

---

### 4. SummaryBar.svelte (JEDNODUCHY)
**Soubor**: `apps/web/src/components/planner/SummaryBar.svelte`
**Aktualne**: Navy gradient bar, custom chipy, nativni buttony
**Co prevest**:
- Program chipy (span-based) -> `<Badge>` s color
- "Vymazat vse" button -> `<Button color="alternative">`
- "Odeslat poptavku" button -> `<Button color="blue">`

---

### 5. Planner.svelte (JEDNODUCHY)
**Soubor**: `apps/web/src/components/planner/Planner.svelte`
**Aktualne**: Layout komponenta, 1x custom button
**Co prevest**:
- "Odeslat poptavku" button -> `<Button color="blue">`

---

### 6. AddToPlannerButton.svelte (JEDNODUCHY)
**Soubor**: `apps/web/src/components/planner/AddToPlannerButton.svelte`
**Aktualne**: Custom button s dynamickou barvou z props
**Co prevest**:
- Cely komponent -> `<Button>` s custom class/style pro dynamickou barvu

**Poznamky**:
- Barva se predava jako prop a pouziva `style:background-color={color}`
- Flowbite Button nepodporuje libovolne barvy — bude potreba `class` override

---

### 7. PlannerBadge.svelte (JEDNODUCHY)
**Soubor**: `apps/web/src/components/planner/PlannerBadge.svelte`
**Aktualne**: Custom span badge s poctem
**Co prevest**:
- Custom span -> `<Badge>` z flowbite-svelte

---

## Doporuceny postup

1. Zacit s **jednoduchymi** (PlannerBadge, SummaryBar buttony, Planner button)
2. Pak **stredni** (Sidebar search/filtry, CalendarGrid karty)
3. Nakonec **slozity** MonthAssignModal

## KRITICKE pravidlo

**PRED KAZDOU komponentou**:
1. `findComponent` -> `getComponentDoc` v MCP
2. Precist CELOU dokumentaci vcetne prikladu
3. Psat kod PRESNE podle dokumentace
4. NEHÁDEJ props a patterny!
