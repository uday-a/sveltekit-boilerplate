<script lang="ts">
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Building2,
    Calendar as CalendarIcon,
    CheckCircle2,
    DollarSign,
    MapPin,
    RotateCcw,
    Sparkles,
    Table2,
    Timer,
    TrendingDown,
    Users,
    Zap,
  } from '@lucide/svelte'
  import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { Button } from '$lib/components/ui/button'
  import { Progress } from '$lib/components/ui/progress'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Label } from '$lib/components/ui/label'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { RangeCalendar, type RangeCalendarRange } from '$lib/components/ui/range-calendar'
  import { Tour, type TourStep } from '$lib/components/blocks/tour'
  import { RawChart } from '$lib/components/ui/raw-chart'
  import { BarChart } from '$lib/components/ui/bar-chart'
  import { FunnelChart } from '$lib/components/ui/funnel-chart'
  import { TreemapChart } from '$lib/components/ui/treemap-chart'
  import { CalendarHeatmap } from '$lib/components/ui/calendar-heatmap'
  import { Sparkline } from '$lib/components/ui/sparkline'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { SectionCard } from '$lib/components/ui/section-card'
  import {
    LeafletCircleMarker,
    LeafletMap,
    LeafletMarker,
    LeafletPopup,
    LeafletTooltip,
    type LeafletMapRef,
  } from '$lib/components/ui/leaflet-map'
  import { MapControls } from '$lib/components/blocks/map-controls'
  import { OfficePopup } from '$lib/components/blocks/office-popup'
  import StatTile from '$lib/components/blocks/stat-tile/StatTile.svelte'
  import { DataList, DataListItem } from '$lib/components/ui/data-list'
  import { IconBox } from '$lib/components/ui/icon-box'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { customerRadius, customerRegions, kindDotBg, kindDotClass, markerSizeClass, officeLocations } from '$lib/locations'
  import { locale, t } from '$lib/i18n'
  import { formatPct } from '$lib/funnel'
  import { useDashboardData, type Range } from '$lib/composables/useDashboardData'

  // Dashboard overview — Svelte port of nuxt
  // `app/pages/dashboard/index.vue` HEAD: 5 KPI StatTiles (no Conversion
  // tile), range tabs + Custom popover + Insights + Take-the-tour, revenue
  // combo, funnel, 48% quota gauge, requests, headcount, severity alerts,
  // live region map, deploy heatmap, top products/customers, activity feed.

  let range = $state<Range>('30d')

  // Re-resolve canvas colours when <html> class flips (dark pivot) — the
  // snapshot reads CSS tokens at call time, so referencing themeKey here
  // re-derives every ECharts option on theme change.
  let themeKey = $state(0)
  const data = $derived.by(() => {
    void themeKey
    return useDashboardData(range)
  })

  // Range totals for the revenue card footer -- balances the funnel card's
  // step-rates footer so the row stays even.
  const revenueTotals = $derived.by(() => {
    const pts = data.revenueSeries
    const revenue = pts.reduce((t, p) => t + p.revenue, 0)
    const expenses = pts.reduce((t, p) => t + p.expenses, 0)
    return { revenue, expenses, net: revenue - expenses }
  })

  const shareColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

  const severityClass = {
    critical: { node: 'bg-destructive/10 text-destructive', badge: 'bg-destructive/10 text-destructive', label: 'Critical' },
    warning: { node: 'bg-warning/10 text-warning', badge: 'bg-warning/10 text-warning', label: 'Warning' },
    info: { node: 'bg-info/10 text-info', badge: 'bg-info/10 text-info', label: 'Info' },
  } as const

  // Region map: offices span SF → Sydney, so fitBounds snaps down to zoom 1
  // on this wide, short card (the world repeats). Zoom 2 shows it once,
  // centred on the band where the offices sit. Whole zoom = no tile seams.
  let regionMap = $state<LeafletMapRef | null>(null)
  const REGION_VIEW = { center: [20, 14] as [number, number], zoom: 2 }
  function fitRegionMap(animate = false) {
    if (animate) regionMap?.flyTo({ ...REGION_VIEW, duration: 600 })
    else regionMap?.setView(REGION_VIEW)
  }

  // Custom range via a RangeCalendar-in-Popover. Picking both endpoints
  // flips the dashboard into the 'custom' range so the same range-aware
  // snapshot (kpi, revenueSeries, funnel, …) responds; picking a preset
  // tab clears the calendar value.
  let customCal = $state<RangeCalendarRange | undefined>(undefined)
  let customOpen = $state(false)

  const customStartEnd = $derived.by(() => {
    const s = customCal?.start
    const e = customCal?.end
    if (!s || !e) return null
    return { start: s.toDate(getLocalTimeZone()), end: e.toDate(getLocalTimeZone()) }
  })

  const customSpan = $derived.by(() => {
    if (!customStartEnd) return null
    // WHY (Rule71): the label carries the year so "Sep 5 – Sep 12" is never
    // ambiguous across year boundaries.
    const df = new DateFormatter($locale ?? 'en', { month: 'short', day: 'numeric', year: 'numeric' })
    const { start, end } = customStartEnd
    return t('dashboard.range.customLabel', { start: df.format(start), end: df.format(end) })
  })

  // Subtitle label: picked dates when a custom range is active,
  // otherwise the preset label from the data snapshot.
  const displayLabel = $derived(
    range === 'custom' && customSpan ? customSpan : data.rangeLabel,
  )

  $effect(() => {
    if (customCal?.start && customCal?.end) {
      range = 'custom'
      customOpen = false
    }
  })

  $effect(() => {
    if (range !== 'custom') customCal = undefined
  })

  function resetRange() {
    customCal = undefined
    range = '30d'
  }

  // First-run tour. Opens once per browser (localStorage flag, read in
  // onMount so SSR never renders it open). Matches Nuxt persistence.
  const TOUR_STORAGE_KEY = 'uipkge-dashboard-tour-dismissed'

  let tourOpen = $state(false)
  let tourStep = $state(0)
  let dontShowAgain = $state(true)

  const tourSteps = $derived.by((): TourStep[] => {
    const nav = {
      prevButtonText: t('dashboard.tour.back'),
      nextButtonText: t('dashboard.tour.next'),
      finishButtonText: t('dashboard.tour.finish'),
    }
    return [
      {
        target: '[data-tour="kpis"]',
        title: t('dashboard.tour.steps.kpis.title'),
        description: t('dashboard.tour.steps.kpis.description'),
        ...nav,
      },
      {
        target: '[data-tour="charts"]',
        title: t('dashboard.tour.steps.charts.title'),
        description: t('dashboard.tour.steps.charts.description'),
        ...nav,
      },
      {
        target: '[data-tour="table-link"]',
        title: t('dashboard.tour.steps.table.title'),
        description: t('dashboard.tour.steps.table.description'),
        ...nav,
      },
      {
        target: '[data-tour="palette"]',
        title: t('dashboard.tour.steps.palette.title'),
        description: t('dashboard.tour.steps.palette.description'),
        ...nav,
      },
      {
        target: '[data-tour="theme"]',
        title: t('dashboard.tour.steps.theme.title'),
        description: t('dashboard.tour.steps.theme.description'),
        ...nav,
      },
      {
        target: '[data-tour="sidebar-nav"]',
        title: t('dashboard.tour.steps.sidebar.title'),
        description: t('dashboard.tour.steps.sidebar.description'),
        ...nav,
      },
      {
        target: '[data-tour="profile"]',
        title: t('dashboard.tour.steps.profile.title'),
        description: t('dashboard.tour.steps.profile.description'),
        ...nav,
      },
      {
        target: '[data-tour="github"]',
        title: t('dashboard.tour.steps.github.title'),
        description: t('dashboard.tour.steps.github.description'),
        action: { label: t('dashboard.tour.steps.github.action'), href: 'https://github.com/uday-a/nuxt-boilerplate' },
        ...nav,
      },
    ]
  })

  function persistTourDismissed() {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, '1')
    } catch {
      // Private mode / blocked storage — tour just shows again next visit.
    }
  }

  // Finish always dismisses for good; skip (X / Escape) only persists
  // when "Don't show again" is checked.
  function onTourFinish() {
    persistTourDismissed()
    tourOpen = false
  }

  function onTourClose() {
    if (dontShowAgain) persistTourDismissed()
    tourOpen = false
  }

  function replayTour() {
    tourStep = 0
    dontShowAgain = true
    tourOpen = true
  }

  onMount(() => {
    try {
      if (!localStorage.getItem(TOUR_STORAGE_KEY)) tourOpen = true
    } catch {
      // Storage unreadable — leave the tour closed rather than nagging.
    }
    if (browser) {
      themeKey++
      const mo = new MutationObserver(() => themeKey++)
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      return () => mo.disconnect()
    }
  })
