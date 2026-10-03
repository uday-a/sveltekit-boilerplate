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
  import { Button } from '$lib/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '$lib/components/ui/dialog'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
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
  import { useMonthGrid, dateFromKey } from '$lib/composables/useMonthGrid.svelte'

  // Port of nuxt `app/pages/dashboard/calendar.vue` — same sections, seed
  // data, and range-drag behavior. The month-grid state lives on the `grid`
  // object (getters stay reactive only via `grid.*` reads — destructuring
  // would snapshot them).

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

  // Calendar is a demo page; the seed data lives inline rather than
  // behind a public mock API route. When you wire a real events table,
  // swap to `apiFetch<ApiResponse<CalendarEvent[]>>('/api/events')`.
  // The `loading` state keeps the skeleton flow identical to the
  // eventual async version.
  let events = $state<CalendarEvent[]>([
    { id: '1', title: 'Q2 Roadmap Review', date: '2026-05-16', start: '10:00', end: '11:30', type: 'meeting', description: 'Review Design Engineering backlog and prioritize Sprint 25.', location: 'Conference Room A', attendees: ['Sarah Connor', 'Marcus Rivera', 'Alice Chen'], status: 'confirmed' },
    { id: '2', title: 'Customer call — Northwind', date: '2026-05-16', start: '14:00', end: '14:45', type: 'meeting', description: 'Contract renewal discussion. Prepare usage report.', location: 'Zoom', attendees: ['Marcus Rivera'], status: 'confirmed' },
    { id: '3', title: 'Deploy window', date: '2026-05-16', start: '16:00', end: '17:00', type: 'task', description: 'Production deploy for dashboard v2.1. Zero-downtime expected.', status: 'confirmed' },
    { id: '4', title: 'Team standup', date: '2026-05-19', start: '09:30', end: '10:00', type: 'meeting', description: 'Daily sync. Blockers and wins.', location: 'Slack huddle', attendees: ['Design Engineering'], status: 'confirmed' },
    { id: '5', title: 'UX critique', date: '2026-05-20', start: '11:00', end: '12:00', type: 'meeting', description: 'Review new onboarding flow mockups.', location: 'Figma', attendees: ['Alice Chen', 'David Kim'], status: 'tentative' },
    { id: '6', title: 'Berlin trip — Marcus', date: '2026-05-20', start: '08:00', end: '20:00', type: 'travel', description: 'Customer onsite at Sentinel Labs.', location: 'Berlin', status: 'confirmed' },
    { id: '7', title: 'Performance review deadline', date: '2026-05-22', start: '17:00', end: '17:00', type: 'reminder', description: 'Submit peer feedback via Lattice.', status: 'confirmed' },
    { id: '8', title: 'Vue Conf 2026', date: '2026-05-28', start: '09:00', end: '18:00', type: 'travel', description: 'Alice attending. Prepare talk slides.', location: 'San Francisco', attendees: ['Alice Chen'], status: 'confirmed' },
  ])
  let loading = $state(false)

  // Headless month-grid + range-select state and handlers.
  const grid = useMonthGrid({ initialDate: '2026-05-16' })

  const typeMeta: Record<CalendarEvent['type'], {
    label: string
    icon: Component
    chip: string
    bar: string
    dot: string
    ring: string
  }> = {
    meeting: { label: 'Meeting', icon: Video, chip: 'bg-chart-1/10 text-chart-1 ring-chart-1/20', bar: 'bg-chart-1', dot: 'bg-chart-1', ring: 'hover:ring-chart-1/30' },
    task: { label: 'Task', icon: CheckCircle2, chip: 'bg-chart-2/10 text-chart-2 ring-chart-2/20', bar: 'bg-chart-2', dot: 'bg-chart-2', ring: 'hover:ring-chart-2/30' },
    reminder: { label: 'Reminder', icon: AlertCircle, chip: 'bg-chart-3/10 text-chart-3 ring-chart-3/20', bar: 'bg-chart-3', dot: 'bg-chart-3', ring: 'hover:ring-chart-3/30' },
    travel: { label: 'Travel', icon: Plane, chip: 'bg-chart-4/10 text-chart-4 ring-chart-4/20', bar: 'bg-chart-4', dot: 'bg-chart-4', ring: 'hover:ring-chart-4/30' },
  }
  const typeKeys = ['meeting', 'task', 'reminder', 'travel'] as const

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
      const d = new Date(e.date)
      if (d.getFullYear() === y && d.getMonth() === m) {
        init[e.type]++
        init.total++
      }
    }
    return init
  })

  type TypeKey = CalendarEvent['type']
  const typeStats = $derived.by(() => {
    const y = grid.cursor.getFullYear()
    const m = grid.cursor.getMonth()
    const out: Record<TypeKey, { weeks: number[], next: CalendarEvent | null }> = {
      meeting: { weeks: [0, 0, 0, 0, 0, 0], next: null },
      task: { weeks: [0, 0, 0, 0, 0, 0], next: null },
      reminder: { weeks: [0, 0, 0, 0, 0, 0], next: null },
      travel: { weeks: [0, 0, 0, 0, 0, 0], next: null },
    }
    const firstOffset = new Date(y, m, 1).getDay()
    for (const e of events) {
      const d = new Date(e.date)
      if (d.getFullYear() === y && d.getMonth() === m) {
        const week = Math.floor((d.getDate() - 1 + firstOffset) / 7)
        out[e.type].weeks[week]!++
      }
    }
    for (const t of Object.keys(out) as TypeKey[]) {
      const sorted = events
        .filter((e) => e.type === t && e.date >= grid.todayKey)
        .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
      out[t].next = sorted[0] ?? null
    }
    return out
  })

  function fmtNextDate(key: string) {
    const d = dateFromKey(key)
    if (key === grid.todayKey) return 'Today'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  function initials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2)
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
  <title>Calendar | UIPKGE</title>
