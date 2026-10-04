<script lang="ts">
  import { getLocalTimeZone, today } from '@internationalized/date'
  import { RangeCalendar } from '$lib/components/ui/range-calendar'

  const end = today(getLocalTimeZone())
  let range = $state({ start: end.subtract({ days: 6 }), end })
</script>

<div class="flex flex-wrap items-start gap-4">
  <RangeCalendar bind:value={range} class="rounded-md border" />
  <p class="text-muted-foreground text-xs">
    <span class="text-foreground tabular-nums">{range.start?.toString()}</span>
    to
    <span class="text-foreground tabular-nums">{range.end?.toString()}</span>
  </p>
</div>
