<script lang="ts">
  import {
    ChevronLeft,
    ChevronRight,
    Flame,
    TrendingUp,
    MousePointer2,
    Activity as ActivityIcon,
    Calendar as CalendarIcon,
    X,
    Sparkles,
    BarChart3,
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import StatTile from '$lib/components/blocks/stat-tile/StatTile.svelte'
  import { useMonthGrid, isoDate, dateFromKey } from '$lib/composables/useMonthGrid.svelte'
  import { SvelteDate } from 'svelte/reactivity'

  // Port of nuxt `app/pages/dashboard/activity.vue` — same month-grid hook
  // as /dashboard/calendar, different visual treatment (heatmap).

  const grid = useMonthGrid()

  // Deterministic mock activity ("sessions per day"). Weekdays trend higher;
  // hashed noise gives variance without persisted data.
  function djb2(s: string): number {
    let h = 5381
    for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i)
    return Math.abs(h)
  }
  function activityFor(key: string): number {
    const d = dateFromKey(key)
    // Future dates are unknown — return 0.
    if (key > grid.todayKey) return 0
    const dow = d.getDay()
    const base = dow === 0 || dow === 6 ? 5 : 20
    const noise = (djb2(key) % 14) - 6
    return Math.max(0, base + noise)
  }

  // 5-level intensity → chart-2 tints
  function intensityClass(n: number): string {
    if (n === 0) return 'bg-muted/40'
    if (n < 5) return 'bg-chart-2/15'
    if (n < 12) return 'bg-chart-2/35'
    if (n < 20) return 'bg-chart-2/60'
    return 'bg-chart-2/85'
  }

  const monthCells = $derived(grid.gridDays.map((d) => ({ ...d, count: activityFor(d.key) })))

  const monthStats = $derived.by(() => {
    const inMonth = monthCells.filter((c) => c.inMonth)
    const total = inMonth.reduce((acc, c) => acc + c.count, 0)
    const nonZero = inMonth.filter((c) => c.count > 0)
    const peak = inMonth.reduce<{ key: string, count: number } | null>(
      (best, c) => (best === null || c.count > best.count ? { key: c.key, count: c.count } : best),
      null,
    )
    const avg = nonZero.length ? Math.round(total / nonZero.length) : 0

    // Streak: walk back from today counting consecutive days with activity > 0
    let streak = 0
    const cursorDate = dateFromKey(grid.todayKey)
    for (let i = 0; i < 365; i++) {
      const d = new SvelteDate(cursorDate)
      d.setDate(cursorDate.getDate() - i)
      if (activityFor(isoDate(d)) > 0) streak++
      else break
    }
    return { total, avg, peak, streak }
  })

  const rangeStats = $derived.by(() => {
    const { lo } = grid.rangeBounds
    const cells: { key: string, count: number }[] = []
    const start = dateFromKey(lo)
    const days = grid.rangeDayCount
    for (let i = 0; i < days; i++) {
      const d = new SvelteDate(start)
      d.setDate(start.getDate() + i)
      const key = isoDate(d)
      cells.push({ key, count: activityFor(key) })
    }
    const total = cells.reduce((a, c) => a + c.count, 0)
    const active = cells.filter((c) => c.count > 0).length
    const avg = days > 0 ? Math.round(total / days) : 0
    return { total, avg, active, cells }
  })

  function fmtKey(key: string) {
    return dateFromKey(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
</script>

<svelte:head>
  <title>Activity | UIPKGE</title>
</svelte:head>

<!-- useMonthGrid registers window mouseup listeners itself, so no
     container-level mouseup catcher is needed here. -->
<Page>
  <PageHeader>
    <PageHeaderHeading title="Activity" description="Daily session heatmap. Drag or shift-click to summarize a range." />
  </PageHeader>

  <!-- KPI strip -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatTile label="Total · this month" value={monthStats.total.toLocaleString()} caption="sessions" icon={ActivityIcon} />
    <StatTile label="Avg · active day" value={String(monthStats.avg)} caption="sessions/day" icon={BarChart3} />
    <StatTile
      label="Peak day"
      value={String(monthStats.peak?.count ?? 0)}
      caption={monthStats.peak ? fmtKey(monthStats.peak.key) : '—'}
      icon={TrendingUp}
    />
    <StatTile
      label="Current streak"
      value={String(monthStats.streak)}
      caption={`day${monthStats.streak === 1 ? '' : 's'} in a row`}
      icon={Flame}
    />
  </div>

  <!-- Heatmap card -->
  <div class="overflow-hidden rounded-xl border bg-card/40">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
      <div class="flex items-center gap-2">
        <Button variant="outline" size="icon" class="size-8" aria-label="Previous month" onclick={() => grid.prevMonth()}>
          <ChevronLeft class="size-4" />
        </Button>
        <Button variant="outline" size="icon" class="size-8" aria-label="Next month" onclick={() => grid.nextMonth()}>
          <ChevronRight class="size-4" />
        </Button>
        <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={() => grid.goToToday()}>Today</Button>
        <h2 class="ml-2 text-sm font-semibold">{grid.monthLabel}</h2>
      </div>
      <div class="text-muted-foreground flex items-center gap-3 text-xs">
        {#if grid.isRange}
          <div class="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-primary ring-1 ring-inset ring-primary/20">
            <MousePointer2 class="size-3" />
            <span class="tabular-nums">{grid.rangeDayCount} days · {rangeStats.total.toLocaleString()} sessions · avg {rangeStats.avg}</span>
            <button class="ml-0.5 hover:text-foreground" onclick={() => grid.clearRange()}>
              <X class="size-3" />
            </button>
          </div>
        {/if}
        <div class="flex items-center gap-1.5">
          <Sparkles class="size-3" />
          <span>{monthStats.total.toLocaleString()} this month</span>
        </div>
      </div>
    </div>

    <!-- Weekday header -->
    <div class="text-muted-foreground grid grid-cols-7 border-b bg-muted/10 text-xs tracking-wider uppercase">
      {#each grid.weekdays as w (w)}
        <div class="px-2 py-2 font-medium">{w}</div>
      {/each}
    </div>

    <!-- Heatmap grid -->
    <div class="grid grid-cols-7 select-none">
      {#each monthCells as d, i (d.key)}
        <button
          type="button"
          class={`group relative isolate flex h-20 items-start justify-between border-r border-b p-1.5 text-left transition-all focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${(i + 1) % 7 === 0 ? 'border-r-0' : ''} ${i >= 35 ? 'border-b-0' : ''} ${!d.inMonth ? 'opacity-40' : ''} ${grid.inRange(d.key) ? 'z-10 ring-1 ring-inset ring-primary' : ''}`}
          title={`${fmtKey(d.key)} — ${d.count} session${d.count === 1 ? '' : 's'}`}
          onmousedown={(e) => grid.onCellMouseDown(d.key, e)}
          onmouseenter={() => grid.onCellMouseEnter(d.key)}
        >
          <!-- Intensity fill -->
          <div class={`pointer-events-none absolute inset-1 rounded-md transition-all group-hover:inset-0.5 group-hover:brightness-125 ${intensityClass(d.count)}`}></div>
          <!-- Date number -->
          <span
            class={`relative z-10 inline-flex size-5 items-center justify-center rounded-full text-xs tabular-nums ${d.key === grid.todayKey ? 'bg-foreground text-background font-semibold ring-2 ring-ring' : ''} ${d.key !== grid.todayKey && d.inMonth ? 'text-foreground' : ''} ${!d.inMonth ? 'text-muted-foreground' : ''}`}
          >
            {d.date.getDate()}
          </span>
          {#if d.count > 0 && d.inMonth}
            <!-- WHY (Rule95): focus-within joins hover so keyboard/touch
                 users get the count too -- hover alone hides it from them. -->
            <span class="relative z-10 text-xs text-muted-foreground tabular-nums opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {d.count}
            </span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Legend -->
    <div class="text-muted-foreground flex flex-wrap items-center gap-3 border-t bg-muted/20 px-4 py-2 text-xs">
      <CalendarIcon class="size-3" />
      <span>Less</span>
      <span class="h-2.5 w-4 rounded-sm bg-muted/40"></span>
      <span class="h-2.5 w-4 rounded-sm bg-chart-2/15"></span>
      <span class="h-2.5 w-4 rounded-sm bg-chart-2/35"></span>
      <span class="h-2.5 w-4 rounded-sm bg-chart-2/60"></span>
      <span class="h-2.5 w-4 rounded-sm bg-chart-2/85"></span>
      <span>More</span>
      <span class="ml-auto">Tip: drag or shift-click to summarize a range.</span>
    </div>
  </div>

  <!-- Range detail (only when range > 1) -->
  {#if grid.isRange}
    <div class="bg-muted/30 rounded-xl border p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Selected range</p>
          <p class="mt-1 text-base font-semibold">{fmtKey(grid.rangeBounds.lo)} → {fmtKey(grid.rangeBounds.hi)}</p>
        </div>
        <div class="grid grid-cols-3 gap-3 text-right">
          <div>
            <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Days</p>
            <!-- WHY (Rule27): KPI values sit on text-2xl so the range
                 summary matches the tile hierarchy. -->
            <p class="text-2xl font-semibold tabular-nums">{grid.rangeDayCount}</p>
          </div>
          <div>
            <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Active</p>
            <p class="text-2xl font-semibold tabular-nums">{rangeStats.active}</p>
          </div>
          <div>
            <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Total</p>
            <p class="text-2xl font-semibold tabular-nums">{rangeStats.total.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <!-- Mini per-day bars across range -->
      <div class="mt-4 flex h-12 items-end gap-0.5">
        {#each rangeStats.cells as c (c.key)}
          <div
            class={`flex-1 rounded-sm transition-colors ${c.count === 0 ? 'bg-muted/30' : 'bg-chart-2/70'}`}
            style={`height: ${c.count === 0 ? '8%' : `${Math.min(100, 12 + c.count * 4)}%`}`}
            title={`${fmtKey(c.key)}: ${c.count} sessions`}
          ></div>
        {/each}
      </div>
    </div>
  {/if}
</Page>