</svelte:head>

<!-- useMonthGrid registers window mouseup listeners itself, so no
     container-level mouseup catcher is needed here. -->
<Page>
  <PageHeader>
    <PageHeaderHeading
      title="Calendar"
      description="Schedule, meetings, and deadlines. Drag or shift-click to select a range."
    />
    {#snippet actions()}
      <div class="flex items-center gap-2">
        <div class="relative">
          <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input bind:value={search} placeholder="Search events…" class="h-8 w-56 pl-8 text-xs" />
        </div>
        <Select value={view} onValueChange={(v) => (view = v as typeof view)}>
          <SelectTrigger class="h-8 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" class="gap-1.5">
          <Plus class="size-3.5" />
          New event
        </Button>
      </div>
    {/snippet}
  </PageHeader>

  <!-- Stats strip -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#each typeKeys as type (type)}
      {@const meta = typeMeta[type]}
      {@const MetaIcon = meta.icon}
      <button
        type="button"
        class={`group relative isolate flex flex-col overflow-hidden rounded-xl border bg-card/40 p-4 text-left ring-1 ring-inset ring-transparent backdrop-blur transition-all hover:-translate-y-px hover:bg-card hover:shadow-lg ${meta.ring}`}
        onclick={() => (search = meta.label.toLowerCase() === search.toLowerCase() ? '' : meta.label.toLowerCase())}
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span class={`size-1.5 rounded-full ${meta.dot}`}></span>
            <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{meta.label}</p>
          </div>
          <div class={`flex size-7 items-center justify-center rounded-md ring-1 ring-inset ${meta.chip}`}>
            <MetaIcon class="size-3.5" />
          </div>
        </div>

        <div class="mt-2 flex items-baseline gap-1.5">
          <p class="text-2xl leading-none font-semibold tracking-tight tabular-nums">{monthCounts[type]}</p>
          <p class="text-muted-foreground text-xs tracking-wider uppercase">this month</p>
        </div>

        <div class="mt-3 flex h-6 items-end gap-1">
          {#each typeStats[type].weeks.slice(0, 6) as n, i (i)}
            <span
              class={`flex-1 rounded-sm transition-colors ${n > 0 ? meta.bar : 'bg-muted/40'} ${n > 0 ? 'opacity-70 group-hover:opacity-100' : ''}`}
              style={`height: ${n > 0 ? `${Math.min(100, 30 + n * 35)}%` : '20%'}`}
              title={`Week ${i + 1}: ${n} ${meta.label.toLowerCase()}${n === 1 ? '' : 's'}`}
            ></span>
          {/each}
        </div>

        <div class="mt-3 min-h-[2.25rem] border-t pt-2">
          {#if typeStats[type].next}
            <p class="text-muted-foreground text-xs tracking-wider uppercase">
              Next · <span class="text-foreground font-medium">{fmtNextDate(typeStats[type].next!.date)}</span>
            </p>
            <p class="mt-0.5 truncate text-xs font-medium" title={typeStats[type].next!.title}>{typeStats[type].next!.title}</p>
          {:else}
            <p class="text-muted-foreground text-xs tracking-wider uppercase">No upcoming</p>
            <p class="text-muted-foreground mt-0.5 text-xs">All clear</p>
          {/if}
        </div>
      </button>
    {/each}
  </div>

  <!-- Main: calendar + side rail -->
  <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
    <!-- Month grid -->
    <div class="overflow-hidden rounded-xl border bg-card/40">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
        <div class="flex items-center gap-2">
          <Button variant="outline" size="icon" class="size-7" onclick={() => grid.prevMonth()}>
            <ChevronLeft class="size-4" />
          </Button>
          <Button variant="outline" size="icon" class="size-7" onclick={() => grid.nextMonth()}>
            <ChevronRight class="size-4" />
          </Button>
          <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={() => grid.goToToday()}>Today</Button>
          <h2 class="ml-2 text-sm font-semibold">{grid.monthLabel}</h2>
        </div>
        <div class="text-muted-foreground flex items-center gap-3 text-xs">
          {#if grid.isRange}
            <div class="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-primary ring-1 ring-inset ring-primary/20">
              <MousePointer2 class="size-3" />
              <span>{grid.rangeDayCount} days · {rangeEvents.length} events</span>
              <button class="ml-0.5 hover:text-foreground" onclick={() => grid.clearRange()}>
                <X class="size-3" />
              </button>
            </div>
          {/if}
          <div class="flex items-center gap-1.5">
            <Sparkles class="size-3" />
            <span>{monthCounts.total} event{monthCounts.total === 1 ? '' : 's'} this month</span>
          </div>
        </div>
      </div>

      <!-- Weekday header -->
      <div class="text-muted-foreground grid grid-cols-7 border-b bg-muted/10 text-xs tracking-wider uppercase">
        {#each grid.weekdays as w (w)}
          <div class="px-2 py-2 font-medium">{w}</div>
        {/each}
      </div>

      <!-- Cells -->
      <div class="grid grid-cols-7 select-none">
        {#if loading}
          {#each Array(35) as _, i (i)}
            <div class="h-24 border-r border-b p-1.5 last:border-r-0">
              <Skeleton class="h-3 w-6" />
              <Skeleton class="mt-2 h-3 w-full" />
            </div>
          {/each}
        {:else}
          {#each grid.gridDays as d, i (d.key)}
            <ContextMenu>
              <ContextMenuTrigger>
                <!-- WHY (Rule94): the cell is a plain div (role=group, never
                     a button) so the event chip inside can be a REAL button.
                     No nested interactives; the chip is keyboard reachable
                     by Tab and the cell anchors via Enter/Space. -->
                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <div
                  class={`group relative flex h-24 cursor-default flex-col gap-1 border-r border-b p-1.5 text-left transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${(i + 1) % 7 === 0 ? 'border-r-0' : ''} ${i >= 35 ? 'border-b-0' : ''} ${cellRangeClass(d.key, d.inMonth)} ${!d.inMonth && !grid.inRange(d.key) ? 'text-muted-foreground' : ''}`}
                  tabindex="0"
                  role="group"
                  aria-label={`${fmtDayLong(d.key)}: ${eventsByDate.get(d.key)?.length ?? 0} events`}
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
                      class={`inline-flex size-5 items-center justify-center rounded-full text-xs tabular-nums ${d.key === grid.todayKey ? 'bg-primary text-primary-foreground font-semibold' : ''} ${d.key !== grid.todayKey && d.inMonth ? 'text-foreground' : ''} ${!d.inMonth ? 'text-muted-foreground' : ''}`}
                    >
                      {d.date.getDate()}
                    </span>
                    {#if (eventsByDate.get(d.key)?.length ?? 0) > 0}
                      <span class="text-muted-foreground text-xs tabular-nums">
                        {eventsByDate.get(d.key)!.length}
                      </span>
                    {/if}
                  </div>
                  <div class="flex flex-col gap-0.5">
                    {#each (eventsByDate.get(d.key) ?? []).slice(0, 2) as e (e.id)}
                      <ContextMenu>
                        <ContextMenuTrigger>
                          <button
                            type="button"
                            class={`flex w-full cursor-pointer items-center gap-1 truncate rounded px-1 py-0.5 text-left text-xs ring-1 ring-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${typeMeta[e.type].chip}`}
                            title={`${e.start} · ${e.title}`}
                            aria-label={`${e.title}, ${e.start}`}
                            onmousedown={(ev) => ev.stopPropagation()}
                            onclick={(ev) => {
                              ev.stopPropagation()
                              openEvent(e)
                            }}
                            oncontextmenu={(ev) => ev.stopPropagation()}
                          >
                            <span class="opacity-70 tabular-nums">{e.start}</span>
                            <span class="truncate">{e.title}</span>
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent class="w-52">
                          <ContextMenuLabel class="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <span class={`size-1.5 rounded-full ${typeMeta[e.type].dot}`}></span>
                            <span class="truncate" title={e.title}>{e.title}</span>
                          </ContextMenuLabel>
                          <ContextMenuSeparator />
                          <ContextMenuItem class="gap-2" onSelect={() => openEvent(e)}>
                            <Eye class="size-3.5" /> View details
                            <ContextMenuShortcut>↵</ContextMenuShortcut>
                          </ContextMenuItem>
                          <ContextMenuItem class="gap-2">
                            <Pencil class="size-3.5" /> Edit
                          </ContextMenuItem>
                          <ContextMenuItem class="gap-2">
                            <CopyPlus class="size-3.5" /> Duplicate
                          </ContextMenuItem>
                          <ContextMenuItem class="gap-2" onSelect={() => copyDate(e.date)}>
                            <Copy class="size-3.5" /> Copy date
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem class="gap-2 text-destructive focus:text-destructive">
                            <Trash2 class="size-3.5" /> Cancel event
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    {/each}
                    {#if (eventsByDate.get(d.key)?.length ?? 0) > 2}
                      <span class="text-muted-foreground px-1 text-xs">
                        +{eventsByDate.get(d.key)!.length - 2} more
                      </span>
                    {/if}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent class="w-56">
                <ContextMenuLabel class="text-muted-foreground text-xs">
                  {fmtDayLong(d.key)}
                </ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuItem class="gap-2">
                  <CalendarPlus class="size-3.5" /> New event
                  <ContextMenuShortcut>N</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem class="gap-2" onSelect={() => grid.selectWeekOf(d.key)}>
                  <CalendarDays class="size-3.5" /> Select this week
                </ContextMenuItem>
                <ContextMenuItem
                  class="gap-2"
                  disabled={(eventsByDate.get(d.key)?.length ?? 0) === 0}
                  onSelect={() => anchorDay(d.key)}
                >
                  <Eye class="size-3.5" /> View day · {eventsByDate.get(d.key)?.length ?? 0} event{(eventsByDate.get(d.key)?.length ?? 0) === 1 ? '' : 's'}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem class="gap-2" onSelect={() => copyDate(d.key)}>
                  <Copy class="size-3.5" /> Copy date
                  <ContextMenuShortcut class="tabular-nums">{d.key}</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem class="gap-2" onSelect={() => grid.goToToday()}>
                  <ArrowRight class="size-3.5" /> Go to today
                </ContextMenuItem>
                {#if grid.isRange}
                  <ContextMenuItem class="gap-2 text-destructive focus:text-destructive" onSelect={() => grid.clearRange()}>
                    <X class="size-3.5" /> Clear range
                  </ContextMenuItem>
                {/if}
              </ContextMenuContent>
            </ContextMenu>
          {/each}
        {/if}
      </div>

      <!-- Legend -->
      <div class="text-muted-foreground flex flex-wrap items-center gap-3 border-t bg-muted/20 px-4 py-2 text-xs">
        <ListFilter class="size-3" />
        {#each typeKeys as key (key)}
          <div class="flex items-center gap-1.5">
            <span class={`size-2 rounded-full ${typeMeta[key].dot}`}></span>
            {typeMeta[key].label}
          </div>
        {/each}
        <span class="ml-auto">Tip: drag or shift-click to range. Right-click for actions.</span>
      </div>
    </div>

    <!-- Side rail -->
    <aside class="flex flex-col gap-4">
      {#if !grid.isRange}
        <div class="overflow-hidden rounded-xl border bg-card/40">
          <div class="px-4 py-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-muted-foreground text-xs tracking-wider uppercase">
                  {grid.rangeStart === grid.todayKey ? 'Today' : 'Selected'}
                </p>
                <p class="mt-0.5 text-sm font-semibold">{fmtDayLong(grid.rangeStart)}</p>
              </div>
              <div class="text-right">
                <p class="text-muted-foreground text-xs tracking-wider uppercase">Events</p>
                <p class="text-sm font-semibold tabular-nums">{selectedDayEvents.length}</p>
              </div>
            </div>
          </div>
          <OverlayScroll class="max-h-[420px]">
            {#if loading}
              {#each [0, 1, 2] as i (i)}
                <div class="space-y-2 px-4 py-2.5">
                  <Skeleton class="h-3 w-32" />
                  <Skeleton class="h-2 w-20" />
                </div>
              {/each}
            {:else if selectedDayEvents.length === 0}
              <div class="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div class="bg-muted flex size-10 items-center justify-center rounded-full">
                  <CalendarDays class="text-muted-foreground size-5" />
                </div>
                <p class="text-sm font-medium">Nothing scheduled</p>
                <p class="text-xs text-muted-foreground">Click a date or add a new event.</p>
                <Button size="sm" variant="outline" class="mt-1 h-7 gap-1.5 text-xs">
                  <Plus class="size-3" /> New event
                </Button>
              </div>
            {:else}
              {#each selectedDayEvents as e (e.id)}
                <ContextMenu>
                  <ContextMenuTrigger>
                    <div
                      class="group relative flex cursor-pointer gap-3 px-4 py-2.5 transition-colors hover:bg-accent/50"
                      onclick={() => openEvent(e)}
                      onkeydown={(ev) => {
                        if (ev.key === 'Enter') openEvent(e)
                      }}
                      role="button"
                      tabindex="0"
                    >
                      <div class={`w-0.5 shrink-0 rounded-full ${typeMeta[e.type].bar}`}></div>
                      <div class="min-w-0 flex-1 space-y-1">
                        <div class="flex items-start justify-between gap-2">
                          <p class="text-sm leading-tight font-medium">{e.title}</p>
                          <span class={`shrink-0 rounded px-1.5 py-0.5 text-xs tracking-wider uppercase ring-1 ring-inset ${typeMeta[e.type].chip}`}>
                            {typeMeta[e.type].label}
                          </span>
                        </div>
                        <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <span class="inline-flex items-center gap-1"><Clock class="size-3" />{e.start}–{e.end}</span>
                          {#if e.location}
                            <span class="inline-flex items-center gap-1"><MapPin class="size-3" />{e.location}</span>
                          {/if}
                        </div>
                        {#if e.attendees?.length}
                          <div class="flex items-center -space-x-1.5 pt-0.5">
                            {#each e.attendees.slice(0, 4) as a, i (i)}
                              <Avatar class="size-5 border-2 border-background">
                                <AvatarFallback class="bg-primary/10 text-primary text-xs">
                                  {initials(a)}
                                </AvatarFallback>
                              </Avatar>
                            {/each}
                            {#if e.attendees.length > 4}
                              <span class="text-muted-foreground pl-2 text-xs">+{e.attendees.length - 4}</span>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent class="w-48">
                    <ContextMenuLabel class="text-muted-foreground truncate text-xs" title={e.title}>{e.title}</ContextMenuLabel>
                    <ContextMenuSeparator />
                    <ContextMenuItem class="gap-2" onSelect={() => openEvent(e)}>
                      <Eye class="size-3.5" /> View details
                    </ContextMenuItem>
                    <ContextMenuItem class="gap-2">
                      <Pencil class="size-3.5" /> Edit
                    </ContextMenuItem>
                    <ContextMenuItem class="gap-2">
                      <CopyPlus class="size-3.5" /> Duplicate
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem class="gap-2 text-destructive focus:text-destructive">
                      <Trash2 class="size-3.5" /> Cancel event
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              {/each}
            {/if}
          </OverlayScroll>
        </div>
      {:else}
        <!-- Range summary -->
        <div class="overflow-hidden rounded-xl border bg-card/40">
          <div class="bg-muted/30 border-b px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-muted-foreground text-xs tracking-wider uppercase">
                  Range · {grid.rangeDayCount} days
                </p>
                <p class="mt-0.5 truncate text-sm font-semibold">
                  {fmtDayShort(grid.rangeBounds.lo)} → {fmtDayShort(grid.rangeBounds.hi)}
                </p>
              </div>
              <Button variant="ghost" size="icon" class="size-7" onclick={() => grid.clearRange()}>
                <X class="size-3.5" />
              </Button>
            </div>
            <div class="mt-3 grid grid-cols-4 gap-2">
              {#each typeKeys as t (t)}
                <div>
                  <div class="text-muted-foreground flex items-center gap-1 text-xs tracking-wider uppercase">
                    <span class={`size-1.5 rounded-full ${typeMeta[t].dot}`}></span>
                    {typeMeta[t].label}
                  </div>
                  <p class="mt-0.5 text-sm font-semibold tabular-nums">{rangeTypeCounts[t]}</p>
                </div>
              {/each}
            </div>
          </div>
          <OverlayScroll class="max-h-[420px]">
            {#if rangeEvents.length === 0}
              <p class="text-muted-foreground p-4 text-center text-xs">No events in range.</p>
            {:else}
              {#each rangeEvents as e (e.id)}
                <div
                  class="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition-colors hover:bg-accent/40"
                  onclick={() => openEvent(e)}
                  onkeydown={(ev) => {
                    if (ev.key === 'Enter') openEvent(e)
                  }}
                  role="button"
                  tabindex="0"
                >
                  <div class="bg-muted flex w-10 shrink-0 flex-col items-center rounded-md px-1 py-1 text-center">
                    <span class="text-muted-foreground text-xs uppercase">{new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span class="text-sm leading-none font-semibold tabular-nums">{new Date(e.date).getDate()}</span>
                  </div>
                  <div class={`w-0.5 shrink-0 self-stretch rounded-full ${typeMeta[e.type].bar}`}></div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-medium" title={e.title}>{e.title}</p>
                    <p class="text-muted-foreground mt-0.5 text-xs tabular-nums">
                      {e.start}–{e.end}{#if e.location}<span> · {e.location}</span>{/if}
                    </p>
                  </div>
                  <span class={`shrink-0 rounded px-1.5 py-0.5 text-xs tracking-wider uppercase ring-1 ring-inset ${typeMeta[e.type].chip}`}>
                    {typeMeta[e.type].label}
                  </span>
                </div>
              {/each}
            {/if}
          </OverlayScroll>
        </div>
      {/if}

      <!-- Upcoming -->
      <div class="overflow-hidden rounded-xl border bg-card/40">
        <div class="px-4 py-2.5">
          <p class="text-sm font-semibold">Up next</p>
          <p class="text-muted-foreground text-xs">After today</p>
        </div>
        <div class="space-y-1">
          {#if loading}
            {#each [0, 1, 2] as i (i)}
              <div class="flex items-center gap-3 px-4 py-3">
                <Skeleton class="size-9 rounded-md" />
                <div class="flex-1 space-y-1">
                  <Skeleton class="h-3 w-32" />
                  <Skeleton class="h-2 w-20" />
                </div>
              </div>
            {/each}
          {:else if upcoming.length === 0}
            <p class="text-muted-foreground p-4 text-center text-xs">Nothing on the horizon.</p>
          {:else}
            {#each upcoming as e (e.id)}
              <button
                type="button"
                class="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                onclick={() => openEvent(e)}
              >
                <div class="bg-muted flex size-10 shrink-0 flex-col items-center justify-center rounded-md text-center">
                  <span class="text-muted-foreground text-xs uppercase">{new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span class="text-sm leading-none font-semibold tabular-nums">{new Date(e.date).getDate()}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class={`size-1.5 rounded-full ${typeMeta[e.type].dot}`}></span>
                    <p class="truncate text-xs font-medium" title={e.title}>{e.title}</p>
                  </div>
                  <p class="text-muted-foreground mt-0.5 text-xs tabular-nums">
                    {e.start}–{e.end}{#if e.location}<span> · {e.location}</span>{/if}
                  </p>
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </div>
    </aside>
  </div>

  <!-- Event Detail Dialog -->
  <Dialog bind:open={eventOpen}>
    {#if selectedEvent}
      {@const detailMeta = typeMeta[selectedEvent.type]}
      {@const DetailIcon = detailMeta.icon}
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="flex items-center gap-2">
            <div class={`flex size-8 items-center justify-center rounded-md ring-1 ring-inset ${detailMeta.chip}`}>
              <DetailIcon class="size-4" />
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
              <Clock class="text-muted-foreground size-4" />
              <span>{selectedEvent.date} · {selectedEvent.start} – {selectedEvent.end}</span>
            </div>
            {#if selectedEvent.location}
              <div class="flex items-center gap-2">
                <MapPin class="text-muted-foreground size-4" />
                <span>{selectedEvent.location}</span>
              </div>
            {/if}
            {#if selectedEvent.attendees?.length}
              <div class="flex items-start gap-2">
                <Users class="text-muted-foreground mt-0.5 size-4" />
                <div class="flex flex-wrap items-center gap-1.5">
                  {#each selectedEvent.attendees as a (a)}
                    <div class="bg-muted flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs">
                      <Avatar class="size-5">
                        <AvatarFallback class="bg-primary/10 text-primary text-xs">
                          {initials(a)}
                        </AvatarFallback>
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
