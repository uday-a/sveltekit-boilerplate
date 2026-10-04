<script lang="ts">
  import { Progress } from '$lib/components/ui/progress'

  const rows = [
    { label: 'Uploading', value: 78 },
    { label: 'Processing', value: 42 },
    { label: 'Complete', value: 100 },
  ]
</script>

<div class="space-y-4">
  {#each rows as row (row.label)}
    <div class="space-y-1">
      <div class="flex justify-between text-xs">
        <span>{row.label}</span><span class="tabular-nums">{row.value}%</span>
      </div>
      <Progress value={row.value} aria-label={row.label} />
    </div>
  {/each}
</div>
