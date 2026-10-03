<script lang="ts">
  import { Clock } from '@lucide/svelte'
  import { getDueStatus, formatDueDate } from '$lib/composables/useKanban'
  import { cn } from '$lib/utils'

  interface DueDateBadgeProps {
    dueDate: string
    variant?: 'chip' | 'inline'
    class?: string
  }

  let { dueDate, variant, class: className }: DueDateBadgeProps = $props()

  const status = $derived(getDueStatus(dueDate))
  const formatted = $derived(formatDueDate(dueDate))

  const chipClasses = $derived(
    status === 'overdue'
      ? 'bg-destructive/10 text-destructive'
      : status === 'soon'
        ? 'bg-warning/10 text-warning'
        : 'text-muted-foreground bg-muted',
  )

  const inlineClasses = $derived(
    status === 'overdue' ? 'text-destructive' : status === 'soon' ? 'text-warning' : 'text-foreground',
  )
</script>

{#if variant === 'chip'}
  <div
    data-slot="kanban-board"
    class={cn('flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium', chipClasses, className)}
  >
    <Clock class="size-3" />
    {formatted}
  </div>
{:else}
  <p data-slot="kanban-board" class={cn('flex items-center gap-1 text-sm leading-tight font-medium', inlineClasses, className)}>
    <Clock class="size-3" />
    {formatted}
  </p>
{/if}
