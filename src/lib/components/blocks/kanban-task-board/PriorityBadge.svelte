<script lang="ts">
  import { priorityConfig } from '$lib/composables/useKanban'
  import { cn } from '$lib/utils'

  interface PriorityBadgeProps {
    priority: string
    iconSize?: string
    class?: string
  }

  let { priority, iconSize = 'size-3.5', class: className }: PriorityBadgeProps = $props()

  const config = $derived(priorityConfig[priority as keyof typeof priorityConfig])
</script>

{#if config}
  {@const Icon = config.icon}
  <div data-slot="kanban-board" class={cn('flex items-center gap-1', className)}>
    <Icon class={[iconSize, config.class]} />
    <span class={['text-xs font-semibold', config.class]}>{config.label}</span>
  </div>
{/if}
