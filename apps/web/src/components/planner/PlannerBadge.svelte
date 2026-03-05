<script lang="ts">
  import { usePlanner } from "./plannerState.svelte"

  const planner = usePlanner()
</script>

{#if planner.assignedProgramCount > 0}
  <span class="bg-primary text-bg-primary text-[11px] font-bold min-w-[22px] h-[22px] px-1.5 rounded-full inline-flex items-center justify-center ml-0.5">
    {planner.assignedProgramCount}
  </span>
{/if}
