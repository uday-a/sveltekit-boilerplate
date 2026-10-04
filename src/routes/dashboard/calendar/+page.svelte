<script lang="ts">
  import type { Component } from 'svelte'
  import { SvelteMap } from 'svelte/reactivity'
  import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    MapPin,
    Users,
    Video,
    CheckCircle2,
    AlertCircle,
    Search,
    CalendarDays,
    Plane,
    ListFilter,
    Sparkles,
    Copy,
    X,
    CalendarPlus,
    ArrowRight,
    MousePointer2,
    Pencil,
    Trash2,
    Eye,
    CopyPlus,
  } from '@lucide/svelte'
  import { page } from '$app/state'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '$lib/components/ui/dialog'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Page, PageHeader, PageHeaderHeading, PageBody } from '$lib/components/ui/page'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Separator } from '$lib/components/ui/separator'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { Input } from '$lib/components/ui/input'
  import { OverlayScroll } from '$lib/components/ui/overlay-scroll'
  import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
    ContextMenuLabel,
  } from '$lib/components/ui/context-menu'
  import StatTile from '$lib/components/blocks/stat-tile/StatTile.svelte'
  import { useMonthGrid, dateFromKey, isoDate } from '$lib/composables/useMonthGrid.svelte'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'

  // Port of nuxt `app/pages/dashboard/calendar.vue`. The month-grid state
  // lives on the `grid` object (getters stay reactive only via `grid.*`
  // reads — destructuring would snapshot them).
  const title = $derived(routeLabel(page.url.pathname, $t))

  interface CalendarEvent {
    id: string
    title: string
    date: string
    start: string
    end: string
    type: 'meeting' | 'task' | 'reminder' | 'travel'
    description: string
    location?: string
    attendees?: string[]
    status: 'confirmed' | 'tentative' | 'cancelled'
  }

  let view = $state<'month' | 'week' | 'day'>('month')
  let eventOpen = $state(false)
  let selectedEvent = $state<CalendarEvent | null>(null)
  let search = $state('')

  // Headless month-grid + range-select state and handlers. Opens on today.
  const grid = useMonthGrid()

  // Date key `n` days from today, so the sample schedule always sits
  // around the current date.
  function daysFromToday(n: number): string {
    const t0 = grid.today
    return isoDate(new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + n))
  }

  // Calendar is a demo page; the seed data lives inline rather than
  // behind a public mock API route. When you wire a real events table,
  // swap to `apiFetch<ApiResponse<CalendarEvent[]>>('/api/events')`.
  // The `loading` state keeps the skeleton flow identical to the
  // eventual async version.
  let events = $state<CalendarEvent[]>([
    { id: '1', title: 'Q4 roadmap review', date: daysFromToday(0), start: '10:00', end: '11:30', type: 'meeting', description: 'Review the platform backlog and agree the Q4 priorities.', location: 'Conference Room A', attendees: ['Sarah Connor', 'Marcus Rivera', 'Alice Chen'], status: 'confirmed' },
    { id: '2', title: 'Customer call: Northwind', date: daysFromToday(0), start: '14:00', end: '14:45', type: 'meeting', description: 'Contract renewal discussion. Prepare usage report.', location: 'Zoom', attendees: ['Marcus Rivera'], status: 'confirmed' },
    { id: '3', title: 'Deploy window', date: daysFromToday(0), start: '16:00', end: '17:00', type: 'task', description: 'Production deploy for dashboard v2.1. Zero-downtime expected.', status: 'confirmed' },
    { id: '4', title: 'Team standup', date: daysFromToday(-1), start: '09:30', end: '10:00', type: 'meeting', description: 'Daily sync. Blockers and wins.', location: 'Slack huddle', attendees: ['Platform team'], status: 'confirmed' },
    { id: '5', title: 'UX critique', date: daysFromToday(1), start: '11:00', end: '12:00', type: 'meeting', description: 'Review new onboarding flow mockups.', location: 'Figma', attendees: ['Alice Chen', 'David Kim'], status: 'tentative' },
    { id: '6', title: 'Berlin trip: Marcus', date: daysFromToday(2), start: '08:00', end: '20:00', type: 'travel', description: 'Customer onsite at Sentinel Labs.', location: 'Berlin', status: 'confirmed' },
    { id: '7', title: 'Renew SSL certificates', date: daysFromToday(3), start: '17:00', end: '17:00', type: 'reminder', description: 'Certificates for api.example.com expire next week.', status: 'confirmed' },
    { id: '8', title: 'Vue Conf', date: daysFromToday(9), start: '09:00', end: '18:00', type: 'travel', description: 'Alice attending. Prepare talk slides.', location: 'San Francisco', attendees: ['Alice Chen'], status: 'confirmed' },
    { id: '9', title: 'Invoice run', date: daysFromToday(-3), start: '12:00', end: '13:00', type: 'task', description: 'Send monthly invoices and reconcile failed payments.', status: 'confirmed' },
    { id: '10', title: 'Security review', date: daysFromToday(-6), start: '15:00', end: '16:00', type: 'meeting', description: 'Quarterly access and API key audit.', location: 'Zoom', attendees: ['Sarah Connor', 'David Kim'], status: 'confirmed' },
    { id: '11', title: 'Pricing page copy due', date: daysFromToday(-8), start: '17:00', end: '17:00', type: 'reminder', description: 'Final copy for the new Team plan.', status: 'confirmed' },
  ])
  let loading = $state(false)

  // Event types map to the categorical chart ramp (chart-1..4) everywhere
  // on the page: stat dot, cell chip, side-rail bar and type pill.
  const typeMeta: Record<CalendarEvent['type'], {
    label: string
    icon: Component
    dot: string
    pill: string
    chip: string
    iconBox: string
  }> = {
    meeting: { label: 'Meeting', icon: Video, dot: 'bg-chart-1', pill: 'bg-chart-1/15 text-foreground', chip: 'bg-chart-1/15 text-foreground border-chart-1', iconBox: 'bg-chart-1/15 text-chart-1' },
    task: { label: 'Task', icon: CheckCircle2, dot: 'bg-chart-2', pill: 'bg-chart-2/15 text-foreground', chip: 'bg-chart-2/15 text-foreground border-chart-2', iconBox: 'bg-chart-2/15 text-chart-2' },
    reminder: { label: 'Reminder', icon: AlertCircle, dot: 'bg-chart-3', pill: 'bg-chart-3/15 text-foreground', chip: 'bg-chart-3/15 text-foreground border-chart-3', iconBox: 'bg-chart-3/15 text-chart-3' },
    travel: { label: 'Travel', icon: Plane, dot: 'bg-chart-4', pill: 'bg-chart-4/15 text-foreground', chip: 'bg-chart-4/15 text-foreground border-chart-4', iconBox: 'bg-chart-4/15 text-chart-4' },
  }
  type TypeKey = CalendarEvent['type']
  const typeKeys = Object.keys(typeMeta) as TypeKey[]

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase()
    if (!q) return events
    return events.filter((e) =>
      e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q),
    )
  })

  const eventsByDate = $derived.by(() => {
    const map = new SvelteMap<string, CalendarEvent[]>()
    for (const e of filtered) {
      if (!map.has(e.date)) map.set(e.date, [])
      map.get(e.date)!.push(e)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start.localeCompare(b.start))
    return map
  })

  const monthCounts = $derived.by(() => {
    const y = grid.cursor.getFullYear()
    const m = grid.cursor.getMonth()
    const init = { meeting: 0, task: 0, travel: 0, reminder: 0, total: 0 }
    for (const e of events) {
      const d = dateFromKey(e.date)
      if (d.getFullYear() === y && d.getMonth() === m) {
        init[e.type]++
        init.total++
      }
    }
    return init
  })

  // Next upcoming event per type (from today onward, not just this month).
  const nextByType = $derived.by(() => {
    const out = {} as Record<TypeKey, CalendarEvent | null>
    for (const type of typeKeys) {
      const sorted = events
        .filter((e) => e.type === type && e.date >= grid.todayKey)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      out[type] = sorted[0] ?? null
    }
    return out
  })

  function fmtNextDate(key: string) {
    if (key === grid.todayKey) return 'Today'
    return dateFromKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const rangeEvents = $derived.by(() => {
    const { lo, hi } = grid.rangeBounds
    return filtered
      .filter((e) => e.date >= lo && e.date <= hi)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
  })

  const rangeTypeCounts = $derived.by(() => {
    const init = { meeting: 0, task: 0, travel: 0, reminder: 0 }
    for (const e of rangeEvents) init[e.type]++
    return init
  })

  const selectedDayEvents = $derived(eventsByDate.get(grid.rangeStart) ?? [])

  const upcoming = $derived(
    filtered
      .filter((e) => e.date > grid.todayKey)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      .slice(0, 4),
  )

  // Cells fit two chips. With three or more events, show one chip and
  // "+N more" so the chip keeps room for its time line.
  function visibleEvents(key: string) {
    const list = eventsByDate.get(key) ?? []
    return list.slice(0, list.length > 2 ? 1 : 2)
  }

  function openEvent(e: CalendarEvent) {
    selectedEvent = e
    eventOpen = true
  }

  // WHY (Rule94): keyboard anchor for a day cell. The cell itself is a plain
  // <div> (no nested button) and each event chip is a real <button> -- Enter
  // on the focused cell anchors the single-day selection.
  function anchorDay(key: string) {
    grid.rangeAnchor = key
    grid.rangeStart = key
    grid.rangeEnd = key
  }

  function copyDate(key: string) {
    navigator?.clipboard?.writeText(key).catch(() => {})
  }

  function fmtDayLong(key: string) {
    return dateFromKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }
  function fmtDayShort(key: string) {
    return dateFromKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  function fmtMonthShort(key: string) {
    return dateFromKey(key).toLocaleDateString('en-US', { month: 'short' })
  }

  function initials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2)
  }

  function timeRange(e: CalendarEvent) {
    return e.start === e.end ? e.start : `${e.start}–${e.end}`
  }

  function cellRangeClass(key: string, inMonth: boolean) {
    const { lo, hi } = grid.rangeBounds
    if (!grid.inRange(key)) return inMonth ? 'bg-background hover:bg-accent/40' : 'bg-muted/20 hover:bg-muted/30'
    if (key === lo && key === hi) return 'bg-accent/30 ring-1 ring-inset ring-primary/60'
    let cls = 'bg-primary/10 hover:bg-primary/15'
    if (key === lo) cls += ' ring-1 ring-inset ring-primary/60'
    if (key === hi) cls += ' ring-1 ring-inset ring-primary/60'
    return cls
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<!-- useMonthGrid registers window mouseup listeners itself, so no
     container-level mouseup catcher is needed here. -->
<Page>
  <PageHeader>
    <PageHeaderHeading
      {title}
      description="Schedule, meetings and deadlines. Drag or shift-click to select a range."
    />
    {#snippet actions()}
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <div class="w-56">
          <Input bind:value={search} size="small" placeholder="Search events…" prefixIcon={Search} />
        </div>
        <Select value={view} onValueChange={(v) => (view = v as typeof view)}>
          <SelectTrigger size="sm" class="w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm">
          <Plus class="size-4" aria-hidden="true" />
          New event
        </Button>
      </div>
    {/snippet}
  </PageHeader>

  <PageBody class="space-y-4">
    <!-- Stats strip -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each typeKeys as type (type)}
        {@const meta = typeMeta[type]}
        {@const next = nextByType[type]}
        <StatTile label={meta.label} value={String(monthCounts[type])} caption="this month" dotClass={meta.dot}>
          {#snippet footer()}
            {#if next}
              <p class="truncate" title={`Next: ${fmtNextDate(next.date)} · ${next.title}`}>
                Next: {fmtNextDate(next.date)} · <span class="text-foreground font-medium">{next.title}</span>
              </p>
            {:else}
              <p>Nothing upcoming</p>
            {/if}
          {/snippet}
        </StatTile>
      {/each}
    </div>

    <!-- Main: calendar + side rail -->
    <div class="grid gap-4 lg:grid-cols-3">
      <!-- Month grid -->
      <Card class="lg:col-span-2">
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-2">
          <div class="flex items-center gap-2">
            <Button variant="outline" size="icon" class="size-7" aria-label="Previous month" onclick={() => grid.prevMonth()}>
              <ChevronLeft class="size-4" />
            </Button>
            <Button variant="outline" size="icon" class="size-7" aria-label="Next month" onclick={() => grid.nextMonth()}>
              <ChevronRight class="size-4" />
            </Button>
            <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={() => grid.goToToday()}>Today</Button>
            <h2 class="ml-2 text-sm font-semibold">{grid.monthLabel}</h2>
          </div>
          <div class="text-muted-foreground flex items-center gap-4 text-xs">
            {#if grid.isRange}
              <div class="bg-primary/10 text-primary ring-primary/20 flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1 ring-inset">
                <MousePointer2 class="size-3.5" aria-hidden="true" />
                <span class="tabular-nums">{grid.rangeDayCount} days · {rangeEvents.length} events</span>
                <button type="button" class="hover:text-foreground ml-0.5" aria-label="Clear range" onclick={() => grid.clearRange()}>
                  <X class="size-3.5" />
                </button>
              </div>
            {/if}
            <div class="flex items-center gap-1.5">
              <Sparkles class="size-3.5" aria-hidden="true" />
              <span class="tabular-nums">{monthCounts.total} event{monthCounts.total === 1 ? '' : 's'} this month</span>
            </div>
          </div>
        </div>

        <!-- Weekday header -->
        <div class="bg-muted/10 text-muted-foreground grid grid-cols-7 border-b text-xs font-medium tracking-wider uppercase">
          {#each grid.weekdays as w (w)}
            <div class="p-2">{w}</div>
          {/each}
        </div>

        <!-- Cells -->
        <div class="grid grid-cols-7 select-none">
          {#if loading}
            {#each Array(35) as _, i (i)}
              <div class="h-28 border-r border-b p-1.5 last:border-r-0">
                <Skeleton class="h-3 w-6" />
                <Skeleton class="mt-2 h-3 w-full" />
              </div>
            {/each}
          {:else}
            {#each grid.gridDays as d, i (d.key)}
              {@const dayCount = eventsByDate.get(d.key)?.length ?? 0}
              {@const shown = visibleEvents(d.key)}
              <ContextMenu>
                <ContextMenuTrigger>
                  <!-- WHY (Rule94): the cell is a plain div (role=group, never
                       a button) so the event chip inside can be a REAL button.
                       No nested interactives; the chip is keyboard reachable
                       by Tab and the cell anchors via Enter/Space. -->
                  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                  <div
                    class={[
                      'group focus-visible:ring-ring relative flex h-28 min-w-0 cursor-default flex-col gap-1 border-r border-b p-1.5 text-left transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none',
                      (i + 1) % 7 === 0 && 'border-r-0',
                      i >= 35 && 'border-b-0',
                      cellRangeClass(d.key, d.inMonth),
                    ]}
                    tabindex="0"
                    role="group"
                    aria-label={`${fmtDayLong(d.key)}: ${dayCount} events`}
                    onmousedown={(e) => grid.onCellMouseDown(d.key, e)}
                    onmouseenter={() => grid.onCellMouseEnter(d.key)}
                    onkeydown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (e.key === ' ') e.preventDefault()
                        anchorDay(d.key)
                      }
                    }}
                  >
                    <div class="flex items-center justify-between">
                      <span
                        class={[
                          'inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                          d.key === grid.todayKey && 'bg-primary text-primary-foreground font-semibold',
                          d.key !== grid.todayKey && d.inMonth && 'text-foreground',
                          !d.inMonth && 'text-muted-foreground',
                        ]}
                      >{d.date.getDate()}</span>
                      {#if dayCount > 0}
                        <span class="text-muted-foreground text-xs tabular-nums">{dayCount}</span>
                      {/if}
                    </div>
                    <div class="flex min-w-0 flex-col gap-0.5">
                      {#each shown as e (e.id)}
                        <ContextMenu>
                          <ContextMenuTrigger>
                            <button
                              type="button"
                              class={['focus-visible:ring-ring flex w-full min-w-0 cursor-pointer flex-col rounded-sm border-l-2 px-1 py-0.5 text-left text-xs leading-4 focus-visible:ring-2 focus-visible:outline-none', typeMeta[e.type].chip]}
                              title={`${timeRange(e)} · ${e.title}`}
                              aria-label={`${e.title}, ${timeRange(e)}`}
                              onmousedown={(ev) => ev.stopPropagation()}
                              onclick={(ev) => {
                                ev.stopPropagation()
                                openEvent(e)
                              }}
                              oncontextmenu={(ev) => ev.stopPropagation()}
                            >
                              <span class="truncate font-medium">{e.title}</span>
                              <span class="text-muted-foreground tabular-nums">{e.start}</span>
                            </button>
                          </ContextMenuTrigger>
                          <ContextMenuContent class="w-52">
                            <ContextMenuLabel class="text-muted-foreground flex items-center gap-1.5 text-xs">
                              <span class={['size-2 shrink-0 rounded-full', typeMeta[e.type].dot]}></span>
                              <span class="truncate">{e.title}</span>
                            </ContextMenuLabel>
                            <ContextMenuSeparator />
                            <ContextMenuItem onSelect={() => openEvent(e)}>
                              <Eye /> View details
                              <ContextMenuShortcut>↵</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem><Pencil /> Edit</ContextMenuItem>
                            <ContextMenuItem><CopyPlus /> Duplicate</ContextMenuItem>
                            <ContextMenuItem onSelect={() => copyDate(e.date)}><Copy /> Copy date</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem variant="destructive"><Trash2 /> Cancel event</ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      {/each}
                      {#if dayCount > shown.length}
                        <span class="text-muted-foreground px-1 text-xs">+{dayCount - shown.length} more</span>
                      {/if}
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent class="w-56">
                  <ContextMenuLabel class="text-muted-foreground text-xs">{fmtDayLong(d.key)}</ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem>
                    <CalendarPlus /> New event
                    <ContextMenuShortcut>N</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => grid.selectWeekOf(d.key)}>
                    <CalendarDays /> Select this week
                  </ContextMenuItem>
                  <ContextMenuItem disabled={dayCount === 0} onSelect={() => anchorDay(d.key)}>
                    <Eye /> View day · {dayCount} event{dayCount === 1 ? '' : 's'}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => copyDate(d.key)}>
                    <Copy /> Copy date <ContextMenuShortcut class="tabular-nums">{d.key}</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => grid.goToToday()}>
                    <ArrowRight /> Go to today
                  </ContextMenuItem>
                  {#if grid.isRange}
                    <ContextMenuItem variant="destructive" onSelect={() => grid.clearRange()}>
                      <X /> Clear range
                    </ContextMenuItem>
                  {/if}
                </ContextMenuContent>
              </ContextMenu>
            {/each}
          {/if}
        </div>

        <!-- Legend -->
        <div class="bg-muted/20 text-muted-foreground flex flex-wrap items-center gap-4 border-t px-4 py-2 text-xs">
          <ListFilter class="size-3.5" aria-hidden="true" />
          {#each typeKeys as key (key)}
            <div class="flex items-center gap-1.5">
              <span class={['size-2 rounded-full', typeMeta[key].dot]}></span>
              {typeMeta[key].label}
            </div>
          {/each}
          <span class="ml-auto">Drag or shift-click to select a range. Right-click for actions.</span>
        </div>
      </Card>

      <!-- Side rail -->
      <aside class="flex flex-col gap-4">
        <!-- Selected day (single) OR range summary -->
        {#if !grid.isRange}
          <Card>
            <div class="border-b p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    {grid.rangeStart === grid.todayKey ? 'Today' : 'Selected'}
                  </p>
                  <p class="mt-0.5 text-base font-semibold">{fmtDayLong(grid.rangeStart)}</p>
                </div>
                <div class="text-right">
                  <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Events</p>
                  <p class="text-sm font-semibold tabular-nums">{selectedDayEvents.length}</p>
                </div>
              </div>
            </div>
            <OverlayScroll class="max-h-[420px] p-2">
              {#if loading}
                {#each [0, 1, 2] as i (i)}
                  <div class="mb-2 space-y-2 rounded-lg border p-3">
                    <Skeleton class="h-3 w-32" />
                    <Skeleton class="h-2 w-20" />
                  </div>
                {/each}
              {:else if selectedDayEvents.length === 0}
                <div class="flex flex-col items-center justify-center gap-2 py-4 text-center">
                  <div class="bg-muted flex size-10 items-center justify-center rounded-full">
                    <CalendarDays class="text-muted-foreground size-5" aria-hidden="true" />
                  </div>
                  <p class="text-sm font-medium">Nothing scheduled</p>
                  <p class="text-muted-foreground text-xs">Click a date or add a new event.</p>
                  <Button size="sm" variant="outline" class="mt-1">
                    <Plus class="size-4" aria-hidden="true" /> New event
                  </Button>
                </div>
              {:else}
                {#each selectedDayEvents as e (e.id)}
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <button
                        type="button"
                        class="group hover:bg-accent/50 focus-visible:ring-ring/50 relative flex w-full gap-2 rounded-lg p-2 text-left transition-colors outline-none focus-visible:ring-[3px]"
                        onclick={() => openEvent(e)}
                      >
                        <div class={['w-0.5 shrink-0 rounded-full', typeMeta[e.type].dot]}></div>
                        <div class="min-w-0 flex-1 space-y-1">
                          <div class="flex items-start justify-between gap-2">
                            <p class="text-sm leading-tight font-medium">{e.title}</p>
                            <span class={['shrink-0 rounded px-1.5 py-0.5 text-xs', typeMeta[e.type].pill]}>
                              {typeMeta[e.type].label}
                            </span>
                          </div>
                          <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                            <span class="inline-flex items-center gap-1.5 tabular-nums"><Clock class="size-3.5" aria-hidden="true" />{timeRange(e)}</span>
                            {#if e.location}
                              <span class="inline-flex items-center gap-1.5"><MapPin class="size-3.5" aria-hidden="true" />{e.location}</span>
                            {/if}
                          </div>
                          {#if e.attendees?.length}
                            <div class="flex items-center -space-x-1.5 pt-0.5">
                              {#each e.attendees.slice(0, 4) as a, i (i)}
                                <Avatar class="border-background size-6 border-2">
                                  <AvatarFallback class="bg-muted text-muted-foreground text-xs">{initials(a)}</AvatarFallback>
                                </Avatar>
                              {/each}
                              {#if e.attendees.length > 4}
                                <span class="text-muted-foreground pl-2 text-xs">+{e.attendees.length - 4}</span>
                              {/if}
                            </div>
                          {/if}
                        </div>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent class="w-48">
                      <ContextMenuLabel class="text-muted-foreground truncate text-xs">{e.title}</ContextMenuLabel>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => openEvent(e)}><Eye /> View details</ContextMenuItem>
                      <ContextMenuItem><Pencil /> Edit</ContextMenuItem>
                      <ContextMenuItem><CopyPlus /> Duplicate</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem variant="destructive"><Trash2 /> Cancel event</ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                {/each}
              {/if}
            </OverlayScroll>
          </Card>
        {:else}
          <!-- Range summary -->
          <Card>
            <div class="border-b p-4">
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Range · {grid.rangeDayCount} days
                  </p>
                  <p class="mt-0.5 truncate text-base font-semibold">
                    {fmtDayShort(grid.rangeBounds.lo)} → {fmtDayShort(grid.rangeBounds.hi)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" class="size-7" aria-label="Clear range" onclick={() => grid.clearRange()}>
                  <X class="size-4" />
                </Button>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2">
                {#each typeKeys as type (type)}
                  <div class="flex items-center justify-between gap-2 px-2 py-1.5">
                    <div class="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <span class={['size-2 rounded-full', typeMeta[type].dot]}></span>
                      {typeMeta[type].label}
                    </div>
                    <p class="text-sm font-semibold tabular-nums">{rangeTypeCounts[type]}</p>
                  </div>
                {/each}
              </div>
            </div>
            <OverlayScroll class="max-h-[420px]">
              {#if rangeEvents.length === 0}
                <p class="text-muted-foreground px-4 py-4 text-center text-xs">No events in range.</p>
              {:else}
                {#each rangeEvents as e (e.id)}
                  <button
                    type="button"
                    class="hover:bg-accent/40 focus-visible:ring-ring/50 flex w-full items-start gap-2 border-b px-3 py-2 text-left transition-colors outline-none last:border-b-0 focus-visible:ring-[3px] focus-visible:ring-inset"
                    onclick={() => openEvent(e)}
                  >
                    <div class="bg-background flex w-10 shrink-0 flex-col items-center rounded-md p-1 text-center">
                      <span class="text-muted-foreground text-xs uppercase">{fmtMonthShort(e.date)}</span>
                      <span class="text-sm leading-none font-semibold tabular-nums">{dateFromKey(e.date).getDate()}</span>
                    </div>
                    <div class={['w-0.5 shrink-0 self-stretch rounded-full', typeMeta[e.type].dot]}></div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium" title={e.title}>{e.title}</p>
                      <p class="text-muted-foreground mt-0.5 text-xs tabular-nums">
                        {timeRange(e)}{#if e.location}<span> · {e.location}</span>{/if}
                      </p>
                    </div>
                    <span class={['shrink-0 rounded px-1.5 py-0.5 text-xs', typeMeta[e.type].pill]}>
                      {typeMeta[e.type].label}
                    </span>
                  </button>
                {/each}
              {/if}
            </OverlayScroll>
          </Card>
        {/if}

        <!-- Upcoming -->
        <Card>
          <CardHeader class="border-b">
            <CardTitle as="h2" class="text-base">Up next</CardTitle>
            <CardDescription>After today</CardDescription>
          </CardHeader>
          <div class="divide-y">
            {#if loading}
              {#each [0, 1, 2] as i (i)}
                <div class="flex items-center gap-2 p-3">
                  <Skeleton class="size-10 rounded-md" />
                  <div class="flex-1 space-y-1">
                    <Skeleton class="h-3 w-32" />
                    <Skeleton class="h-2 w-20" />
                  </div>
                </div>
              {/each}
            {:else if upcoming.length === 0}
              <p class="text-muted-foreground px-4 py-4 text-center text-xs">Nothing on the horizon.</p>
            {:else}
              {#each upcoming as e (e.id)}
                <button
                  type="button"
                  class="group hover:bg-accent/40 flex w-full items-center gap-2 p-3 text-left transition-colors"
                  onclick={() => openEvent(e)}
                >
                  <div class="bg-background flex size-10 shrink-0 flex-col items-center justify-center rounded-md text-center">
                    <span class="text-muted-foreground text-xs uppercase">{fmtMonthShort(e.date)}</span>
                    <span class="text-sm leading-none font-semibold tabular-nums">{dateFromKey(e.date).getDate()}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class={['size-2 shrink-0 rounded-full', typeMeta[e.type].dot]}></span>
                      <p class="truncate text-sm font-medium" title={e.title}>{e.title}</p>
                    </div>
                    <p class="text-muted-foreground mt-0.5 text-xs tabular-nums">
                      {timeRange(e)}{#if e.location}<span> · {e.location}</span>{/if}
                    </p>
                  </div>
                </button>
              {/each}
            {/if}
          </div>
        </Card>
      </aside>
    </div>
  </PageBody>

  <!-- Event Detail Dialog -->
  <Dialog bind:open={eventOpen}>
    {#if selectedEvent}
      {@const detailMeta = typeMeta[selectedEvent.type]}
      {@const DetailIcon = detailMeta.icon}
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="flex items-center gap-2">
            <div class={['flex size-8 items-center justify-center rounded-md', detailMeta.iconBox]}>
              <DetailIcon class="size-4" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle class="text-base">{selectedEvent.title}</DialogTitle>
              <DialogDescription class="text-xs">{detailMeta.label} · {selectedEvent.status}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div class="space-y-3 py-2">
          <p class="text-muted-foreground text-sm">{selectedEvent.description}</p>
          <Separator />
          <div class="grid gap-2 text-sm">
            <div class="flex items-center gap-2">
              <Clock class="text-muted-foreground size-4" aria-hidden="true" />
              <span class="tabular-nums">{fmtDayLong(selectedEvent.date)} · {timeRange(selectedEvent)}</span>
            </div>
            {#if selectedEvent.location}
              <div class="flex items-center gap-2">
                <MapPin class="text-muted-foreground size-4" aria-hidden="true" />
                <span>{selectedEvent.location}</span>
              </div>
            {/if}
            {#if selectedEvent.attendees?.length}
              <div class="flex items-start gap-2">
                <Users class="text-muted-foreground mt-0.5 size-4" aria-hidden="true" />
                <div class="flex flex-wrap items-center gap-1.5">
                  {#each selectedEvent.attendees as a (a)}
                    <div class="bg-muted flex items-center gap-1.5 rounded-full py-0.5 pr-2 pl-0.5 text-xs">
                      <Avatar class="size-6">
                        <AvatarFallback class="bg-background text-muted-foreground text-xs">{initials(a)}</AvatarFallback>
                      </Avatar>
                      <span>{a}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm">Edit</Button>
          <Button size="sm" variant="destructive">Cancel event</Button>
        </DialogFooter>
      </DialogContent>
    {/if}
  </Dialog>
</Page>
