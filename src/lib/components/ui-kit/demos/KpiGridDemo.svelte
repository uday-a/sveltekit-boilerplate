<script lang="ts">
  import { KpiGrid } from '$lib/components/ui/kpi-grid'
  import StatTile from '$lib/components/blocks/stat-tile/StatTile.svelte'

  const tiles = [
    { label: 'Total revenue', value: '$84,230', delta: '+12.5%' },
    { label: 'Active users', value: '2,420', delta: '+8.2%' },
    { label: 'Conversion rate', value: '3.24%', delta: '-0.4%', deltaTone: 'negative' as const },
    { label: 'Avg. order value', value: '$64.50', delta: '+2.1%' },
  ]
</script>

<KpiGrid columns={2}>
  {#each tiles as tile (tile.label)}
    <StatTile {...tile} />
  {/each}
</KpiGrid>
