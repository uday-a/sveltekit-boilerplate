<script lang="ts">
  import { cn } from '$lib/utils'

  interface TagBadgeProps {
    label: string
    color: string
    class?: string
  }

  let { label, color, class: className }: TagBadgeProps = $props()
</script>

<span
  data-slot="kanban-board"
  class={cn('rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', color, className)}
>
  {label}
</span>
