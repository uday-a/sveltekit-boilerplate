<script lang="ts">
  import { onMount } from 'svelte'
  import { Briefcase, Building2, Clock, Globe2, MapPin, Search, TrendingUp, Users } from '@lucide/svelte'
  import { page } from '$app/state'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Input } from '$lib/components/ui/input'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import {
    LeafletCircleMarker,
    LeafletMap,
    LeafletMarker,
    LeafletPolyline,
    LeafletPopup,
    LeafletTooltip,
    type LeafletMapRef,
  } from '$lib/components/ui/leaflet-map'
  import { chartColors, chartTextColor } from '$lib/components/ui/gauge-chart/useChartTheme.svelte'
  import { MapControls } from '$lib/components/blocks/map-controls'
  import { OfficePopup } from '$lib/components/blocks/office-popup'
  import StatTile from '$lib/components/blocks/stat-tile/StatTile.svelte'
  import { formatNumber } from '$lib/utils'
  import {
    arcPath,
    customerRadius,
    customerRegions,
    kindBadgeVariant,
    kindDotBg,
    kindDotClass,
    markerSizeClass,
    officeBounds,
    officeLocations,
    timeInZone,
    utcOffsetLabel,
    type OfficeKind,
  } from '$lib/locations'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'

  // Office directory + customer footprint on one map. Port of Nuxt `dashboard/locations.vue`.
  const title = $derived(routeLabel(page.url.pathname, $t))

  let search = $state('')
  let kindFilter = $state<'all' | OfficeKind>('all')

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase()
    return officeLocations.filter((office) => {
      if (kindFilter !== 'all' && office.kind !== kindFilter) return false
      if (!q) return true
      return office.city.toLowerCase().includes(q) || office.country.toLowerCase().includes(q)
    })
  })

  const officeCount = $derived(filtered.length)
  const countryCount = $derived(new Set(filtered.map(o => o.country)).size)
  // WHY (Rule69): the stats follow the same FILTERED list as the map + list --
  // a kind/search slice that leaves the totals on "all offices" lies.
  const totalHeadcount = $derived(filtered.reduce((s, o) => s + o.headcount, 0))
  const openRoles = $derived(filtered.reduce((s, o) => s + o.openRoles, 0))
  // Headcount-weighted year-on-year growth across the filtered offices.
  const growth = $derived(totalHeadcount === 0 ? 0 : Math.round(filtered.reduce((s, o) => s + o.growth * o.headcount, 0) / totalHeadcount))
  const hq = officeLocations.find(o => o.kind === 'hq')!
  const kindCounts = $derived({
    hq: filtered.filter(o => o.kind === 'hq').length,
    hub: filtered.filter(o => o.kind === 'hub').length,
    office: filtered.filter(o => o.kind === 'office').length,
  })
  const newestOffice = $derived([...filtered].sort((a, b) => b.opened - a.opened)[0])
  // Distinct current offsets (London and Dublin share one), not zone names.
  const timezoneCount = $derived(new Set(filtered.map(o => (o.timezone ? utcOffsetLabel(o.timezone) : ''))).size)

  // Map layers: offices, customer concentration, or both.
  let layer = $state<'offices' | 'customers' | 'both'>('offices')
  const showOffices = $derived(layer !== 'customers')
  const showCustomers = $derived(layer !== 'offices')

  // Region rollup for the breakdown card.
  const REGION_OF: Record<string, 'americas' | 'emea' | 'apac'> = {
    'United States': 'americas', 'Canada': 'americas', 'Brazil': 'americas',
    'United Kingdom': 'emea', 'Ireland': 'emea', 'Germany': 'emea',
    'India': 'apac', 'Singapore': 'apac', 'Japan': 'apac', 'Australia': 'apac',
  }
  const regions = $derived((['americas', 'emea', 'apac'] as const).map((key, i) => {
    const offices = filtered.filter(o => REGION_OF[o.country] === key)
    const headcount = offices.reduce((s, o) => s + o.headcount, 0)
    return {
      key,
      bar: ['bg-chart-1', 'bg-chart-2', 'bg-chart-3'][i]!,
      offices: offices.length,
      headcount,
      openRoles: offices.reduce((s, o) => s + o.openRoles, 0),
      share: totalHeadcount === 0 ? 0 : Math.round((headcount / totalHeadcount) * 100),
    }
  }))
  const largestRegion = $derived([...regions].sort((a, b) => b.headcount - a.headcount)[0]!)
  // Hiring intensity: open roles relative to current headcount.
  const hiringRegion = $derived([...regions].sort((a, b) => b.openRoles / b.headcount - a.openRoles / a.headcount)[0]!)
  const topCustomers = [...customerRegions].sort((a, b) => b.arr - a.arr).slice(0, 7)
  const maxArr = topCustomers[0]?.arr ?? 1
  const formatArr = (k: number) => (k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${k}k`)

  // Local time per office. Client-only (null during SSR) so hydration matches;
  // ticks once a minute.
  let now = $state<Date | null>(null)
  onMount(() => {
    now = new Date()
    const clock = setInterval(() => (now = new Date()), 60_000)
    return () => clearInterval(clock)
  })
  function localTime(tz?: string): string | null {
    return now && tz ? timeInZone(tz, now) : null
  }

  // Camera control: list clicks fly the map and open the marker's popup.
  let mapRef = $state<LeafletMapRef | null>(null)
  const markerById: Record<string, { openPopup: () => void }> = {}
  let selectedId = $state<string | null>(null)

  // Frame every visible office. fitBounds also snaps to whole zoom levels,
  // which avoids the tile seams fractional zooms leave behind.
  function fitToOffices(animate = true) {
    const bounds = officeBounds(filtered)
    if (bounds) mapRef?.fitBounds(bounds, { padding: [48, 48], maxZoom: 5, animate })
  }
  $effect(() => {
    void filtered
    fitToOffices()
  })

  // Reset: clear the selection, close any popup, re-frame every office.
  function resetView() {
    selectedId = null
    mapRef?.getMap()?.closePopup()
    fitToOffices()
  }

  function selectOffice(id: string) {
    selectedId = id
    const office = officeLocations.find(o => o.id === id)
    if (!office) return
    mapRef?.flyTo({ center: office.lngLat, zoom: Math.max(mapRef?.getMap()?.getZoom() ?? 4, 4), duration: 700 })
    markerById[id]?.openPopup()
  }

  function onMarkerClick(id: string) {
    selectedId = id
    document.getElementById(`location-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description={$t('dashboard.locations.description')} />
  </PageHeader>

  <PageBody class="space-y-4">
    <!-- Stats row -->
    <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatTile
        label={$t('dashboard.locations.stats.offices')}
        value={String(officeCount)}
        caption={$t('dashboard.locations.stats.officesCaption', kindCounts)}
        icon={Building2}
      >
        {#snippet footer()}
          {#if newestOffice}
            {$t('dashboard.locations.stats.newest', { city: newestOffice.city, year: newestOffice.opened })}
          {/if}
        {/snippet}
      </StatTile>
      <StatTile
        label={$t('dashboard.locations.stats.countries')}
        value={String(countryCount)}
        caption={$t('dashboard.locations.stats.countriesCaption', { n: regions.length })}
        icon={Globe2}
      >
        {#snippet footer()}
          {$t('dashboard.locations.stats.timezones', { n: timezoneCount })}
        {/snippet}
      </StatTile>
      <StatTile
        label={$t('dashboard.locations.stats.headcount')}
        value={formatNumber(totalHeadcount)}
        delta={`+${growth}%`}
        caption={$t('dashboard.locations.stats.growthCaption')}
        icon={Users}
      />
      <StatTile
        label={$t('dashboard.locations.stats.openRoles')}
        value={String(openRoles)}
        caption={$t('dashboard.locations.stats.openRolesCaption', { n: filtered.filter(o => o.openRoles > 0).length })}
        icon={Briefcase}
      />
    </div>

    <!-- List + map -->
    <!-- List and map side by side only from xl (1280px) — below that the list
         stacks full width above the map so city names never get cramped. -->
    <div class="grid gap-4 xl:grid-cols-5">
      <!-- Location list -->
      <Card class="xl:col-span-2">
        <CardHeader>
          <div class="flex flex-col gap-2 sm:flex-row">
            <Input
              bind:value={search}
              placeholder={$t('dashboard.locations.search.placeholder')}
              aria-label={$t('dashboard.locations.search.placeholder')}
              prefixIcon={Search}
              allowClear
              class="flex-1"
            />
            <Select value={kindFilter} onValueChange={(v) => (kindFilter = v as typeof kindFilter)}>
              <SelectTrigger class="w-full sm:w-32" aria-label={$t('dashboard.locations.filter.label')}>
                <SelectValue placeholder={$t('dashboard.locations.filter.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{$t('dashboard.locations.filter.all')}</SelectItem>
                <SelectItem value="hq">{$t('dashboard.locations.kind.hq')}</SelectItem>
                <SelectItem value="hub">{$t('dashboard.locations.kind.hub')}</SelectItem>
                <SelectItem value="office">{$t('dashboard.locations.kind.office')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {#if filtered.length}
            <ul class="max-h-[456px] space-y-2 overflow-y-auto pr-1">
              {#each filtered as office (office.id)}
                <li id={`location-${office.id}`}>
                  <button
                    type="button"
                    aria-pressed={selectedId === office.id}
                    class={[
                      'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                      selectedId === office.id
                        ? 'border-primary/40 bg-primary/5 ring-primary ring-1'
                        : 'border-border/70 hover:border-border hover:bg-muted/50',
                    ]}
                    onclick={() => selectOffice(office.id)}
                  >
                    <span class={['block size-2 shrink-0 rounded-full', kindDotBg(office.kind)]}></span>
                    <span class="min-w-0 flex-1">
                      <!-- City names wrap with their badge instead of truncating in the narrow column. -->
                      <span class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span class="text-sm font-medium">{office.city}</span>
                        <Badge variant={kindBadgeVariant(office.kind)}>
                          {$t(`dashboard.locations.kind.${office.kind}`)}
                        </Badge>
                      </span>
                      <!-- Wraps (country, then clock + time as one unit) instead of truncating. -->
                      <span class="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
                        <span>{office.country}</span>
                        {#if localTime(office.timezone)}
                          <span class="inline-flex items-center gap-1.5">
                            <span aria-hidden="true">·</span>
                            <Clock class="size-3.5 shrink-0" aria-hidden="true" />
                            <span class="tabular-nums">{localTime(office.timezone)}</span>
                          </span>
                        {/if}
                      </span>
                    </span>
                    <span class="shrink-0 text-right">
                      <span class="block text-sm font-semibold tabular-nums">{formatNumber(office.headcount)}</span>
                      <span class="text-muted-foreground block text-xs tabular-nums">
                        <!-- WHY (Rules 37/40): growth pairs color with a shape
                             so direction never rides on green alone. -->
                        <span class="text-success inline-flex items-center gap-0.5">
                          <TrendingUp class="size-3" aria-hidden="true" />+{office.growth}%
                        </span>
                        · {$t('dashboard.locations.openRolesShort', { n: office.openRoles })}
                      </span>
                    </span>
                  </button>
                </li>
              {/each}
            </ul>
          {:else}
            <EmptyState
              icon={MapPin}
              title={$t('dashboard.locations.empty.title')}
              description={$t('dashboard.locations.empty.description')}
            />
          {/if}
        </CardContent>
      </Card>

      <!-- Large map: fills its card (no inner frame). LeafletMap loads
           Leaflet client-side only, so SSR renders just the shell. -->
      <Card class="relative isolate overflow-hidden p-0 xl:col-span-3">
        <LeafletMap
          bind:this={mapRef}
          variant="muted"
          center={[-20, 20]}
          zoom={2}
          minZoom={1}
          scrollWheelZoom={true}
          navigation={false}
          class="h-[560px] w-full"
          oncreated={() => fitToOffices(false)}
        >
          <!-- HQ links: thin dashed lines to every office -->
          {#if showOffices}
            {#each filtered.filter(o => o.kind !== 'hq') as office (office.id)}
              <LeafletPolyline
                lngLatPath={arcPath(hq.lngLat, office.lngLat)}
                color={chartTextColor()}
                weight={1}
                opacity={selectedId === office.id ? 0.9 : 0.35}
                dashArray="3 5"
              />
            {/each}
          {/if}
          <!-- Customer concentration: circle area tracks ARR -->
          {#if showCustomers}
            {#each customerRegions as c (c.id)}
              <LeafletCircleMarker
                center={c.lngLat}
                radius={customerRadius(c.arr)}
                color={chartColors()[1]}
                fillColor={chartColors()[1]}
                fillOpacity={0.25}
                weight={1.5}
              >
                <LeafletTooltip direction="top">
                  <span class="text-xs"><span class="font-medium">{c.city}</span> · {$t('dashboard.locations.accounts', { n: c.accounts })} · {formatArr(c.arr)} ARR</span>
                </LeafletTooltip>
              </LeafletCircleMarker>
            {/each}
          {/if}
          {#each showOffices ? filtered : [] as office, i (office.id)}
            <LeafletMarker
              lngLat={office.lngLat}
              anchor="center"
              zIndexOffset={selectedId === office.id ? 1000 : 0}
              opacity={selectedId && selectedId !== office.id ? 0.55 : 1}
              onclick={() => onMarkerClick(office.id)}
              onready={marker => (markerById[office.id] = marker)}
            >
              {#snippet icon()}
                <!-- Staggered pop-in on load; HQ and the selected office pulse.
                     WHY (Rule90/96): 200ms pop-in, and the pulse is gated with
                     motion-safe so reduced-motion gets a static marker. -->
                <span
                  class="animate-in fade-in-0 zoom-in-50 fill-mode-both relative flex items-center justify-center duration-200"
                  style:animation-delay={`${i * 70}ms`}
                >
                  {#if office.kind === 'hq' || selectedId === office.id}
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
                      selectedId === office.id && 'scale-125',
                    ]}
                  ></span>
                </span>
              {/snippet}
              <LeafletTooltip direction="top" offset={[0, -10]}>
                <span class="text-xs font-medium">{office.city}</span>
              </LeafletTooltip>
              <LeafletPopup offset={[0, -10]} minWidth={240}>
                <OfficePopup {office} localTime={localTime(office.timezone)} />
              </LeafletPopup>
            </LeafletMarker>
          {/each}
        </LeafletMap>
        <MapControls
          onzoomIn={() => mapRef?.zoomIn()}
          onzoomOut={() => mapRef?.zoomOut()}
          onreset={resetView}
        />
        <!-- WHY (Rule93): the canvas map is invisible to screen readers --
             this sr-only list carries the same office data as text. -->
        <ul class="sr-only">
          {#each officeLocations as office (office.id)}
            <li>{office.city}, {office.country} — {formatNumber(office.headcount)} people</li>
          {/each}
        </ul>
        <!-- Layer switch -->
        <div class="absolute top-3 left-3 z-[800]">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            class="bg-card/90 backdrop-blur-sm"
            value={layer}
            onValueChange={(v) => { if (v) layer = v as typeof layer }}
            aria-label={$t('dashboard.locations.layers.label')}
          >
            {#each ['offices', 'customers', 'both'] as const as l (l)}
              <ToggleGroupItem value={l} class="px-2.5 text-xs">{$t(`dashboard.locations.layers.${l}`)}</ToggleGroupItem>
            {/each}
          </ToggleGroup>
        </div>
        <!-- Legend: kind color + "size = headcount" -->
        <div
          class="bg-card/90 text-muted-foreground pointer-events-none absolute bottom-3 left-3 z-[800] flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-2.5 py-1.5 text-xs backdrop-blur-sm max-sm:right-14"
        >
          {#each ['hq', 'hub', 'office'] as const as kind (kind)}
            <span class="flex items-center gap-1.5">
              <span class={['size-2 rounded-full', kindDotBg(kind)]}></span>
              {$t(`dashboard.locations.kind.${kind}`)}
            </span>
          {/each}
          <span class="sm:border-l sm:pl-3">{$t('dashboard.locations.sizeLegend')}</span>
          {#if showCustomers}
            <span class="flex items-center gap-1.5 sm:border-l sm:pl-3">
              <span class="border-chart-2 bg-chart-2/25 size-2.5 rounded-full border"></span>
              {$t('dashboard.locations.layers.customers')}
            </span>
          {/if}
        </div>
      </Card>
    </div>

    <!-- Breakdown: people by region, customers by city -->
    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{$t('dashboard.locations.regions.title')}</CardTitle>
          <CardDescription>{$t('dashboard.locations.regions.description')}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          {#each regions as r (r.key)}
            <div class="space-y-1.5">
              <div class="flex items-baseline justify-between gap-3 text-sm">
                <span class="font-medium">{$t(`dashboard.locations.regions.${r.key}`)}</span>
                <span class="text-muted-foreground text-xs tabular-nums">
                  {$t('dashboard.locations.regions.meta', { offices: r.offices, roles: r.openRoles })}
                  · <span class="text-foreground font-medium">{r.headcount}</span> ({r.share}%)
                </span>
              </div>
              <div class="bg-muted h-2 overflow-hidden rounded-full">
                <div class={['h-full rounded-full', r.bar]} style:width={`${r.share}%`}></div>
              </div>
            </div>
          {/each}
          <div class="text-muted-foreground grid grid-cols-2 gap-3 border-t pt-3 text-xs">
            <div>
              <div>{$t('dashboard.locations.regions.largest')}</div>
              <div class="text-foreground text-sm font-medium">
                {$t(`dashboard.locations.regions.${largestRegion.key}`)} · {largestRegion.share}%
              </div>
            </div>
            <div>
              <div>{$t('dashboard.locations.regions.hiring')}</div>
              <div class="text-foreground text-sm font-medium">
                {$t(`dashboard.locations.regions.${hiringRegion.key}`)} · {$t('dashboard.locations.openRolesShort', { n: hiringRegion.openRoles })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{$t('dashboard.locations.customers.title')}</CardTitle>
          <CardDescription>{$t('dashboard.locations.customers.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2.5">
            {#each topCustomers as c (c.id)}
              <li class="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
                <!-- Long city names wrap within their column instead of truncating. -->
                <span class="min-w-0 font-medium break-words">{c.city}</span>
                <span class="bg-muted h-1.5 overflow-hidden rounded-full">
                  <span class="bg-chart-2 block h-full rounded-full" style:width={`${Math.round((c.arr / maxArr) * 100)}%`}></span>
                </span>
                <span class="text-muted-foreground text-xs tabular-nums">
                  <span class="text-foreground font-medium">{formatArr(c.arr)}</span> · {$t('dashboard.locations.accounts', { n: c.accounts })}
                </span>
              </li>
            {/each}
          </ul>
        </CardContent>
      </Card>
    </div>
  </PageBody>
</Page>
