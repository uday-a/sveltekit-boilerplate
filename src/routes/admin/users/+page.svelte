<script lang="ts">
  import { untrack } from 'svelte'
  import { toast } from 'svelte-sonner'
  import { Calendar as CalendarIcon, CloudOff, Pencil, RotateCcw, Search, ShieldAlert, Trash2, UserX, ArrowUpDown } from '@lucide/svelte'
  import { Card } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { RangeCalendar, type RangeCalendarRange } from '$lib/components/ui/range-calendar'
  import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { locale, t } from '$lib/i18n'

  // Admin users page. Port of Nuxt `admin/users.vue`: live list from
  // /api/admin/users (requireRole('admin') is the real gate), search +
  // role + joined-date filters, edit dialog, delete confirmation with undo toast.
  interface AdminUser {
    id: number
    login: string
    name: string | null
    role: string
    createdAt: string | Date
  }

  const ROLES = ['admin', 'editor', 'user'] as const

  let users = $state<AdminUser[]>([])
  let pending = $state(true)
  let forbidden = $state(false)
  let failed = $state(false)

  async function refresh() {
    pending = true
    forbidden = false
    failed = false
    const res: ApiResponse<AdminUser[]> = await apiFetch('/api/admin/users')
    if (res.ok) {
      users = res.data.map(u => ({ ...u }))
    }
    else if (res.error.code === 'FORBIDDEN') {
      forbidden = true
    }
    else {
      failed = true
    }
    pending = false
  }

  $effect(() => {
    untrack(() => void refresh())
    untrack(() => void refreshRole())
  })

  // WHY (Rule83): the 403 names the current role vs the required admin role
  // and gives a next step, instead of a bare "no permission".
  let sessionRole = $state<string | null>(null)

  async function refreshRole() {
    const res: ApiResponse<{ user: { role?: string } }> = await apiFetch('/api/me')
    if (res.ok) sessionRole = res.data.user.role ?? null
  }

  const currentRole = $derived(sessionRole ?? $t('admin.roleNames.user'))

  const description = $derived(
    forbidden || failed ? $t('admin.everyone') : $t('admin.subtitle', { count: users.length }),
  )

  // ── Filters ────────────────────────────────────────────────────────────
  let search = $state('')
  let roleFilter = $state<'all' | typeof ROLES[number]>('all')
  let joinedRange = $state<RangeCalendarRange | undefined>(undefined)
  let rangeOpen = $state(false)
  $effect(() => {
    if (joinedRange?.start && joinedRange?.end) rangeOpen = false
  })

  const rangeLabel = $derived.by(() => {
    const r = joinedRange
    if (!r?.start || !r?.end) return $t('admin.filters.joined')
    const df = new DateFormatter($locale ?? 'en', { month: 'short', day: 'numeric', year: 'numeric' })
    const tz = getLocalTimeZone()
    return `${df.format(r.start.toDate(tz))} – ${df.format(r.end.toDate(tz))}`
  })

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase()
    const r = joinedRange
    const tz = getLocalTimeZone()
    const from = r?.start ? r.start.toDate(tz).getTime() : null
    // Inclusive end: the whole of the last selected day.
    const to = r?.end ? r.end.toDate(tz).getTime() + 86_400_000 - 1 : null
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (q && !`${u.name ?? ''} ${u.login}`.toLowerCase().includes(q)) return false
      const joined = new Date(u.createdAt).getTime()
      if (from !== null && joined < from) return false
      if (to !== null && joined > to) return false
      return true
    })
  })

  const activeFilters = $derived(
    (search.trim() ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0) + (joinedRange?.start ? 1 : 0),
  )

  // WHY (Rule65): client sorting on User / Role / Joined. Default Joined desc
  // (newest first) matches how admins scan this list.
  type AdminSortKey = 'name' | 'role' | 'joined'
  let sortKey = $state<AdminSortKey>('joined')
  let sortDir = $state<'asc' | 'desc'>('desc')

  function toggleSort(key: AdminSortKey) {
    if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc'
    else {
      sortKey = key
      sortDir = key === 'joined' ? 'desc' : 'asc'
    }
  }

  function ariaSort(key: AdminSortKey): 'ascending' | 'descending' | 'none' {
    if (sortKey !== key) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  const sorted = $derived.by(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'joined') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      if (sortKey === 'role') return a.role.localeCompare(b.role) * dir
      return (a.name ?? a.login).localeCompare(b.name ?? b.login) * dir
    })
  })

  function resetFilters() {
    search = ''
    roleFilter = 'all'
    joinedRange = undefined
  }

  // ── Row actions ────────────────────────────────────────────────────────
  let editing = $state<AdminUser | null>(null)
  let formName = $state('')
  let formLogin = $state('')
  let formRole = $state('user')
  let formError = $state('')

  function openEdit(u: AdminUser) {
    editing = u
    formName = u.name ?? ''
    formLogin = u.login
    formRole = u.role
    formError = ''
  }

  function saveEdit() {
    const u = editing
    if (!u) return
    if (!formName.trim() || !formLogin.trim()) {
      formError = $t('admin.edit.required')
      return
    }
    Object.assign(u, { name: formName.trim(), login: formLogin.trim(), role: formRole })
    users = [...users]
    editing = null
    toast.success($t('admin.toast.updated', { name: u.name }))
  }

  let deleting = $state<AdminUser | null>(null)

  function confirmDelete() {
    const u = deleting
    if (!u) return
    const index = users.findIndex(x => x.id === u.id)
    users.splice(index, 1)
    users = [...users]
    deleting = null
    toast.success($t('admin.toast.deleted', { name: u.name || u.login }), {
      action: {
        label: $t('admin.toast.undo'),
        onClick: () => {
          users.splice(Math.min(index, users.length), 0, u)
          users = [...users]
          toast($t('admin.toast.restored', { name: u.name || u.login }))
        },
      },
    })
  }

  const initials = (n: string) => n.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  // SelectValue only resolves labels from mounted items (content mounts on
  // open), so controlled selects render their label as explicit children.
  const roleName = (r: string) => $t(`admin.roleNames.${r}`)
  const filterLabel = $derived(roleFilter === 'all' ? $t('admin.filters.allRoles') : roleName(roleFilter))
  const formRoleLabel = $derived(roleName(formRole))

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString($locale ?? 'en', { month: 'short', day: 'numeric', year: 'numeric' })
  }
