<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export interface RangeCalendarGridProps extends HTMLAttributes<HTMLTableElement> {
    ref?: HTMLTableElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let { class: className, children, ref = $bindable(null), ...restProps }: RangeCalendarGridProps = $props()
</script>

<table bind:this={ref} data-uipkge data-slot="range-calendar-grid" class={cn('w-full border-collapse', className)} {...restProps}>
  {@render children?.()}
</table>
