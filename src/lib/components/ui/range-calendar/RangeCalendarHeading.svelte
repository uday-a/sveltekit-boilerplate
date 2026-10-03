<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface RangeCalendarHeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    children?: Snippet<[{ headingValue: string }]>
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { getContext } from 'svelte'
  import { cn } from '$lib/utils'
  import { CALENDAR_CONTEXT_KEY, type CalendarState } from '../calendar/calendar-state.svelte'

  let { class: className, children, ref = $bindable(null), ...restProps }: RangeCalendarHeadingProps = $props()

  const state = getContext<CalendarState | undefined>(CALENDAR_CONTEXT_KEY)
  const headingValue = $derived(state?.headingValue ?? '')
</script>

<div bind:this={ref} data-uipkge data-slot="range-calendar-heading" class={cn('text-sm font-medium', className)} {...restProps}>
  {#if children}
    {@render children({ headingValue })}
  {:else}
    {headingValue}
  {/if}
</div>
