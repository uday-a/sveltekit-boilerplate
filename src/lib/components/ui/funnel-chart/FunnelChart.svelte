<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'
  import type { FunnelStageInput } from '$lib/funnel'

  export interface FunnelChartProps extends HTMLAttributes<HTMLDivElement> {
    data: FunnelStageInput[]
    height?: number | string
    showLabels?: boolean
    showLegend?: boolean
    /** ECharts option escape hatch -- merged on top of the computed option. */
    option?: any
    /** Accessible name announced for the chart image. Defaults to the computed funnel description. */
    ariaLabel?: string
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import type { ECharts, EChartsCoreOption } from 'echarts/core'
  import { cn } from '$lib/utils'
  import {
    computeFunnelStats, describeFunnelForAria, formatPct, formatStepPill,
    funnelBarOpacity, normalizeFunnelStages,
  } from '$lib/funnel'
  import {
    chartColors, chartMutedColor, chartSurfaceColor, chartTextColor,
    chartTooltipBg, chartTooltipBorder, chartTooltipText,
  } from './useChartTheme.svelte'

  let {
    class: className,
    data,
    height = 300,
    showLabels = true,
    showLegend = false,
    option,
    ariaLabel,
    ref = $bindable(null),
    ...restProps
  }: FunnelChartProps = $props()

  let host = $state<HTMLDivElement | null>(null)
  let chart: ECharts | null = null
  let EChartsCore: typeof import('echarts/core') | null = null

  // True ECharts funnel (triangle): stage order top->bottom matches the data
  // order via sort:'none'. Single-hue chart-1 blue fading 1.0 -> 0.45 by
  // depth; minSize keeps the tail wide enough that its inside label hides
  // cleanly instead of truncating.
  const stages = $derived(normalizeFunnelStages(data))
  const stats = $derived(computeFunnelStats(stages))
  const autoLabel = $derived(describeFunnelForAria(stats))

  // Solid stage colour = primary laid over the card surface at the depth
  // opacity. Pre-blending (instead of item opacity) keeps the same-colour
  // round-join stroke from showing as a darker ring where it overlaps the fill.
  // A 1px canvas resolves any CSS colour format (hex, rgb, oklch).
  function blendOver(fg: string, bg: string, alpha: number): string {
    if (alpha >= 1 || typeof document === 'undefined') return fg
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return fg
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1, 1)
    ctx.globalAlpha = alpha
    ctx.fillStyle = fg
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `rgb(${r}, ${g}, ${b})`
  }

  const mergedOption = $derived.by((): EChartsCoreOption => {
    // --chart-1 blue, NOT --primary (--primary is near-monochrome in both
    // themes and reads black/white; chart-1 keeps its hue by token contract).
    const primary = chartColors()[0] ?? '#2563eb'
    const snapshot = stats
    return {
      color: [primary],
      tooltip: {
        trigger: 'item',
        backgroundColor: chartTooltipBg(),
        borderColor: chartTooltipBorder(),
        textStyle: { color: chartTooltipText(), fontSize: 12 },
        formatter: (p: { dataIndex: number }) => {
          const s = snapshot.steps[p.dataIndex]
          if (!s) return ''
          const lines = [
            `<strong>${s.name}</strong>`,
            `Count: ${s.value.toLocaleString()}`,
            s.stepRate === null
              ? 'Baseline: 100% of top'
              : `Step rate: ${formatPct(s.stepRate)} of ${s.prevName}`,
            `Cumulative: ${formatPct(s.cumulative)} of top`,
          ]
          if (s.delta !== null) {
            const sign = s.delta < 0 ? '−' : '+'
            lines.push(`Δ vs prior: ${sign}${Math.abs(s.delta).toLocaleString()}`)
          }
          return lines.join('<br/>')
        },
      },
      aria: { enabled: true, label: { description: autoLabel } },
      legend: showLegend
        ? { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 12, color: chartTextColor() } }
        : undefined,
      series: [
        {
          name: 'Count',
          type: 'funnel',
          // Data order top->bottom (largest first in practice, but never
          // re-sorted -- equal stages keep their meaning).
          sort: 'none',
          orient: 'vertical',
          // Gap absorbs the 3px outer half of each stage's 6px round-join stroke
          // below, keeping a ~5px visible gutter between stages.
          gap: 11,
          // Tail floor: the last stage stays wide enough for its inside
          // label to hide cleanly instead of rendering truncated text.
          minSize: '28%',
          top: 8,
          bottom: 8,
          left: 8,
          right: 8,
          data: stages.map((s, i) => {
            const fill = blendOver(primary, chartSurfaceColor(), funnelBarOpacity(i, stages.length))
            return {
              name: s.name,
              value: s.value,
              itemStyle: {
                color: fill,
                // ECharts funnel polygons have no borderRadius; a same-colour
                // stroke with round joins softens the corners (~3px radius).
                borderColor: fill,
                borderWidth: 6,
                borderJoin: 'round',
              },
            }
          }),
          // Smooth grow-in: staggered per-stage rise with a soft cubic-out
          // ease, re-played on range changes.
          animationDuration: 700,
          animationEasing: 'cubicOut',
          animationDelay: (idx: number) => idx * 60,
          label: {
            show: showLabels,
            position: 'inside',
            // WHY (Rule2): inside-label ink comes from the surface token, not
            // a raw '#fff' -- it tracks light/dark like every other token.
            color: chartSurfaceColor(),
            fontSize: 12,
            fontWeight: 600,
            overflow: 'truncate',
            formatter: (p: { dataIndex: number }) => {
              const s = snapshot.steps[p.dataIndex]
              if (!s) return ''
              return `{t|${s.name}}\n{v|${s.value.toLocaleString()} · ${formatPct(s.cumulative)}}`
            },
            rich: {
              t: { fontSize: 12, fontWeight: 600, lineHeight: 16 },
              v: { fontSize: 12, fontWeight: 500, lineHeight: 16 },
            },
          },
          labelLayout: { hideOverlap: true },
          emphasis: { focus: 'self', scaleSize: 4 },
          // Non-hovered stages grey out (solid muted fill, readable label)
          // instead of ECharts' default near-transparent blur.
          blur: {
            itemStyle: { color: chartMutedColor(), borderColor: chartMutedColor(), opacity: 1 },
            label: { color: chartTextColor(), opacity: 1 },
          },
        },
      ],
      ...(option ?? {}),
    }
  })

  // ECharts loads via dynamic import, only in the browser (`onMount` never
  // runs during SSR). Pills + sr-only table below render from the same pure
  // stats, so SSR still ships the accessible content before hydration.
  onMount(() => {
    let cancelled = false
    let ro: ResizeObserver | null = null
    let mo: MutationObserver | null = null
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
        charts.FunnelChart,
        components.AriaComponent,
        components.TooltipComponent,
        components.LegendComponent,
      ])
      const instance = core.init(host)
      chart = instance
      // Theme-aware: re-resolve when <html> class flips (dark pivot). The
      // derived option already re-reads tokens via themeKey; this mirrors
      // RawChart so a flip between derivations still repaints.
      mo = new MutationObserver(() => {
        if (!browser) return
        chart?.setOption(mergedOption, { notMerge: true })
      })
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      ro = new ResizeObserver(() => instance.resize())
      ro.observe(host)
      instance.setOption(mergedOption, { notMerge: true })
    })()
    return () => {
      cancelled = true
      ro?.disconnect()
      mo?.disconnect()
      chart?.dispose()
      chart = null
    }
  })

  $effect(() => {
    if (browser && chart && EChartsCore) chart.setOption(mergedOption, { notMerge: true })
  })

  const heightStyle = $derived(
    `height: ${/^\d+$/.test(String(height)) ? `${height}px` : String(height)}`,
  )
