<script lang="ts">
  import { onMount, untrack, type Component } from 'svelte'
  import { SvelteDate, SvelteSet } from 'svelte/reactivity'
  import {
    Activity,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ArrowUpRight,
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Columns3,
    CreditCard,
    Download,
    Filter,
    Mail,
    MapPin,
    MoreHorizontal,
    Plus,
    RotateCcw,
    Search,
    SlidersHorizontal,
    UserPlus,
    Users,
    X,
  } from '@lucide/svelte'
  import {
    Table,
    TableBody,
    TableCell,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
  } from '$lib/components/ui/table'
  import { Card, CardContent, CardHeader } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { toast } from 'svelte-sonner'
  import { formatMoney, formatNumber } from '$lib/utils'
  import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '$lib/components/ui/sheet'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Separator } from '$lib/components/ui/separator'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { locale, t } from '$lib/i18n'

  // Port of nuxt `app/pages/dashboard/data-table.vue` — same 48-row mock
  // dataset, client-side sort/filter/paginate, column chooser, density
  // toggle, detail sheet, and CSV export.

  type Status = 'active' | 'trial' | 'churned' | 'invited'
  type Plan = 'Free' | 'Pro' | 'Team' | 'Enterprise'
  type Density = 'compact' | 'comfortable'
  type DateRange = 'all' | '7d' | '30d' | '90d'

  interface Customer {
    id: string
    name: string
    email: string
    plan: Plan
    status: Status
    mrr: number
    seats: number
    country: string
    lastSeen: string
    createdAt: string
  }

  // Mock data -- swap for `apiFetch('/api/customers')` when a real endpoint
  // exists. 48 rows so pagination, faceted filters, and CSV export all have
  // something interesting to do.
  const customers: Customer[] = [
    { id: '1', name: 'Northwind Industries', email: 'ops@northwind.example', plan: 'Enterprise', status: 'active', mrr: 4800, seats: 220, country: 'US', lastSeen: '2026-05-15', createdAt: '2023-02-11' },
    { id: '2', name: 'Sentinel Labs', email: 'team@sentinel.example', plan: 'Enterprise', status: 'active', mrr: 3600, seats: 145, country: 'US', lastSeen: '2026-05-15', createdAt: '2023-04-02' },
    { id: '3', name: 'Apex Logistics', email: 'admin@apex.example', plan: 'Pro', status: 'trial', mrr: 0, seats: 12, country: 'CA', lastSeen: '2026-05-14', createdAt: '2026-05-01' },
    { id: '4', name: 'Olympus Robotics', email: 'finance@olympus.example', plan: 'Enterprise', status: 'active', mrr: 5200, seats: 310, country: 'DE', lastSeen: '2026-05-15', createdAt: '2022-11-19' },
    { id: '5', name: 'Crescent Health', email: 'it@crescent.example', plan: 'Pro', status: 'active', mrr: 1800, seats: 64, country: 'UK', lastSeen: '2026-05-15', createdAt: '2024-01-08' },
    { id: '6', name: 'Polaris Software', email: 'eng@polaris.example', plan: 'Pro', status: 'active', mrr: 980, seats: 38, country: 'US', lastSeen: '2026-05-13', createdAt: '2024-06-30' },
    { id: '7', name: 'Bluefin Studios', email: 'studio@bluefin.example', plan: 'Team', status: 'active', mrr: 720, seats: 22, country: 'AU', lastSeen: '2026-05-15', createdAt: '2025-02-14' },
    { id: '8', name: 'Mercury Holdings', email: 'ops@mercury.example', plan: 'Enterprise', status: 'churned', mrr: 0, seats: 0, country: 'US', lastSeen: '2026-03-22', createdAt: '2022-05-04' },
    { id: '9', name: 'Vertex Analytics', email: 'data@vertex.example', plan: 'Team', status: 'active', mrr: 1240, seats: 41, country: 'US', lastSeen: '2026-05-15', createdAt: '2024-09-12' },
    { id: '10', name: 'Magnolia Foods', email: 'sales@magnolia.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'FR', lastSeen: '2026-05-12', createdAt: '2026-05-09' },
    { id: '11', name: 'Driftwood Hotels', email: 'gm@driftwood.example', plan: 'Pro', status: 'active', mrr: 2100, seats: 78, country: 'ES', lastSeen: '2026-05-14', createdAt: '2024-03-21' },
    { id: '12', name: 'Cobalt Manufacturing', email: 'plant@cobalt.example', plan: 'Enterprise', status: 'active', mrr: 6800, seats: 420, country: 'DE', lastSeen: '2026-05-15', createdAt: '2021-10-02' },
    { id: '13', name: 'Skyline Couriers', email: 'fleet@skyline.example', plan: 'Pro', status: 'trial', mrr: 0, seats: 8, country: 'US', lastSeen: '2026-05-11', createdAt: '2026-04-28' },
    { id: '14', name: 'Harbor Insurance', email: 'risk@harbor.example', plan: 'Enterprise', status: 'churned', mrr: 0, seats: 0, country: 'UK', lastSeen: '2026-02-18', createdAt: '2022-01-15' },
    { id: '15', name: 'Iron Peak Mining', email: 'site@ironpeak.example', plan: 'Team', status: 'active', mrr: 1480, seats: 52, country: 'CA', lastSeen: '2026-05-15', createdAt: '2023-08-04' },
    { id: '16', name: 'Linden Education', email: 'admin@linden.example', plan: 'Pro', status: 'active', mrr: 920, seats: 31, country: 'NL', lastSeen: '2026-05-13', createdAt: '2024-11-09' },
    { id: '17', name: 'Quartz Media', email: 'news@quartz.example', plan: 'Team', status: 'active', mrr: 640, seats: 19, country: 'US', lastSeen: '2026-05-15', createdAt: '2025-04-22' },
    { id: '18', name: 'Aurelia Cosmetics', email: 'web@aurelia.example', plan: 'Pro', status: 'trial', mrr: 0, seats: 11, country: 'FR', lastSeen: '2026-05-09', createdAt: '2026-04-18' },
    { id: '19', name: 'Tundra Outdoors', email: 'shop@tundra.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'CA', lastSeen: '2026-05-10', createdAt: '2026-05-07' },
    { id: '20', name: 'Falcon Aviation', email: 'ops@falcon.example', plan: 'Enterprise', status: 'active', mrr: 8200, seats: 540, country: 'US', lastSeen: '2026-05-15', createdAt: '2021-06-18' },
    { id: '21', name: 'Larkspur Retail', email: 'pos@larkspur.example', plan: 'Pro', status: 'active', mrr: 1380, seats: 47, country: 'UK', lastSeen: '2026-05-14', createdAt: '2024-02-27' },
    { id: '22', name: 'Bronze Brewing', email: 'taproom@bronze.example', plan: 'Team', status: 'active', mrr: 540, seats: 16, country: 'US', lastSeen: '2026-05-15', createdAt: '2025-07-30' },
    { id: '23', name: 'Cinder Energy', email: 'grid@cinder.example', plan: 'Enterprise', status: 'churned', mrr: 0, seats: 0, country: 'AU', lastSeen: '2026-04-02', createdAt: '2022-09-11' },
    { id: '24', name: 'Marina Logistics', email: 'port@marina.example', plan: 'Pro', status: 'active', mrr: 1620, seats: 58, country: 'NL', lastSeen: '2026-05-15', createdAt: '2024-05-13' },
    { id: '25', name: 'Hazel Coffee', email: 'roast@hazel.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'US', lastSeen: '2026-05-08', createdAt: '2026-05-08' },
    { id: '26', name: 'Granite Capital', email: 'desk@granite.example', plan: 'Enterprise', status: 'active', mrr: 7400, seats: 380, country: 'UK', lastSeen: '2026-05-15', createdAt: '2022-03-26' },
    { id: '27', name: 'Hollow Bay Studios', email: 'art@hollowbay.example', plan: 'Team', status: 'trial', mrr: 0, seats: 9, country: 'CA', lastSeen: '2026-05-13', createdAt: '2026-05-05' },
    { id: '28', name: 'Pioneer Telecom', email: 'noc@pioneer.example', plan: 'Enterprise', status: 'active', mrr: 5400, seats: 290, country: 'US', lastSeen: '2026-05-15', createdAt: '2023-01-30' },
    { id: '29', name: 'Sable Property', email: 'leasing@sable.example', plan: 'Pro', status: 'active', mrr: 1160, seats: 35, country: 'AU', lastSeen: '2026-05-14', createdAt: '2024-08-15' },
    { id: '30', name: 'Ember Bakery', email: 'order@ember.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'US', lastSeen: '2026-05-04', createdAt: '2026-05-03' },
    { id: '31', name: 'Cascade Bikes', email: 'workshop@cascade.example', plan: 'Team', status: 'active', mrr: 780, seats: 24, country: 'US', lastSeen: '2026-05-15', createdAt: '2025-05-20' },
    { id: '32', name: 'Lighthouse Legal', email: 'firm@lighthouse.example', plan: 'Pro', status: 'churned', mrr: 0, seats: 0, country: 'UK', lastSeen: '2026-01-19', createdAt: '2023-07-08' },
    { id: '33', name: 'Briar Travel', email: 'desk@briar.example', plan: 'Team', status: 'trial', mrr: 0, seats: 14, country: 'FR', lastSeen: '2026-05-12', createdAt: '2026-04-30' },
    { id: '34', name: 'Pacific Outfit', email: 'hello@pacific.example', plan: 'Pro', status: 'active', mrr: 1380, seats: 49, country: 'US', lastSeen: '2026-05-15', createdAt: '2024-04-19' },
    { id: '35', name: 'Reverie Audio', email: 'mix@reverie.example', plan: 'Team', status: 'active', mrr: 920, seats: 28, country: 'DE', lastSeen: '2026-05-15', createdAt: '2025-01-12' },
    { id: '36', name: 'Tidewater Ferry', email: 'ops@tidewater.example', plan: 'Pro', status: 'active', mrr: 1540, seats: 51, country: 'CA', lastSeen: '2026-05-14', createdAt: '2024-06-04' },
    { id: '37', name: 'Glassline Optics', email: 'lab@glassline.example', plan: 'Enterprise', status: 'active', mrr: 3120, seats: 168, country: 'JP', lastSeen: '2026-05-15', createdAt: '2023-12-09' },
    { id: '38', name: 'Wildwood Press', email: 'editor@wildwood.example', plan: 'Pro', status: 'trial', mrr: 0, seats: 7, country: 'UK', lastSeen: '2026-05-10', createdAt: '2026-04-25' },
    { id: '39', name: 'Quill & Co', email: 'studio@quill.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'US', lastSeen: '2026-05-06', createdAt: '2026-05-05' },
    { id: '40', name: 'Aster Pharmaceuticals', email: 'rd@aster.example', plan: 'Enterprise', status: 'active', mrr: 9400, seats: 612, country: 'CH', lastSeen: '2026-05-15', createdAt: '2020-09-14' },
    { id: '41', name: 'Birchwood Co-op', email: 'admin@birchwood.example', plan: 'Team', status: 'churned', mrr: 0, seats: 0, country: 'CA', lastSeen: '2026-02-11', createdAt: '2023-04-29' },
    { id: '42', name: 'Sunpeak Solar', email: 'fleet@sunpeak.example', plan: 'Pro', status: 'active', mrr: 1280, seats: 42, country: 'ES', lastSeen: '2026-05-15', createdAt: '2024-10-17' },
    { id: '43', name: 'Halcyon Hospitality', email: 'concierge@halcyon.example', plan: 'Enterprise', status: 'active', mrr: 4200, seats: 240, country: 'US', lastSeen: '2026-05-15', createdAt: '2023-03-08' },
    { id: '44', name: 'Verdant Farms', email: 'mgmt@verdant.example', plan: 'Pro', status: 'active', mrr: 860, seats: 27, country: 'NL', lastSeen: '2026-05-14', createdAt: '2025-08-23' },
    { id: '45', name: 'Onyx Defense', email: 'gov@onyx.example', plan: 'Enterprise', status: 'active', mrr: 11200, seats: 880, country: 'US', lastSeen: '2026-05-15', createdAt: '2020-02-02' },
    { id: '46', name: 'Lumen Education', email: 'campus@lumen.example', plan: 'Team', status: 'trial', mrr: 0, seats: 18, country: 'UK', lastSeen: '2026-05-11', createdAt: '2026-04-22' },
    { id: '47', name: 'Saffron Spices', email: 'shop@saffron.example', plan: 'Free', status: 'invited', mrr: 0, seats: 0, country: 'IN', lastSeen: '2026-05-09', createdAt: '2026-05-09' },
    { id: '48', name: 'Beacon Cycling', email: 'team@beacon.example', plan: 'Pro', status: 'active', mrr: 1060, seats: 33, country: 'US', lastSeen: '2026-05-15', createdAt: '2024-12-01' },
  ]

  const statusTone: Record<Status, string> = {
    active: 'bg-success/10 text-success border-success/20',
    trial: 'bg-info/10 text-info border-info/20',
    invited: 'bg-warning/10 text-warning border-warning/20',
    churned: 'bg-destructive/10 text-destructive border-destructive/20',
  }

  interface ColumnDef {
    key: string
    label: string
    sortable: boolean
    defaultVisible: boolean
    alignRight?: boolean
  }

  const columns = $derived.by<ColumnDef[]>(() => {
    // Subscribe so header units re-render on locale switch ($t is
    // template-only; t() here reads the current locale once).
    void $locale
    return [
      { key: 'name', label: 'Customer', sortable: true, defaultVisible: true },
      { key: 'plan', label: 'Plan', sortable: true, defaultVisible: true },
      { key: 'status', label: 'Status', sortable: true, defaultVisible: true },
      // WHY (Rule62): measured headers carry their units so "$4,800" and "220"
      // never read as unitless.
      { key: 'mrr', label: t('dashboard.table.headers.mrr'), sortable: true, defaultVisible: true, alignRight: true },
      { key: 'seats', label: t('dashboard.table.headers.seats'), sortable: true, defaultVisible: true, alignRight: true },
      { key: 'country', label: 'Country', sortable: true, defaultVisible: false },
      { key: 'lastSeen', label: 'Last seen', sortable: true, defaultVisible: true },
      { key: 'createdAt', label: 'Created', sortable: true, defaultVisible: false },
    ]
  })

  const STATUSES: Status[] = ['active', 'trial', 'invited', 'churned']
  const PLANS: Plan[] = ['Free', 'Pro', 'Team', 'Enterprise']

  type SortKey = 'name' | 'plan' | 'status' | 'mrr' | 'seats' | 'country' | 'lastSeen' | 'createdAt'

  let search = $state('')
  let statusFilter = $state<Set<Status>>(new Set())
  let planFilter = $state<Set<Plan>>(new Set())
  let dateRange = $state<DateRange>('30d')
  let sortKey = $state<SortKey>('mrr')
  let sortDir = $state<'asc' | 'desc'>('desc')
  let page = $state(0)
  let pageSize = $state(10)
  let selected = $state<Set<string>>(new Set())
  let density = $state<Density>('comfortable')
  // untrack: seed once from the column defaults; later locale-driven label
  // updates must not reset the user's column choices.
  let visibleCols = $state<Set<string>>(untrack(() => new Set(columns.filter((c) => c.defaultVisible).map((c) => c.key))))
  let loading = $state(true)
  let detailOpen = $state(false)
  let detailCustomer = $state<Customer | null>(null)

  // Initial-load skeleton -- visible long enough to demo the shimmer.
  onMount(() => {
    const t = setTimeout(() => (loading = false), 650)
    return () => clearTimeout(t)
  })

  function toggleSort(key: SortKey, sortable: boolean) {
    if (!sortable) return
    if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc'
    else {
      sortKey = key
      sortDir = key === 'mrr' || key === 'seats' ? 'desc' : 'asc'
    }
    page = 0
  }

  function toggleSetValue<T>(set: Set<T>, value: T) {
    const next = new SvelteSet(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const dateCutoff = $derived.by(() => {
    if (dateRange === 'all') return null
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const d = new SvelteDate('2026-05-16')
    d.setDate(d.getDate() - days)
    return d.toISOString().slice(0, 10)
  })

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      if (statusFilter.size && !statusFilter.has(c.status)) return false
      if (planFilter.size && !planFilter.has(c.plan)) return false
      if (dateCutoff && c.lastSeen < dateCutoff) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    })
  })

  const sorted = $derived.by(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof Customer]
      const bv = b[sortKey as keyof Customer]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  })

  const pageCount = $derived(Math.max(1, Math.ceil(sorted.length / pageSize)))
  const paged = $derived(sorted.slice(page * pageSize, (page + 1) * pageSize))

  // Reset page when filters/sort/pageSize churn the result count.
  $effect(() => {
    void search
    void statusFilter
    void planFilter
    void dateRange
    void pageSize
    page = 0
  })

  const allOnPageChecked = $derived(paged.length > 0 && paged.every((c) => selected.has(c.id)))
  const someOnPageChecked = $derived(paged.some((c) => selected.has(c.id)) && !allOnPageChecked)
  const allFilteredChecked = $derived(sorted.length > 0 && sorted.every((c) => selected.has(c.id)))

  function togglePage(v: boolean) {
    const next = new SvelteSet(selected)
    for (const c of paged) {
      if (v) next.add(c.id)
      else next.delete(c.id)
    }
    selected = next
  }

  function selectAllFiltered() {
    selected = new Set(sorted.map((c) => c.id))
  }

  function toggleRow(id: string, v: boolean) {
    const next = new SvelteSet(selected)
    if (v) next.add(id)
    else next.delete(id)
    selected = next
  }

  function clearSelection() {
    selected = new Set()
  }

  // WHY (Rule15): money formatting is centralized in $lib/utils so the
  // data table, forms billing and locations headcount agree on "$0".
  // (formatMoney/formatNumber are imported above; zero renders as $0/0,
  // muted at the call site -- never an em-dash, Rule80.)

  function sortIcon(key: SortKey): Component {
    if (sortKey !== key) return ArrowUpDown
    return sortDir === 'asc' ? ArrowUp : ArrowDown
  }

  function isVisible(key: string) {
    return visibleCols.has(key)
  }

  function toggleColumn(key: string) {
    visibleCols = toggleSetValue(visibleCols, key)
  }

  const activeFilterCount = $derived.by(() => {
    let n = 0
    if (search.trim()) n++
    if (statusFilter.size) n++
    if (planFilter.size) n++
    if (dateRange !== 'all') n++
    return n
  })

  function resetFilters() {
    search = ''
    statusFilter = new Set()
    planFilter = new Set()
    // WHY (Rule72): the default window is 30d, not all-time -- revenue is
    // their job sort and recent data is the working set.
    dateRange = '30d'
    sortKey = 'mrr'
    sortDir = 'desc'
  }

  function openDetail(c: Customer) {
    detailCustomer = c
    detailOpen = true
  }

  // WHY (Rule67): the "Copy ID" menu item really copies (clipboard API with a
  // textarea fallback for non-secure contexts) instead of sitting dead.
  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
    }
    catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    toast.success(label)
  }

  function customerIdOf(c: Customer) {
    return `cus_${c.id.padStart(6, '0')}`
  }

  function copyCustomerId(c: Customer) {
    copyText(customerIdOf(c), t('dashboard.table.copied'))
  }

  // CSV builds from currently visible columns and the filtered+sorted set --
  // matches what the user sees on screen, not the raw dataset.
  function exportCsv() {
    const cols = columns.filter((c) => visibleCols.has(c.key))
    const header = cols.map((c) => c.label).join(',')
    const rows = sorted.map((row) =>
      cols
        .map((c) => {
          const v = row[c.key as keyof Customer]
          const s = String(v).replace(/"/g, '""')
          return /[",\n]/.test(s) ? `"${s}"` : s
        })
        .join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dateRangeLabel: Record<DateRange, string> = {
    'all': 'All time',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  }

  const cellPad = $derived(density === 'compact' ? 'py-1.5' : 'py-3')
  const visibleCount = $derived(columns.filter((c) => visibleCols.has(c.key)).length + 2)

  function initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }

  interface TimelineEvent {
    icon: Component
    title: string
    meta: string
    tone: string
  }

  // Synthesised activity -- in production this would come from
  // `/api/customers/:id/events`; the shape is deterministic from the row
  // data so the demo doesn't churn between opens.
  function timelineFor(c: Customer): TimelineEvent[] {
    const events: TimelineEvent[] = []
    events.push({ icon: UserPlus, title: 'Account created', meta: c.createdAt, tone: 'text-muted-foreground' })
    if (c.status === 'invited') {
      events.push({ icon: Mail, title: 'Invite email sent', meta: c.lastSeen, tone: 'text-warning' })
    }
    else if (c.status === 'trial') {
      events.push({ icon: Activity, title: 'Trial started', meta: c.lastSeen, tone: 'text-info' })
    }
    else if (c.status === 'churned') {
      events.push({ icon: CreditCard, title: 'Subscription ended', meta: c.lastSeen, tone: 'text-destructive' })
    }
    else {
      events.push({ icon: CreditCard, title: `Renewed at ${formatMoney(c.mrr)}/mo`, meta: c.lastSeen, tone: 'text-success' })
      events.push({ icon: Users, title: `${c.seats} seats provisioned`, meta: c.lastSeen, tone: 'text-muted-foreground' })
    }
    return events
  }

  function statusDot(status: Status): string {
    return status === 'active'
      ? 'bg-success'
      : status === 'trial'
        ? 'bg-info'
        : status === 'invited'
          ? 'bg-warning'
          : 'bg-destructive'
  }
</script>

<svelte:head>
  <title>{$t('nav.items.dataTable')} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading class="tabular-nums" title={$t('nav.items.dataTable')} description={`${customers.length} accounts · ${sorted.length} after filters · ${selected.size} selected`} />
    {#snippet actions()}
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" class="h-8 gap-1.5" onclick={exportCsv}>
          <Download class="size-3.5" />Export CSV
        </Button>
        <Button size="sm" class="h-8 gap-1.5">
          <Plus class="size-3.5" />Add customer
        </Button>
      </div>
    {/snippet}
  </PageHeader>

  <Card class="overflow-hidden">
    <CardHeader class="flex flex-col gap-3 space-y-0 border-b p-4">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative max-w-xs min-w-[12rem] flex-1">
          <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input bind:value={search} placeholder="Search name, email, country…" class="h-8 pl-7 text-sm" />
        </div>

        <Popover>
          <PopoverTrigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                <Filter class="size-3.5" />Status
                {#if statusFilter.size}
                  <Badge variant="secondary" class="ml-1 h-4 px-1.5 text-xs">{statusFilter.size}</Badge>
                {/if}
              </Button>
            {/snippet}
          </PopoverTrigger>
          <PopoverContent align="start" class="w-48 p-1">
            {#each STATUSES as s (s)}
              <button
                class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs capitalize hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onclick={() => (statusFilter = toggleSetValue(statusFilter, s))}
              >
                <span class="flex items-center gap-2">
                  <span class={`size-2 rounded-full ${statusDot(s)}`}></span>
                  {s}
                </span>
                {#if statusFilter.has(s)}
                  <Check class="text-muted-foreground size-3" />
                {/if}
              </button>
            {/each}
            <Separator class="my-1" />
            <button
              class="text-muted-foreground w-full rounded px-2 py-1.5 text-left text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onclick={() => (statusFilter = new Set())}
            >
              Clear
            </button>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                <Filter class="size-3.5" />Plan
                {#if planFilter.size}
                  <Badge variant="secondary" class="ml-1 h-4 px-1.5 text-xs">{planFilter.size}</Badge>
                {/if}
              </Button>
            {/snippet}
          </PopoverTrigger>
          <PopoverContent align="start" class="w-44 p-1">
            {#each PLANS as p (p)}
              <button
                class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onclick={() => (planFilter = toggleSetValue(planFilter, p))}
              >
                {p}
                {#if planFilter.has(p)}
                  <Check class="text-muted-foreground size-3" />
                {/if}
              </button>
            {/each}
            <Separator class="my-1" />
            <button
              class="text-muted-foreground w-full rounded px-2 py-1.5 text-left text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onclick={() => (planFilter = new Set())}
            >
              Clear
            </button>
          </PopoverContent>
        </Popover>

        <Select value={dateRange} onValueChange={(v) => (dateRange = v as DateRange)}>
          <SelectTrigger size="sm" class="h-8 w-[140px] text-xs">
            <SelectValue placeholder={dateRangeLabel[dateRange]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        {#if activeFilterCount > 0}
          <Button variant="ghost" size="sm" class="text-muted-foreground h-8 gap-1.5 text-xs" onclick={resetFilters}>
            <RotateCcw class="size-3" />Reset
          </Button>
        {/if}

        <div class="ml-auto flex items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={density}
            onValueChange={(v) => {
              if (typeof v === 'string' && v) density = v as Density
            }}
            class="h-8"
          >
            <ToggleGroupItem value="compact" class="h-8 px-2 text-xs">Compact</ToggleGroupItem>
            <ToggleGroupItem value="comfortable" class="h-8 px-2 text-xs">Cozy</ToggleGroupItem>
          </ToggleGroup>

          <Popover>
            <PopoverTrigger>
              {#snippet child({ props })}
                <Button {...props} variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
                  <Columns3 class="size-3.5" />Columns
                </Button>
              {/snippet}
            </PopoverTrigger>
            <PopoverContent align="end" class="w-44 p-1">
              {#each columns as c (c.key)}
                <button
                  class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                  onclick={() => toggleColumn(c.key)}
                >
                  {c.label}
                  {#if isVisible(c.key)}
                    <Check class="text-muted-foreground size-3" />
                  {/if}
                </button>
              {/each}
            </PopoverContent>
          </Popover>
        </div>
        </div>

        <!-- WHY (Rule70): active filters read as removable chips carrying
             their VALUES (Status: active), not just counts -- the current
             slice stays visible and each chip clears itself. -->
        {#if statusFilter.size || planFilter.size || search.trim()}
          <div class="flex flex-wrap items-center gap-1.5">
            {#each statusFilter as s (`status-${s}`)}
              <Badge variant="secondary" class="gap-1 py-0.5 pr-1 text-xs capitalize">
                {$t('dashboard.table.chips.status')}: {s}
                <button
                  type="button"
                  class="inline-flex items-center rounded-full p-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={$t('dashboard.table.chips.clear', { label: `${$t('dashboard.table.chips.status')}: ${s}` })}
                  onclick={() => (statusFilter = toggleSetValue(statusFilter, s))}
                >
                  <X class="size-3" aria-hidden="true" />
                </button>
              </Badge>
            {/each}
            {#each planFilter as p (`plan-${p}`)}
              <Badge variant="secondary" class="gap-1 py-0.5 pr-1 text-xs">
                {$t('dashboard.table.chips.plan')}: {p}
                <button
                  type="button"
                  class="inline-flex items-center rounded-full p-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={$t('dashboard.table.chips.clear', { label: `${$t('dashboard.table.chips.plan')}: ${p}` })}
                  onclick={() => (planFilter = toggleSetValue(planFilter, p))}
                >
                  <X class="size-3" aria-hidden="true" />
                </button>
              </Badge>
            {/each}
            {#if search.trim()}
              <Badge variant="secondary" class="max-w-56 gap-1 py-0.5 pr-1 text-xs">
                <span class="truncate">{$t('dashboard.table.chips.search')}: "{search.trim()}"</span>
                <button
                  type="button"
                  class="inline-flex shrink-0 items-center rounded-full p-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={$t('dashboard.table.chips.clear', { label: t('dashboard.table.chips.search') })}
                  onclick={() => (search = '')}
                >
                  <X class="size-3" aria-hidden="true" />
                </button>
              </Badge>
            {/if}
          </div>
        {/if}

        {#if selected.size > 0}
        <div class="bg-muted/40 -mx-4 -mb-3 flex flex-wrap items-center gap-2 border-t px-4 py-2 text-xs">
          <span class="font-medium">{selected.size} selected</span>
          {#if allOnPageChecked && !allFilteredChecked && sorted.length > pageSize}
            <button class="text-primary underline-offset-2 hover:underline" onclick={selectAllFiltered}>
              Select all {sorted.length} matching
            </button>
          {/if}
          <div class="ml-auto flex items-center gap-2">
            <!-- WHY (Rule73): bulk-bar actions sit on the h-8 filter-bar
                 system, not h-7. -->
            <Button variant="outline" size="sm" class="h-8 text-xs">Email</Button>
            <Button variant="outline" size="sm" class="h-8 text-xs">Change plan</Button>
            <Button variant="outline" size="sm" class="h-8 text-xs text-destructive">Archive</Button>
            <Button variant="ghost" size="sm" class="h-8 text-xs" onclick={clearSelection}>Clear</Button>
          </div>
        </div>
      {/if}
    </CardHeader>

    <CardContent class="p-0">
      <div class="max-h-[70vh] overflow-auto">
        <Table>
          <!-- WHY (Rule28/35): the hairline is the component's border-b,
               not a shadow utility -- elevation never draws dividers. -->
          <TableHeader class="bg-background sticky top-0 z-10 border-b">
            <TableRow>
              <TableHead class="w-10">
                <Checkbox
                  checked={allOnPageChecked ? true : someOnPageChecked ? 'indeterminate' : false}
                  onCheckedChange={() => togglePage(!allOnPageChecked)}
                />
              </TableHead>
              {#each columns as c (c.key)}
                {#if isVisible(c.key)}
                  {@const SortIcon = sortIcon(c.key as SortKey)}
                  <TableHead
                    scope="col"
                    aria-sort={c.sortable
                      ? sortKey !== (c.key as SortKey)
                        ? 'none'
                        : sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                      : undefined}
                    class={c.alignRight ? 'text-right' : ''}
                  >
                    {#if c.sortable}
                      <button
                        class={`inline-flex items-center gap-1 rounded-sm font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${c.alignRight ? 'ml-auto' : ''}`}
                        onclick={() => toggleSort(c.key as SortKey, c.sortable)}
                      >
                        {c.label}<SortIcon class="size-3" />
                      </button>
                    {:else}
                      <span>{c.label}</span>
                    {/if}
                  </TableHead>
                {/if}
              {/each}
              <TableHead class="w-10"></TableHead>
            </TableRow>
          </TableHeader>

          {#if loading}
            <TableBody>
              {#each Array(pageSize) as _, i (`sk-${i}`)}
                <TableRow>
                  <TableCell class={cellPad}>
                    <Skeleton class="size-4 rounded" />
                  </TableCell>
                  {#each columns.filter((c) => isVisible(c.key)) as c (c.key)}
                    <TableCell class={cellPad}>
                      <Skeleton class={`h-3 ${c.key === 'name' ? 'w-40' : 'w-16'}`} />
                    </TableCell>
                  {/each}
                  <TableCell class={cellPad}>
                    <Skeleton class="size-4 rounded" />
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          {:else}
            <TableBody>
              {#each paged as c (c.id)}
                <TableRow data-state={selected.has(c.id) ? 'selected' : undefined} class="hover:bg-muted/40 cursor-pointer" onclick={() => openDetail(c)}>
                  <TableCell class={cellPad} onclick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={(v) => toggleRow(c.id, v === true)} />
                  </TableCell>
                  {#if isVisible('name')}
                    <TableCell class={cellPad}>
                      <div class="font-medium">{c.name}</div>
                      <div class="text-muted-foreground text-xs">{c.email}</div>
                    </TableCell>
                  {/if}
                  {#if isVisible('plan')}
                    <TableCell class={`text-muted-foreground ${cellPad}`}>{c.plan}</TableCell>
                  {/if}
                  {#if isVisible('status')}
                    <TableCell class={cellPad}>
                      <Badge variant="outline" class={`gap-1 px-2 text-xs font-medium tracking-wide uppercase ${statusTone[c.status]}`}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  {/if}
                  {#if isVisible('mrr')}
                    <TableCell class={`text-right tabular-nums ${cellPad} ${c.mrr === 0 ? 'text-muted-foreground' : ''}`}>{formatMoney(c.mrr)}</TableCell>
                  {/if}
                  {#if isVisible('seats')}
                    <TableCell class={`text-muted-foreground text-right tabular-nums ${cellPad}`}>
                      {formatNumber(c.seats)}
                    </TableCell>
                  {/if}
                  {#if isVisible('country')}
                    <TableCell class={`text-muted-foreground ${cellPad}`}>{c.country}</TableCell>
                  {/if}
                  {#if isVisible('lastSeen')}
                    <TableCell class={`text-muted-foreground text-xs tabular-nums ${cellPad}`}>{c.lastSeen}</TableCell>
                  {/if}
                  {#if isVisible('createdAt')}
                    <TableCell class={`text-muted-foreground text-xs tabular-nums ${cellPad}`}>{c.createdAt}</TableCell>
                  {/if}
                  <TableCell class={cellPad} onclick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger>
                            {#snippet child({ props })}
                              <DropdownMenuTrigger>
                                {#snippet child({ props: menuProps })}
                                  <!-- WHY (Rule76/87): row actions are a 32px
                                       trigger with both an accessible name and
                                       a tooltip -- icon-only never goes naked. -->
                                  <Button
                                    {...props}
                                    {...menuProps}
                                    variant="ghost"
                                    size="icon"
                                    class="size-8"
                                    aria-label={`${$t('dashboard.table.rowActions')} — ${c.name}`}
                                  >
                                    <MoreHorizontal class="size-3.5" />
                                  </Button>
                                {/snippet}
                              </DropdownMenuTrigger>
                            {/snippet}
                          </TooltipTrigger>
                          <TooltipContent>{$t('dashboard.table.rowActions')}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openDetail(c)}>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Email</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => copyCustomerId(c)}>Copy ID</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem class="text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              {/each}
              {#if paged.length === 0}
                <TableEmpty colspan={visibleCount}>
                  <div class="flex flex-col items-center gap-2 py-4">
                    <SlidersHorizontal class="text-muted-foreground size-5" />
                    <p class="text-sm">No customers match your filters.</p>
                    <Button variant="outline" size="sm" class="h-7 text-xs" onclick={resetFilters}>
                      Reset filters
                    </Button>
                  </div>
                </TableEmpty>
              {/if}
            </TableBody>
          {/if}
        </Table>
      </div>
    </CardContent>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs">
      <span class="text-muted-foreground">
        Showing
        <span class="text-foreground tabular-nums">{paged.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)}</span>
        of <span class="text-foreground tabular-nums">{sorted.length}</span>
      </span>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => (pageSize = Number(v))}>
            <SelectTrigger size="sm" class="h-7 w-[68px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span class="text-muted-foreground tabular-nums">Page {page + 1} of {pageCount}</span>

        <div class="flex items-center gap-1">
          <!-- WHY (Rule76/87): pagination triggers are 32px with both
               aria-labels and tooltips. -->
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    class="size-8"
                    disabled={page === 0}
                    aria-label={$t('dashboard.table.pagination.first')}
                    onclick={() => (page = 0)}
                  >
                    <ChevronsLeft class="size-3.5" />
                  </Button>
                {/snippet}
              </TooltipTrigger>
              <TooltipContent>{$t('dashboard.table.pagination.first')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    class="size-8"
                    disabled={page === 0}
                    aria-label={$t('dashboard.table.pagination.prev')}
                    onclick={() => page--}
                  >
                    <ChevronLeft class="size-3.5" />
                  </Button>
                {/snippet}
              </TooltipTrigger>
              <TooltipContent>{$t('dashboard.table.pagination.prev')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    class="size-8"
                    disabled={page >= pageCount - 1}
                    aria-label={$t('dashboard.table.pagination.next')}
                    onclick={() => page++}
                  >
                    <ChevronRight class="size-3.5" />
                  </Button>
                {/snippet}
              </TooltipTrigger>
              <TooltipContent>{$t('dashboard.table.pagination.next')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    size="icon"
                    class="size-8"
                    disabled={page >= pageCount - 1}
                    aria-label={$t('dashboard.table.pagination.last')}
                    onclick={() => (page = pageCount - 1)}
                  >
                    <ChevronsRight class="size-3.5" />
                  </Button>
                {/snippet}
              </TooltipTrigger>
              <TooltipContent>{$t('dashboard.table.pagination.last')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  </Card>

  <Sheet bind:open={detailOpen}>
    <SheetContent class="gap-0 p-0 sm:max-w-md">
      {#if detailCustomer}
        {@const dc = detailCustomer}
        <SheetHeader class="space-y-0 border-b p-4">
          <div class="flex items-start gap-3">
            <Avatar size="lg" rounded="lg" class="shadow-sm ring-2 ring-background">
              <AvatarFallback class="bg-muted text-muted-foreground text-sm font-semibold">
                {initials(dc.name)}
              </AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1 space-y-1">
              <SheetTitle class="truncate text-base leading-tight" title={dc.name}>{dc.name}</SheetTitle>
              <SheetDescription class="flex items-center gap-1 text-xs">
                <Mail class="size-3" />{dc.email}
              </SheetDescription>
              <div class="flex items-center gap-1.5 pt-1">
                <Badge variant="outline" class={`gap-1 px-2 py-0.5 text-xs font-medium tracking-wide uppercase ${statusTone[dc.status]}`}>
                  <span class={`size-1.5 rounded-full ${statusDot(dc.status)}`}></span>
                  {dc.status}
                </Badge>
                <Badge variant="outline">{dc.plan}</Badge>
                <span class="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <MapPin class="size-3" />{dc.country}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div class="flex-1 overflow-y-auto">
          <div class="grid grid-cols-3 gap-px border-b bg-border">
            <div class="bg-background flex flex-col gap-1 px-4 py-3">
              <span class="text-muted-foreground inline-flex items-center gap-1 text-xs tracking-wide uppercase">
                <CreditCard class="size-3" />MRR
              </span>
              <span class="text-base font-semibold tabular-nums">{formatMoney(dc.mrr)}</span>
              {#if dc.mrr > 0}
                <span class="inline-flex items-center gap-0.5 text-xs font-medium tabular-nums text-success">
                  <ArrowUpRight class="size-2.5" />{Math.round((dc.mrr * 12) / 1000)}k ARR
                </span>
              {:else}
                <span class="text-muted-foreground text-xs">No revenue</span>
              {/if}
            </div>
            <div class="bg-background flex flex-col gap-1 px-4 py-3">
              <span class="text-muted-foreground inline-flex items-center gap-1 text-xs tracking-wide uppercase">
                <Users class="size-3" />Seats
              </span>
              <span class="text-base font-semibold tabular-nums">{dc.seats || 0}</span>
              {#if dc.seats}
                <span class="text-muted-foreground text-xs tabular-nums">${Math.round(dc.mrr / dc.seats)}/seat</span>
              {:else}
                <span class="text-muted-foreground text-xs">No seats</span>
              {/if}
            </div>
            <div class="bg-background flex flex-col gap-1 px-4 py-3">
              <span class="text-muted-foreground inline-flex items-center gap-1 text-xs tracking-wide uppercase">
                <Building2 class="size-3" />Tier
              </span>
              <span class="text-base font-semibold">{dc.plan}</span>
              <span class="text-muted-foreground text-xs">
                {dc.status === 'active' ? 'Renews monthly' : dc.status === 'trial' ? 'Trial period' : dc.status === 'invited' ? 'Awaiting accept' : 'Cancelled'}
              </span>
            </div>
          </div>

          <dl class="divide-y divide-border px-4 text-sm">
            <div class="flex items-center justify-between py-2.5">
              <dt class="text-muted-foreground text-xs">Customer ID</dt>
              <dd class="font-mono text-xs">{customerIdOf(dc)}</dd>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <dt class="text-muted-foreground text-xs">Customer since</dt>
              <dd class="text-xs tabular-nums">{dc.createdAt}</dd>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <dt class="text-muted-foreground text-xs">Last seen</dt>
              <dd class="text-xs tabular-nums">{dc.lastSeen}</dd>
            </div>
            <div class="flex items-center justify-between py-2.5">
              <dt class="text-muted-foreground text-xs">Country</dt>
              <dd class="text-xs">{dc.country}</dd>
            </div>
          </dl>

          <div class="border-t p-4">
            <div class="text-muted-foreground mb-3 inline-flex items-center gap-1 text-xs tracking-wide uppercase">
              <Activity class="size-3" />Recent activity
            </div>
            <ol class="relative space-y-3 pl-5">
              <span class="bg-border absolute top-1 bottom-1 left-2 w-px -translate-x-1/2"></span>
              {#each timelineFor(dc) as ev (ev.title)}
                {@const EvIcon = ev.icon}
                <li class="relative">
                  <span class="bg-background border-border absolute -left-5 top-0.5 inline-flex size-4 items-center justify-center rounded-full border">
                    <EvIcon class={`size-2.5 ${ev.tone}`} />
                  </span>
                  <div class="text-xs leading-tight font-medium">{ev.title}</div>
                  <div class="text-muted-foreground text-xs tabular-nums">{ev.meta}</div>
                </li>
              {/each}
            </ol>
          </div>
        </div>

        <div class="bg-background sticky bottom-0 flex items-center gap-2 border-t p-4">
          <Button size="sm" class="h-8 flex-1 text-xs">Open profile</Button>
          <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
            <Mail class="size-3.5" />Email
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              {#snippet child({ props })}
                <Button {...props} variant="outline" size="icon" class="size-8">
                  <MoreHorizontal class="size-3.5" />
                </Button>
              {/snippet}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Change plan</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => copyCustomerId(dc)}>Copy ID</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      {/if}
    </SheetContent>
  </Sheet>
</Page>
