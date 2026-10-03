<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export interface RawChartProps extends HTMLAttributes<HTMLDivElement> {
    /** Full ECharts option — the page owns registration (Bar/Gauge/Line/…) and theme tokens. */
    option: Record<string, unknown>
    height?: number | string
    /** Accessible name announced for the chart image. Defaults to "Chart". */
    ariaLabel?: string
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type * as echarts from 'echarts/core'
  import { cn } from '$lib/utils'

  let {
    class: className,
    option,
    height = 300,
    ariaLabel = undefined,
    ref = $bindable(null),
    ...restProps
  }: RawChartProps = $props()

  let host = $state<HTMLDivElement | null>(null)
  let chart: echarts.ECharts | null = null
  let EChartsCore: typeof import('echarts/core') | null = null

  $effect(() => {
    ref = host
  })

  // ECharts loads via dynamic import, only in the browser (`onMount` never
  // runs during SSR). Chart + grid + tooltip + legend components register
  // here so pages hand a complete `option` without importing echarts.
  onMount(() => {
    let cancelled = false
    let ro: ResizeObserver | null = null
    ;(async () => {
      const [core, renderer, charts, components] = await Promise.all([
        import('echarts/core'),
        import('echarts/renderers'),
        import('echarts/charts'),
        import('echarts/components'),
      ])
      if (cancelled || !host) return
      EChartsCore = core
      core.use([
        renderer.CanvasRenderer,
        charts.BarChart,
        charts.GaugeChart,
        charts.LineChart,
        components.GridComponent,
        components.LegendComponent,
        components.TooltipComponent,
      ])
      const instance = core.init(host)
      chart = instance
      // Theme-aware: re-resolve when <html> class flips (dark pivot).
      const mo = new MutationObserver(() => {
        if (!browser) return
        chart?.setOption(option, { notMerge: true })
      })
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      ro = new ResizeObserver(() => instance.resize())
      ro.observe(host)
      instance.setOption(option, { notMerge: true })
      return () => mo.disconnect()
    })()
    return () => {
      cancelled = true
      ro?.disconnect()
      chart?.dispose()
      chart = null
    }
  })

  $effect(() => {
    if (browser && chart && EChartsCore) chart.setOption(option, { notMerge: true })
  })

  const heightStyle = $derived(
    `height: ${/^\d+$/.test(String(height)) ? `${height}px` : String(height)}`,
  )
</script>

<!-- Focusable chart image mirrors the chart twins for keyboard users. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  data-uipkge
  data-slot="raw-chart"
  role="img"
  tabindex="0"
  aria-label={ariaLabel || 'Chart'}
  style={heightStyle}
  class={cn('focus-visible:ring-ring w-full focus-visible:ring-2 focus-visible:outline-none', className)}
  {...restProps}
>
  <div bind:this={host} class="size-full"></div>
</div>
