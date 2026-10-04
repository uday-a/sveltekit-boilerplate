<script lang="ts">
  import { getLocalTimeZone, today } from '@internationalized/date'
  import { Calendar, type CalendarProps } from '$lib/components/ui/calendar'

  let date = $state<CalendarProps['value']>(today(getLocalTimeZone()))
</script>

<div class="flex flex-wrap items-start gap-4">
  <Calendar bind:value={date} class="rounded-md border" />
  <p class="text-muted-foreground text-xs">
    Selected: <span class="text-foreground tabular-nums">{date?.toString()}</span>
  </p>
</div>
