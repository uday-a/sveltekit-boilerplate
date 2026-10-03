<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export interface RangeCalendarHeadCellProps extends HTMLAttributes<HTMLTableCellElement> {
    ref?: HTMLTableCellElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let { class: className, children, ref = $bindable(null), ...restProps }: RangeCalendarHeadCellProps = $props()
</script>

<th
  bind:this={ref}
  scope="col"
  data-uipkge
  data-slot="range-calendar-head-cell"
  class={cn('text-muted-foreground flex-1 rounded-md text-xs font-normal', className)}
  {...restProps}
>
  {@render children?.()}
</th>
