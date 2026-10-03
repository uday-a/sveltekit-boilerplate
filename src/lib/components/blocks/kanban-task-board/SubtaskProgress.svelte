<script lang="ts">
  import { CheckCircle2 } from '@lucide/svelte'

  interface SubtaskProgressProps {
    done: number
    total: number
    barHeight?: string
    class?: string
  }

  let { done, total, barHeight = 'h-1.5', class: className }: SubtaskProgressProps = $props()

  const percent = $derived(total > 0 ? Math.round((done / total) * 100) : 0)
  const isComplete = $derived(done === total && total > 0)
</script>

{#if total > 0}
  <div data-slot="kanban-board" class={className}>
    <div class="mb-1 flex items-center justify-between">
      <span class="text-muted-foreground text-xs">
        {#if isComplete}
          <CheckCircle2 class="text-success mr-0.5 inline size-3" />
        {/if}
        {done}/{total} subtasks
      </span>
      <span class="text-muted-foreground text-xs font-medium tabular-nums">{percent}%</span>
    </div>
    <div class={['bg-muted overflow-hidden rounded-full', barHeight]}>
      <div
        class={['h-full rounded-full transition-[width,background-color] duration-500', isComplete ? 'bg-success' : 'bg-primary']}
        style="width: {percent}%"
      ></div>
    </div>
  </div>
{/if}
