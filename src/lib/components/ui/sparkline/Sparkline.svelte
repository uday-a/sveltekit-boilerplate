<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export type SparklineVariant = 'area' | 'bars' | 'line' | 'dots'

  export interface SparklineProps extends HTMLAttributes<HTMLDivElement> {
    data: number[]
    color?: string
    height?: number | string
    /** Mini form per KPI so every card reads distinct: area fill, bars,
     *  plain line, or line with sample dots. */
    variant?: SparklineVariant
    option?: any
    /** Accessible name announced for the chart image. Defaults to "Chart". */
    ariaLabel?: string
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { LineChart as EChartsLineChart, BarChart as EChartsBarChart } from 'echarts/charts'
  import { GridComponent, TooltipComponent } from 'echarts/components'
  import { use, init, type ECharts } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import { cn } from '$lib/utils'
  import { getChartColors, subscribeTheme } from './useChartTheme'

  // Bar + grid + tooltip registered alongside line so consumers can swap
  // `type: 'bar'` via the option escape hatch (bar / win-loss sparklines)
  // without having to `use()`-register the extras in their own code.
  use([CanvasRenderer, EChartsLineChart, EChartsBarChart, GridComponent, TooltipComponent])

  let {
    class: className,
    data,
    color: colorProp,
    height = 40,
    variant = 'area',
    option,
    ariaLabel,
    ref = $bindable(null),
    ...restProps
  }: SparklineProps = $props()

  let container: HTMLDivElement | null = $state(null)
  let chart: ECharts | null = $state(null)
  // Bumped by the theme subscription so the option re-resolves CSS tokens on dark/light flips.
  let themeKey = $state(0)

  $effect(() => {
    ref = container
  })

  $effect(() => {
    if (!container || typeof window === 'undefined') return
    const instance = init(container)
    chart = instance
    const ro = new ResizeObserver(() => instance.resize())
    ro.observe(container)
    const unsubscribe = subscribeTheme(() => {
      themeKey += 1
    })
    return () => {
      unsubscribe()
      ro.disconnect()
      instance.dispose()
      chart = null
    }
  })

  const mergedOption = $derived.by(() => {
    void themeKey
    const color = colorProp ?? getChartColors()[1]
    const bars = {
      type: 'bar',
      barWidth: '60%',
      itemStyle: { color, borderRadius: [2, 2, 0, 0] },
      data,
    }
    const line: Record<string, unknown> = {
      type: 'line',
      smooth: true,
      // Dots variant marks every sample; area keeps the original
      // last-point dot; plain line stays clean.
      symbol: variant === 'dots' ? 'circle' : 'none',
      symbolSize: variant === 'dots' ? 5 : 0,
      showSymbol: variant === 'dots',
      endLabel: { show: false },
      lineStyle: { width: variant === 'area' ? 1.75 : 2, color },
      itemStyle: { color, borderColor: color, borderWidth: 0 },
      data:
        variant === 'area'
          ? data.map((v, i) => ({
            value: v,
            symbol: i === data.length - 1 ? 'circle' : 'none',
            symbolSize: i === data.length - 1 ? 5 : 0,
          }))
          : data,
    }
    if (variant === 'area') {
      // WHY (Rule51): flat area fill at low opacity -- no linear-gradient
      // wash. Gradients read as decoration, not data.
      line.areaStyle = { opacity: 0.12, color }
    }
    const series = [variant === 'bars' ? bars : line]

    // Per-index series merge — partial overrides keep computed `type`/`data`.
    // Sparkline gets bar / win-loss variants this way (override `type: 'bar'`,
    // pass new data, the rest stays).
    const userOption: any = option ?? {}
    const { series: userSeries, ...userRest } = userOption
    const mergedSeries = Array.isArray(userSeries) ? series.map((s, i) => ({ ...s, ...(userSeries[i] ?? {}) })) : series

    return {
      grid: { left: 0, right: 0, top: 2, bottom: 2 },
      xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
      // WHY (Rule45): zero-based so a small trend can't read as a cliff.
      // Sparklines show shape; the zero base keeps them honest.
      yAxis: { type: 'value', show: false, min: 0 },
      tooltip: { show: false },
      series: mergedSeries,
      ...userRest,
    }
  })

  $effect(() => {
    if (chart) chart.setOption(mergedOption, { notMerge: true })
  })

  const heightStyle = $derived(/^\d+$/.test(String(height)) ? `${height}px` : String(height))
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -- focusable chart mirrors the Vue twin (keyboard focus ring on the chart image). -->
<div
  bind:this={container}
  role="img"
  tabindex="0"
  aria-label={ariaLabel || 'Chart'}
  style="height:{heightStyle}"
  class={cn('focus-visible:ring-ring w-full focus-visible:ring-2 focus-visible:outline-none', className)}
  {...restProps}
>
</div>