</script>

<svelte:head>
  <title>{$t('nav.items.users')} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading title={$t('admin.title')} {description} />
  </PageHeader>

  {#if forbidden}
    <Card>
      <EmptyState
        icon={ShieldAlert}
        title={$t('admin.adminsOnly')}
        description={`${$t('admin.forbidden')} ${$t('admin.forbiddenRole', { role: currentRole })} ${$t('admin.forbiddenHelp')}`}
        role="alert"
        class="p-4"
      />
    </Card>
  {:else if failed}
    <Card>
      <EmptyState icon={CloudOff} title={$t('admin.loadFailedTitle')} description={$t('admin.loadFailed')} role="alert" class="p-4">
        <Button variant="outline" size="sm" class="mt-4" onclick={() => void refresh()}>
          {$t('settings.activity.states.retry')}
        </Button>
      </EmptyState>
    </Card>
  {:else}
    <Card>
      <!-- Filters -->
      <div class="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
        <div class="w-full sm:w-64">
          <Input
            bind:value={search}
            size="small"
            prefixIcon={Search}
            allowClear
            placeholder={$t('admin.filters.search')}
            aria-label={$t('admin.filters.search')}
          />
        </div>
        <Select bind:value={roleFilter}>
          <SelectTrigger size="sm" class="sm:w-36" aria-label={$t('admin.filters.role')}>
            <SelectValue>{filterLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{$t('admin.filters.allRoles')}</SelectItem>
            {#each ROLES as r (r)}
              <SelectItem value={r}>{$t(`admin.roleNames.${r}`)}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
        <Popover bind:open={rangeOpen}>
          <PopoverTrigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="outline"
                size="sm"
                class={['justify-start gap-2 font-normal', !joinedRange?.start && 'text-muted-foreground']}
              >
                <CalendarIcon class="size-4" aria-hidden="true" />
                {rangeLabel}
              </Button>
            {/snippet}
          </PopoverTrigger>
          <PopoverContent align="start" class="w-auto p-0">
            <RangeCalendar bind:value={joinedRange} />
          </PopoverContent>
        </Popover>
        {#if activeFilters}
          <Button variant="ghost" size="sm" class="text-muted-foreground gap-1.5" onclick={resetFilters}>
            <RotateCcw class="size-3.5" aria-hidden="true" />
            {$t('admin.filters.reset')}
          </Button>
        {/if}
        <span class="text-muted-foreground text-xs whitespace-nowrap tabular-nums sm:ml-auto">
          {$t('admin.filters.showing', { shown: filtered.length, total: users.length })}
        </span>
      </div>

      <TooltipProvider delayDuration={300}>
        <Table>
          <!-- WHY (Rule64): sticky header matches the data table. -->
          <TableHeader class="bg-background sticky top-0 z-10">
            <TableRow>
              <TableHead scope="col" aria-sort={ariaSort('name')}>
                <button
                  type="button"
                  class="hover:text-foreground inline-flex items-center gap-1 rounded-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onclick={() => toggleSort('name')}
                >
                  {$t('admin.user')}<ArrowUpDown
                    class={['size-3', sortKey === 'name' ? 'text-foreground' : 'text-muted-foreground']}
                    aria-hidden="true"
                  />
                </button>
              </TableHead>
              <TableHead scope="col" aria-sort={ariaSort('role')}>
                <button
                  type="button"
                  class="hover:text-foreground inline-flex items-center gap-1 rounded-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onclick={() => toggleSort('role')}
                >
                  {$t('admin.role')}<ArrowUpDown
                    class={['size-3', sortKey === 'role' ? 'text-foreground' : 'text-muted-foreground']}
                    aria-hidden="true"
                  />
                </button>
              </TableHead>
              <TableHead scope="col" aria-sort={ariaSort('joined')}>
                <button
                  type="button"
                  class="hover:text-foreground inline-flex items-center gap-1 rounded-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onclick={() => toggleSort('joined')}
                >
                  {$t('admin.joined')}<ArrowUpDown
                    class={['size-3', sortKey === 'joined' ? 'text-foreground' : 'text-muted-foreground']}
                    aria-hidden="true"
                  />
                </button>
              </TableHead>
              <TableHead scope="col" class="w-24 text-right">
                <span class="sr-only">{$t('admin.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#if pending}
              <TableRow>
                <TableCell colspan={4} class="text-muted-foreground text-sm">
                  {$t('admin.loading')}
                </TableCell>
              </TableRow>
            {:else if !filtered.length}
              <TableRow>
                <TableCell colspan={4}>
                  <EmptyState
                    icon={UserX}
                    title={users.length ? $t('admin.noMatchTitle') : $t('admin.empty')}
                    description={users.length ? $t('admin.noMatchDescription') : undefined}
                    class="whitespace-normal"
                  >
                    {#if activeFilters}
                      <Button variant="outline" size="sm" class="mt-4" onclick={resetFilters}>
                        {$t('admin.filters.reset')}
                      </Button>
                    {/if}
                  </EmptyState>
                </TableCell>
              </TableRow>
            {:else}
              {#each sorted as u (u.id)}
                <TableRow>
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <Avatar class="size-8">
                        <AvatarFallback class="bg-muted text-muted-foreground text-xs font-medium">
                          {initials(u.name || u.login)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div class="text-sm font-medium">{u.name || u.login}</div>
                        <div class="text-muted-foreground text-xs">@{u.login}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{$t(`admin.roleNames.${u.role}`)}</Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-xs tabular-nums">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger>
                          {#snippet child({ props })}
                            <Button
                              {...props}
                              variant="ghost"
                              size="icon"
                              class="text-muted-foreground hover:text-foreground size-8"
                              aria-label={$t('admin.editFor', { name: u.name || u.login })}
                              onclick={() => openEdit(u)}
                            >
                              <Pencil class="size-4" />
                            </Button>
                          {/snippet}
                        </TooltipTrigger>
                        <TooltipContent>{$t('admin.menu.edit')}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          {#snippet child({ props })}
                            <Button
                              {...props}
                              variant="ghost"
                              size="icon"
                              class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8"
                              aria-label={$t('admin.deleteFor', { name: u.name || u.login })}
                              onclick={() => (deleting = u)}
                            >
                              <Trash2 class="size-4" />
                            </Button>
                          {/snippet}
                        </TooltipTrigger>
                        <TooltipContent>{$t('admin.menu.delete')}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              {/each}
            {/if}
          </TableBody>
        </Table>
      </TooltipProvider>
    </Card>
  {/if}

  <!-- Edit user -->
  <Dialog open={!!editing} onOpenChange={(v) => { if (!v) editing = null }}>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{$t('admin.edit.title')}</DialogTitle>
        <DialogDescription>{$t('admin.edit.description')}</DialogDescription>
      </DialogHeader>
      <form
        id="edit-user-form"
        onsubmit={(e) => {
          e.preventDefault()
          saveEdit()
        }}
      >
        <div class="grid gap-4 py-1">
          <div class="grid gap-2">
            <Label for="edit-name">{$t('admin.edit.name')}</Label>
            <Input id="edit-name" bind:value={formName} autocomplete="off" />
          </div>
          <div class="grid gap-2">
            <Label for="edit-login">{$t('admin.edit.username')}</Label>
            <Input id="edit-login" bind:value={formLogin} autocomplete="off" />
          </div>
          <div class="grid gap-2">
            <Label for="edit-role">{$t('admin.role')}</Label>
              <Select bind:value={formRole}>
                <SelectTrigger id="edit-role">
                  <SelectValue>{formRoleLabel}</SelectValue>
                </SelectTrigger>
              <SelectContent>
                {#each ROLES as r (r)}
                  <SelectItem value={r}>{$t(`admin.roleNames.${r}`)}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>
          {#if formError}
            <p class="text-destructive text-sm" role="alert">{formError}</p>
          {/if}
        </div>
      </form>
      <DialogFooter>
        <Button variant="outline" onclick={() => (editing = null)}>{$t('admin.edit.cancel')}</Button>
        <Button type="submit" form="edit-user-form">{$t('admin.edit.save')}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete confirmation -->
  <Dialog open={!!deleting} onOpenChange={(v) => { if (!v) deleting = null }}>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{$t('admin.delete.title', { name: (deleting?.name || deleting?.login) ?? '' })}</DialogTitle>
        <DialogDescription>{$t('admin.delete.description')}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onclick={() => (deleting = null)}>{$t('admin.edit.cancel')}</Button>
        <Button variant="destructive" onclick={confirmDelete}>
          <Trash2 class="size-4" aria-hidden="true" />
          {$t('admin.delete.confirm')}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</Page>
