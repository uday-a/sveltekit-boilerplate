<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export interface RangeCalendarGridHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
    ref?: HTMLTableSectionElement | null
  }
</script>

<script lang="ts">
  let { class: className, children, ref = $bindable(null), ...restProps }: RangeCalendarGridHeadProps = $props()
</script>

<thead bind:this={ref} data-uipkge data-slot="range-calendar-grid-head" class={className} {...restProps}>
  {@render children?.()}
</thead>
