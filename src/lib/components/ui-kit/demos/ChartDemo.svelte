<script lang="ts">
  import { AreaChart } from '$lib/components/ui/area-chart'
  import { BarChart } from '$lib/components/ui/bar-chart'
  import { CalendarHeatmap } from '$lib/components/ui/calendar-heatmap'
  import { FunnelChart } from '$lib/components/ui/funnel-chart'
  import { GaugeChart } from '$lib/components/ui/gauge-chart'
  import { LineChart } from '$lib/components/ui/line-chart'
  import { RawChart } from '$lib/components/ui/raw-chart'
  import { Sparkline } from '$lib/components/ui/sparkline'
  import { TreemapChart } from '$lib/components/ui/treemap-chart'

  // One demo for every chart dir; the catalog passes the entry name.
  let { name }: { name?: string } = $props()

  const revenue = [
    { x: 'Apr', revenue: 42, expenses: 30 },
    { x: 'May', revenue: 48, expenses: 32 },
    { x: 'Jun', revenue: 51, expenses: 35 },
    { x: 'Jul', revenue: 58, expenses: 36 },
    { x: 'Aug', revenue: 63, expenses: 38 },
    { x: 'Sep', revenue: 71, expenses: 41 },
  ]
  const deploys = [
    { x: 'Mon', y: 12 },
    { x: 'Tue', y: 18 },
    { x: 'Wed', y: 9 },
    { x: 'Thu', y: 21 },
    { x: 'Fri', y: 15 },
  ]
  const spark = [4, 6, 5, 8, 7, 9, 12, 11, 14]
  const funnel = [
    { name: 'Visited', value: 1200 },
    { name: 'Signed up', value: 640 },
    { name: 'Activated', value: 310 },
    { name: 'Paid', value: 120 },
  ]
  const segments = [
    { name: 'Engineering', value: 48 },
    { name: 'Sales', value: 22 },
    { name: 'Support', value: 14 },
    { name: 'Marketing', value: 9 },
  ]
  // Last 90 days of deploy counts, stable across renders.
  const end = new Date()
  const start = new Date(end.getTime() - 89 * 86_400_000)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const heatmap = Array.from({ length: 90 }, (_, i): [string, number] =>
    [iso(new Date(start.getTime() + i * 86_400_000)), (i * 7) % 5])
  const rawOption = {
    xAxis: { type: 'category', data: deploys.map(d => d.x) },
    yAxis: { type: 'value' },
    series: [
      { type: 'bar', data: deploys.map(d => d.y) },
      { type: 'line', data: deploys.map(d => d.y - 3), smooth: true },
    ],
  }
</script>

{#if name === 'area-chart'}
  <AreaChart data={revenue} xField="x" yField={['revenue', 'expenses']} height={200} ariaLabel="Revenue and expenses" />
{:else if name === 'bar-chart'}
  <BarChart data={deploys} xField="x" yField="y" height={180} ariaLabel="Deploys per day" />
{:else if name === 'calendar-heatmap'}
  <CalendarHeatmap data={heatmap} range={[iso(start), iso(end)]} height={140} ariaLabel="Deploys per day, last 90 days" />
{:else if name === 'funnel-chart'}
  <FunnelChart data={funnel} height={220} ariaLabel="Signup funnel" />
{:else if name === 'gauge-chart'}
  <GaugeChart value={68} unit="%" height={180} ariaLabel="Quota used" />
{:else if name === 'raw-chart'}
  <RawChart option={rawOption} height={200} ariaLabel="Deploys bar and line combo" />
{:else if name === 'sparkline'}
  <Sparkline data={spark} height={36} ariaLabel="Revenue trend" />
{:else if name === 'treemap-chart'}
  <TreemapChart data={segments} height={200} ariaLabel="Headcount by department" />
{:else}
  <LineChart data={revenue} xField="x" yField={['revenue', 'expenses']} height={200} ariaLabel="Revenue and expenses" />
{/if}