</script>

<div
  bind:this={ref}
  data-uipkge
  data-slot="funnel-chart"
  class={cn('w-full', className)}
  {...restProps}
>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    role="img"
    tabindex="0"
    aria-label={ariaLabel ?? autoLabel}
    style={heightStyle}
    class={cn('w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
  >
    <div bind:this={host} class="size-full"></div>
  </div>
  <!-- Step-conversion pills: HTML (not canvas) so they wrap instead of
    clipping at narrow widths. The sr-only table below is the precise
    screen-reader source; these pills are the glanceable summary. -->
  {#if stats.steps.length > 0}
    <ul class="mt-3 flex flex-wrap gap-1.5" aria-label="Step conversion rates">
      {#each stats.steps as s, i (`${s.name}-${i}`)}
        <li class="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular-nums">
          {formatStepPill(s)}
        </li>
      {/each}
    </ul>
  {/if}
  <table class="sr-only">
    <caption>Conversion funnel by stage</caption>
    <thead>
      <tr>
        <th scope="col">Stage</th>
        <th scope="col">Count</th>
        <th scope="col">Step rate</th>
        <th scope="col">Cumulative</th>
      </tr>
    </thead>
    <tbody>
      {#each stats.steps as s, i (`${s.name}-${i}`)}
        <tr>
          <th scope="row">{s.name}</th>
          <td>{s.value.toLocaleString()}</td>
          <td>{s.stepRate === null ? '100% baseline' : `${formatPct(s.stepRate)} from ${s.prevName}`}</td>
          <td>{formatPct(s.cumulative)} of top</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
