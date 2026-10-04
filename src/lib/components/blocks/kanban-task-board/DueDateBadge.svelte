<script lang="ts">
  import { CircleAlert, Clock } from '@lucide/svelte'
  import { getDueStatus, formatDueDate } from '$lib/composables/useKanban'
  import { cn } from '$lib/utils'
  import { t } from '$lib/i18n'

  interface DueDateBadgeProps {
    dueDate: string
    variant?: 'chip' | 'inline'
    class?: string
  }

  let { dueDate, variant, class: className }: DueDateBadgeProps = $props()

  const status = $derived(getDueStatus(dueDate))
  const formatted = $derived(formatDueDate(dueDate))

  // Urgency must not rely on color alone: overdue swaps the icon, and both
  // states carry a screen-reader label.
  const Icon = $derived(status === 'overdue' ? CircleAlert : Clock)
  const statusLabel = $derived(
    status === 'overdue' ? $t('dashboard.kanban.overdue') : status === 'soon' ? $t('dashboard.kanban.dueSoon') : '',
  )

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
    <Icon class="size-3" aria-hidden="true" />
    {#if statusLabel}<span class="sr-only">{statusLabel}:</span>{/if}
    {formatted}
  </div>
{:else}
  <p data-slot="kanban-board" class={cn('flex items-center gap-1 text-sm leading-tight font-medium', inlineClasses, className)}>
    <Icon class="size-3" aria-hidden="true" />
    {#if statusLabel}<span class="sr-only">{statusLabel}:</span>{/if}
    {formatted}
  </p>
{/if}
