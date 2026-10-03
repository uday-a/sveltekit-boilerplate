<script lang="ts">
  import { onMount } from 'svelte'
  import { Briefcase, Building2, Clock, Globe2, MapPin, Search, TrendingUp } from '@lucide/svelte'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Input } from '$lib/components/ui/input'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { formatNumber } from '$lib/utils'
  import StatTile from '$lib/components/blocks/stat-tile/StatTile.svelte'
  import DemoDataBanner from '$lib/components/blocks/demo-data-banner/DemoDataBanner.svelte'
  import {
    customerRegions,
    kindBadgeVariant,
    kindDotBg,
    officeLocations,
    timeInZone,
    utcOffsetLabel,
    type OfficeKind,
  } from '$lib/locations'
  import { t } from '$lib/i18n'

  // Office directory + customer footprint. Port of Nuxt `dashboard/locations.vue`.
  // TODO: swap the static grid for the LeafletMap wrapper (curved HQ arcs,
  // zoom/reset controls, office popups) once a Svelte map layer lands —
  // the shared `lib/locations` dataset already carries lngLat/bounds/arcs.
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
  // WHY (Rule69): the stats follow the same FILTERED list as the list --
  // a kind/search slice that leaves the totals on "all offices" lies.
  const totalHeadcount = $derived(filtered.reduce((s, o) => s + o.headcount, 0))
  const openRoles = $derived(filtered.reduce((s, o) => s + o.openRoles, 0))
  // Distinct current offsets (London and Dublin share one), not zone names.
  const timezoneCount = $derived(new Set(filtered.map(o => (o.timezone ? utcOffsetLabel(o.timezone) : ''))).size)
  // Headcount-weighted year-on-year growth across the filtered offices.
  const growth = $derived(totalHeadcount === 0 ? 0 : Math.round(filtered.reduce((s, o) => s + o.growth * o.headcount, 0) / totalHeadcount))
  const kindCounts = $derived({
    hq: filtered.filter(o => o.kind === 'hq').length,
    hub: filtered.filter(o => o.kind === 'hub').length,
    office: filtered.filter(o => o.kind === 'office').length,
  })
  const newestOffice = $derived([...filtered].sort((a, b) => b.opened - a.opened)[0])

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
</script>

<svelte:head>
  <title>{$t('dashboard.locations.title')} · Dashboard | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading title={$t('dashboard.locations.title')} description={$t('dashboard.locations.description')} />
  </PageHeader>

  <DemoDataBanner message={$t('common.sampleData')} />

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      icon={Building2}
    />
    <StatTile
      label={$t('dashboard.locations.stats.openRoles')}
      value={String(openRoles)}
      caption={$t('dashboard.locations.stats.openRolesCaption', { n: filtered.filter(o => o.openRoles > 0).length })}
      icon={Briefcase}
    />
  </div>

  <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
    <div class="relative min-w-0 flex-1">
      <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden="true" />
      <Input
        bind:value={search}
        type="search"
        placeholder={$t('dashboard.locations.search.placeholder')}
        aria-label={$t('dashboard.locations.search.placeholder')}
        class="pl-8"
      />
    </div>
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={kindFilter}
      onValueChange={(v) => { if (v) kindFilter = v as 'all' | OfficeKind }}
      aria-label={$t('dashboard.locations.filter.label')}
    >
      <ToggleGroupItem value="all" class="px-3 text-xs">{$t('dashboard.locations.filter.all')}</ToggleGroupItem>
      <ToggleGroupItem value="hq" class="px-3 text-xs">{$t('dashboard.locations.kind.hq')}</ToggleGroupItem>
      <ToggleGroupItem value="hub" class="px-3 text-xs">{$t('dashboard.locations.kind.hub')}</ToggleGroupItem>
      <ToggleGroupItem value="office" class="px-3 text-xs">{$t('dashboard.locations.kind.office')}</ToggleGroupItem>
    </ToggleGroup>
    <p class="text-muted-foreground text-xs tabular-nums" aria-live="polite">
      {$t('admin.filters.showing', { shown: filtered.length, total: officeLocations.length })}
    </p>
  </div>

  {#if filtered.length === 0}
    <Card>
      <EmptyState
        icon={MapPin}
        title={$t('dashboard.locations.empty.title')}
        description={$t('dashboard.locations.empty.description')}
        class="p-4"
      />
    </Card>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {#each filtered as office (office.id)}
        <Card>
          <CardHeader class="p-4 pb-0">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class={['size-2 shrink-0 rounded-full', kindDotBg(office.kind)]} aria-hidden="true"></span>
                  <CardTitle class="truncate text-base" title={office.city}>{office.city}</CardTitle>
                </div>
                <CardDescription>
                  {office.country}
                  {#if office.timezone && localTime(office.timezone)}
                    <span class="tabular-nums">
                      {`· ${localTime(office.timezone)} (${utcOffsetLabel(office.timezone)})`}
                    </span>
                  {/if}
                </CardDescription>
              </div>
              <Badge variant={kindBadgeVariant(office.kind)} class="shrink-0">
                {$t(`dashboard.locations.kind.${office.kind}`)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent class="flex items-center justify-between gap-3 p-4">
            <div class="text-sm">
              <span class="font-semibold tabular-nums">{formatNumber(office.headcount)}</span>
              <span class="text-muted-foreground text-xs">
                · <!-- WHY (Rules 37/40): growth pairs color with a shape
                     so direction never rides on green alone. -->
                <span class="text-success inline-flex items-center gap-0.5">
                  <TrendingUp class="size-3" aria-hidden="true" />+{office.growth}%
                </span>
                {`· ${$t('dashboard.locations.openRolesShort', { n: office.openRoles })}`}
              </span>
            </div>
            <div class="text-muted-foreground flex items-center gap-1 text-xs">
              <Clock class="size-3.5" aria-hidden="true" />
              <span>{office.lead}</span>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}

  <!-- Map placeholder: the interactive Leaflet layer (curved HQ arcs,
       zoom/reset controls, office popups) ships once a Svelte map wrapper
       lands. The dataset above already carries everything it needs. -->
  <Card>
    <EmptyState
      icon={MapPin}
      title={$t('dashboard.locations.mapTitle')}
      description={$t('dashboard.locations.mapTodo')}
      class="p-4"
    />
  </Card>

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
              <div class={['h-full rounded-full', r.bar]} style={`width: ${r.share}%`}></div>
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
              <span class="truncate font-medium" title={c.city}>{c.city}</span>
              <span class="bg-muted h-1.5 overflow-hidden rounded-full">
                <span
                  class="bg-chart-2 block h-full rounded-full"
                  style={`width: ${Math.round((c.arr / maxArr) * 100)}%`}
                ></span>
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
</Page>