</script>

<svelte:head>
  <title>Dashboard | UIPKGE</title>
</svelte:head>

<Page class="@container">
  <!-- Header row: title + range tabs + Custom + Insights + tour replay -->
  <PageHeader>
    <PageHeaderHeading title="Dashboard" description="Real-time overview of revenue, traffic, and operations." />
    {#snippet actions()}
      <div class="flex flex-wrap items-center gap-2 sm:justify-end">
        <Tabs value={range} onValueChange={(v) => (range = v as Range)} class="w-auto">
          <TabsList class="h-9 w-auto">
            <TabsTrigger value="24h" class="px-2.5 text-xs">24h</TabsTrigger>
            <TabsTrigger value="7d" class="px-2.5 text-xs">7d</TabsTrigger>
            <TabsTrigger value="30d" class="px-2.5 text-xs">30d</TabsTrigger>
            <TabsTrigger value="qtd" class="px-2.5 text-xs">QTD</TabsTrigger>
            <TabsTrigger value="ytd" class="px-2.5 text-xs">YTD</TabsTrigger>
          </TabsList>
        </Tabs>
        <Popover bind:open={customOpen}>
          <PopoverTrigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant={range === 'custom' ? 'secondary' : 'outline'}
                size="sm"
                class="h-9 gap-1.5"
              >
                <CalendarIcon class="size-4" aria-hidden="true" />{range === 'custom' && customSpan
                  ? customSpan
                  : $t('dashboard.range.custom')}
              </Button>
            {/snippet}
          </PopoverTrigger>
          <PopoverContent align="end" class="w-auto p-0">
            <RangeCalendar bind:value={customCal} />
          </PopoverContent>
        </Popover>
        {#if range === 'custom'}
          <Button variant="ghost" size="sm" class="text-muted-foreground h-9 text-xs" onclick={resetRange}>
            Reset
          </Button>
        {/if}
        <Button variant="outline" size="sm" class="h-9 gap-1.5">
          <Sparkles class="size-4" aria-hidden="true" />Insights
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-muted-foreground size-9"
          title={$t('dashboard.tour.replay')}
          aria-label={$t('dashboard.tour.replay')}
          onclick={replayTour}
        >
          <RotateCcw class="size-4" aria-hidden="true" />
        </Button>
      </div>
    {/snippet}
  </PageHeader>

  <!-- WHY (Rule98): visible freshness stamp. The demo anchor is fixed
       (see useDashboardData asOfLabel) so SSR + client agree. -->
  <p class="text-muted-foreground text-xs">
    {$t('dashboard.asOf', { date: data.asOfLabel })}
  </p>

  <!-- KPI strip: 5 tiles, each with a trend-only Sparkline (Rule59).
       Minis are shape, not scale -- Sparkline is zero-based. -->
  <div data-tour="kpis" class="grid grid-cols-2 gap-3 sm:gap-4 @2xl:grid-cols-3 @5xl:grid-cols-5">
    <StatTile label="MRR" value={`$${data.formatK(data.totalMrr)}`} delta={data.kpi.mrr.delta} icon={DollarSign} definition={$t('dashboard.kpiDefs.mrr')}>
      <Sparkline data={data.kpi.spark.revenue} height={36} class="mt-2" ariaLabel="Monthly recurring revenue trend" />
    </StatTile>

    <StatTile label="Active users" value="12,847" delta={data.kpi.users.delta} icon={Users} definition={$t('dashboard.kpiDefs.users')}>
      <Sparkline
        data={data.kpi.spark.users}
        height={36}
        variant="bars"
        color={data.chartPalette[0]}
        class="mt-2"
        ariaLabel="Active users trend bar chart"
      />
    </StatTile>

    <StatTile label="Requests / min" value="2,484" delta={data.kpi.rpm.delta} icon={Zap} definition={$t('dashboard.kpiDefs.rpm')}>
      <Sparkline
        data={data.kpi.spark.requests}
        height={36}
        variant="line"
        color={data.chartPalette[0]}
        class="mt-2"
        ariaLabel="Requests per minute trend line"
      />
    </StatTile>

    <!-- Avg latency: rising is bad, so delta tone is negative. -->
    <StatTile label="Avg latency" value="412ms" delta={data.kpi.latency.delta} deltaTone="negative" icon={Timer} definition={$t('dashboard.kpiDefs.latency')}>
      <Sparkline
        data={data.kpi.spark.latency}
        height={36}
        variant="dots"
        class="mt-2"
        ariaLabel="Average latency trend line with sampled points"
      />
    </StatTile>

    <!-- Churn: down is good, so delta stays positive even though it's
         a negative number. -->
    <StatTile label="Churn" value="1.8%" delta={data.kpi.churn.delta} icon={TrendingDown} definition={$t('dashboard.kpiDefs.churn')} class="col-span-2 @5xl:col-span-1">
      <div class="space-y-1.5 pt-2">
        <Progress value={98.2} class="h-1.5" />
        <div class="text-muted-foreground flex justify-between text-xs tabular-nums">
          <span>Retained 98.2%</span>
          <span>Target 99%</span>
        </div>
      </div>
    </StatTile>
  </div>

  <!-- Charts row 1: revenue combo (wide) + funnel + quota gauge -->
  <div data-tour="charts" class="grid gap-4 @4xl:grid-cols-3">
    <Card class="flex flex-col">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Revenue vs expenses</CardTitle>
        <CardDescription>{displayLabel} · in USD</CardDescription>
        <CardAction>
          <Badge variant="outline">MRR {data.kpi.mrr.delta}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <RawChart option={data.revenueComboOption} height={300} ariaLabel="Revenue versus expenses chart" />
      </CardContent>
      <CardFooter class="mt-auto">
        <dl class="grid w-full grid-cols-3 gap-2 border-t pt-3 text-center">
          <div>
            <dt class="text-muted-foreground text-xs">Revenue</dt>
            <dd class="text-sm font-medium tabular-nums">${data.formatK(revenueTotals.revenue)}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Expenses</dt>
            <dd class="text-sm font-medium tabular-nums">${data.formatK(revenueTotals.expenses)}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Net</dt>
            <dd class="text-sm font-medium tabular-nums">${data.formatK(revenueTotals.net)}</dd>
          </div>
        </dl>
      </CardFooter>
    </Card>
    <Card class="flex flex-col">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Conversion funnel</CardTitle>
        <CardDescription>{displayLabel} · {formatPct(data.funnelSummary.endToEnd)} end-to-end</CardDescription>
      </CardHeader>
      <CardContent>
        <FunnelChart data={data.funnel} height={300} option={data.funnelOption} />
      </CardContent>
    </Card>
    <Card class="flex flex-col">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Quota</CardTitle>
        <CardDescription>API · monthly</CardDescription>
        <CardAction>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Badge {...props} variant="outline" tabindex={0} class="text-muted-foreground px-1.5">
                    <CalendarIcon aria-hidden="true" />
                    <span class="sr-only">{$t('dashboard.range.staticNote')}</span>
                  </Badge>
                {/snippet}
              </TooltipTrigger>
              <TooltipContent class="text-xs">
                {$t('dashboard.range.staticNote')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardAction>
      </CardHeader>
      <CardContent class="flex flex-1 flex-col gap-4">
        <RawChart option={data.gaugeOption} height={220} ariaLabel="API quota usage gauge" />
        <dl class="grid grid-cols-3 gap-2 border-t pt-4 text-center">
          <div>
            <dt class="text-muted-foreground text-xs">Used</dt>
            <dd class="text-sm font-medium tabular-nums">{data.formatK(data.quotaMeta.used)}<span class="text-muted-foreground block text-xs font-normal">{$t('dashboard.quota.unit')}</span></dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Left</dt>
            <dd class="text-sm font-medium tabular-nums">{data.formatK(data.quotaMeta.remaining)}<span class="text-muted-foreground block text-xs font-normal">{$t('dashboard.quota.unit')}</span></dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Resets</dt>
            <dd class="text-sm font-medium tabular-nums">{data.quotaMeta.renews}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter class="mt-auto">
        <Button variant="ghost" size="sm" class="text-muted-foreground w-full gap-1 text-xs">
          {#snippet child({ props })}
            <a href="/settings/billing" {...props}>
              Need more quota? View plans<ArrowRight class="size-3.5" aria-hidden="true" />
            </a>
          {/snippet}
        </Button>
      </CardFooter>
    </Card>
  </div>

  <!-- Charts row 2: requests + headcount + alerts timeline -->
  <div class="grid gap-4 @4xl:grid-cols-3">
    <!-- Chart cards stretch to the row (the alerts timeline sets its
         height), so the charts fill the card instead of a fixed 200px. -->
    <Card class="flex flex-col">
      <CardHeader>
        <CardTitle class="text-base font-semibold">{data.requestsBlock.title}</CardTitle>
        <CardDescription>{data.requestsBlock.subtitle}</CardDescription>
      </CardHeader>
      <CardContent class="min-h-[200px] flex-1">
        <BarChart
          data={data.requestsBlock.data}
          xField="x"
          yField="y"
          height="100%"
          unit="requests"
          option={data.compactValueAxis}
          ariaLabel="Requests over time chart"
        />
      </CardContent>
    </Card>
    <Card class="flex flex-col">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Headcount by department</CardTitle>
        <CardDescription>
          {data.totalHeadcount.toLocaleString()} people across {data.totalDepartments} departments
        </CardDescription>
        <CardAction>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Badge {...props} variant="outline" tabindex={0} class="text-muted-foreground px-1.5">
                    <CalendarIcon aria-hidden="true" />
                    <span class="sr-only">{$t('dashboard.range.staticNote')}</span>
                  </Badge>
                {/snippet}
              </TooltipTrigger>
              <TooltipContent class="text-xs">
                {$t('dashboard.range.staticNote')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardAction>
      </CardHeader>
      <CardContent class="min-h-[200px] flex-1">
        <TreemapChart data={data.segments} height="100%" ariaLabel="Headcount by department chart" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle class="text-base font-semibold">Active alerts</CardTitle>
        <CardDescription>5 open · 12 resolved today</CardDescription>
      </CardHeader>
      <CardContent class="pb-4">
        <!-- Timeline: one continuous rail, a severity node per alert. -->
        <!-- WHY (Rule81): trivial failed-state branch -- an empty alert
             list renders an EmptyState instead of a blank card. -->
        {#if data.alerts.length}
        <ol>
          {#each data.alerts as a, i (a.title)}
            {@const AlertIcon = a.icon}
            <li class="relative flex gap-3 pb-4 last:pb-0">
              {#if i < data.alerts.length - 1}
                <span class="bg-border absolute top-8 bottom-0 left-4 w-px -translate-x-1/2" aria-hidden="true"></span>
              {/if}
              <span
                class={[
                  'ring-card relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4',
                  severityClass[a.severity].node,
                ]}
              >
                <AlertIcon class="size-4" aria-hidden="true" />
              </span>
              <div class="min-w-0 flex-1 pt-0.5">
                <div class="truncate text-sm font-medium" title={a.title}>{a.title}</div>
                <div class="text-muted-foreground line-clamp-1 text-xs" title={a.detail}>{a.detail}</div>
                <div class="mt-1.5 flex items-center gap-2">
                  <span class={['rounded-sm px-1.5 py-0.5 text-xs font-medium', severityClass[a.severity].badge]}>
                    {severityClass[a.severity].label}
                  </span>
                  <span class="text-muted-foreground min-w-0 truncate text-xs" title={a.source}>{a.source}</span>
                  <span class="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">{a.age}</span>
                </div>
              </div>
            </li>
          {/each}
        </ol>
        {:else}
          <EmptyState
            icon={CheckCircle2}
            title={$t('dashboard.alerts.emptyTitle')}
            description={$t('dashboard.alerts.emptyDescription')}
          />
        {/if}
      </CardContent>
    </Card>
  </div>

  <!-- Customers by region: muted world map embedded in a scrollable page,
       so wheel zoom stays off and the wheel scrolls the page. -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base font-semibold">{$t('dashboard.locations.widgetTitle')}</CardTitle>
      <CardDescription>{$t('dashboard.locations.widgetDescription')}</CardDescription>
      <CardAction>
        <Badge variant="outline" class="tabular-nums">
          <Building2 aria-hidden="true" />
          {$t('dashboard.locations.officeCount', { n: officeLocations.length })}
        </Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <div class="relative isolate">
        <LeafletMap
          bind:this={regionMap}
          variant="muted"
          center={[-20, 20]}
          zoom={2}
          minZoom={1}
          scrollWheelZoom={false}
          navigation={false}
          class="h-[360px] w-full overflow-hidden rounded-lg border"
          oncreated={() => fitRegionMap()}
        >
          {#each customerRegions as c (c.id)}
            <LeafletCircleMarker
              center={c.lngLat}
              radius={customerRadius(c.arr) * 0.8}
              color={data.chartPalette[1]}
              fillColor={data.chartPalette[1]}
              fillOpacity={0.25}
              weight={1.5}
            >
              <LeafletTooltip direction="top">
                <span class="text-xs"><span class="font-medium">{c.city}</span> · {$t('dashboard.locations.accounts', { n: c.accounts })}</span>
              </LeafletTooltip>
            </LeafletCircleMarker>
          {/each}
          {#each officeLocations as office, i (office.id)}
            <LeafletMarker lngLat={office.lngLat} anchor="center">
              <!-- WHY (Rule90): 200ms marker pop-in, and the HQ pulse is
                   gated with motion-safe so reduced-motion gets a static dot. -->
              <span
                class="animate-in fade-in-0 zoom-in-50 fill-mode-both relative flex items-center justify-center duration-200"
                style="animation-delay: {i * 70}ms"
              >
                {#if office.kind === 'hq'}
                  <span
                    class={['absolute inset-0 rounded-full opacity-40 motion-safe:animate-ping', kindDotBg(office.kind)]}
                    aria-hidden="true"
                  ></span>
                {/if}
                <span
                  class={[
                    'outline-background relative block rounded-full ring-4 outline-2 transition-transform duration-200 hover:scale-125',
                    markerSizeClass(office.headcount),
                    kindDotClass(office.kind),
                  ]}
                ></span>
              </span>
              <LeafletPopup offset={[0, -10]} minWidth={240}>
                <OfficePopup {office} />
              </LeafletPopup>
            </LeafletMarker>
          {/each}
        </LeafletMap>
        <MapControls
          onzoomIn={() => regionMap?.zoomIn()}
          onzoomOut={() => regionMap?.zoomOut()}
          onreset={() => {
            regionMap?.getMap()?.closePopup()
            fitRegionMap(true)
          }}
        />
      </div>
    </CardContent>
    <CardFooter class="justify-end">
      <Button variant="ghost" size="sm" class="text-muted-foreground gap-1.5 text-xs">
        {#snippet child({ props })}
          <a href="/dashboard/locations" {...props}>
            <MapPin class="size-3.5" aria-hidden="true" />
            {$t('dashboard.locations.viewAll')}
            <ArrowRight class="size-3.5" aria-hidden="true" />
          </a>
        {/snippet}
      </Button>
    </CardFooter>
  </Card>

  <!-- Deploy activity heatmap (full width, dense) -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base font-semibold">Deploy activity · last 365 days</CardTitle>
      <CardDescription>{data.totalDeploys.toLocaleString()} deploys · longest streak 18 days · {$t('dashboard.heatmap.asOf', { date: data.asOfLabel })}</CardDescription>
      <CardAction>
        <div class="text-muted-foreground flex flex-wrap items-center justify-end gap-2 text-xs">
          <Badge variant="outline">
            {$t('dashboard.range.staticNote')}
          </Badge>
          <span>Less</span>
          <div class="flex gap-0.5">
            <span class="bg-chart-1/10 size-2.5 rounded-sm"></span>
            <span class="bg-chart-1/35 size-2.5 rounded-sm"></span>
            <span class="bg-chart-1/65 size-2.5 rounded-sm"></span>
            <span class="bg-chart-1 size-2.5 rounded-sm"></span>
          </div>
          <span>More</span>
        </div>
      </CardAction>
    </CardHeader>
    <CardContent>
      <CalendarHeatmap
        data={data.calendarData}
        range={data.calendarRange}
        colorRange={data.calendarColorRange}
        option={data.calendarOption}
        height={160}
        ariaLabel="Deploy activity heatmap for the last 365 days"
      />
    </CardContent>
  </Card>

  <!-- Bottom row: top products + top customers + recent activity -->
  <div class="grid gap-4 @4xl:grid-cols-3">
    <Card class="flex flex-col">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Top products by MRR</CardTitle>
        <CardDescription>5 products · ${data.formatK(data.totalMrr)} total</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        {#each data.topProducts as p (p.name)}
          {@const TrendIcon = p.up ? ArrowUpRight : ArrowDownRight}
          <div class="space-y-1">
            <div class="flex items-baseline justify-between gap-3">
              <span class="truncate text-sm" title={p.name}>{p.name}</span>
              <div class="flex items-baseline gap-1.5">
                <span class="text-sm font-semibold tabular-nums">${data.formatK(p.mrr)}</span>
                <span class={['text-xs font-medium tabular-nums', p.up ? 'text-success' : 'text-destructive']}>
                  <TrendIcon class="inline size-3.5" aria-hidden="true" />{p.change}
                </span>
              </div>
            </div>
            <Progress value={(p.mrr / data.totalMrr) * 100} class="h-1.5" />
          </div>
        {/each}
        <!-- Share of MRR: one stacked bar, same order and colours as the list. -->
        <div class="space-y-2 border-t pt-3">
          <div class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Share of MRR</div>
          <div class="flex h-2 overflow-hidden rounded-full">
            {#each data.topProducts as p, i (p.name)}
              <div class={['h-full', shareColors[i % shareColors.length]]} style="width: {(p.mrr / data.totalMrr) * 100}%"></div>
            {/each}
          </div>
          <div class="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {#each data.topProducts as p, i (p.name)}
              <span class="flex items-center gap-1.5">
                <span class={['size-2 rounded-full', shareColors[i % shareColors.length]]}></span>
                {p.name} <span class="tabular-nums">{Math.round((p.mrr / data.totalMrr) * 100)}%</span>
              </span>
            {/each}
          </div>
        </div>
      </CardContent>
      <CardFooter class="mt-auto">
        <Button variant="ghost" size="sm" class="text-muted-foreground w-full gap-1 text-xs">
          {#snippet child({ props })}
            <a href="/settings/billing" {...props}>
              View plans<ArrowRight class="size-3.5" aria-hidden="true" />
            </a>
          {/snippet}
        </Button>
      </CardFooter>
    </Card>

    <Card class="flex flex-col">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Top customers</CardTitle>
        <CardDescription>By MRR · 6 of 142 accounts</CardDescription>
      </CardHeader>
      <CardContent class="divide-y">
        {#each data.topCustomers as c (c.name)}
          <div class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <Avatar class="size-8">
              <AvatarFallback class="bg-muted text-muted-foreground text-xs font-medium">{c.avatar}</AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium" title={c.name}>{c.name}</p>
              <p class="text-muted-foreground text-xs">
                {c.plan} · <span class={['inline-block size-1.5 rounded-full', data.statusTone[c.status]]}></span>
                {c.status}
              </p>
            </div>
            <span class="text-sm font-semibold whitespace-nowrap tabular-nums">${data.formatK(c.mrr)}</span>
          </div>
        {/each}
      </CardContent>
      <CardFooter class="mt-auto">
        <Button variant="ghost" size="sm" class="text-muted-foreground w-full gap-1 text-xs">
          {#snippet child({ props })}
            <a href="/dashboard/data-table" {...props}>
              View all customers<ArrowRight class="size-3.5" aria-hidden="true" />
            </a>
          {/snippet}
        </Button>
      </CardFooter>
    </Card>

    <SectionCard title="Recent activity" description="Live feed across products">
      <DataList>
        {#each data.activities.slice(0, 5) as item (item.title)}
          <DataListItem>
            <div class="flex items-center gap-3">
              <IconBox icon={item.icon} variant="muted" iconClass={item.iconClass} />
              <div>
                <p class="text-sm font-medium">{item.title}</p>
                <p class="text-muted-foreground text-xs">{item.detail}</p>
              </div>
            </div>
            <span class="text-muted-foreground ml-3 text-xs whitespace-nowrap tabular-nums">{item.age}</span>
          </DataListItem>
        {/each}
      </DataList>
      <Button variant="ghost" size="sm" class="text-muted-foreground mt-auto w-full gap-1 text-xs">
        {#snippet child({ props })}
          <a href="/dashboard/activity" {...props}>
            View all activity<ArrowRight class="size-3.5" aria-hidden="true" />
          </a>
        {/snippet}
      </Button>
    </SectionCard>
  </div>

  <!-- Full data-table entry point (also a tour target). -->
  <div data-tour="table-link" class="flex justify-center">
    <Button variant="ghost" size="sm" class="text-muted-foreground gap-1.5 text-xs">
      {#snippet child({ props })}
        <a href="/dashboard/data-table" {...props}>
          <Table2 class="size-3.5" aria-hidden="true" />
          {$t('dashboard.tableLink.label')}
          <ArrowRight class="size-3.5" aria-hidden="true" />
        </a>
      {/snippet}
    </Button>
  </div>
</Page>

{#if browser}
  <Tour
    bind:open={tourOpen}
    bind:current={tourStep}
    steps={tourSteps}
    onfinish={onTourFinish}
    onclose={onTourClose}
  />
  {#if tourOpen}
    <div
      class="bg-popover text-popover-foreground fixed right-4 bottom-4 z-[1002] flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg"
    >
      <Checkbox id="tour-dont-show" bind:checked={dontShowAgain} />
      <Label for="tour-dont-show" class="cursor-pointer text-xs font-normal">
        {$t('dashboard.tour.dontShowAgain')}
      </Label>
    </div>
  {/if}
{/if}
