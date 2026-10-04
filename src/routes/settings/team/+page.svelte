<script lang="ts">
  import { untrack } from 'svelte'
  import { toast } from 'svelte-sonner'
  import { AlertCircle, Calendar as CalendarIcon, CheckCircle2, CloudOff, Loader2, Pencil, RotateCcw, Search, Trash2, UserPlus, UserX } from '@lucide/svelte'
  import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { RangeCalendar, type RangeCalendarRange } from '$lib/components/ui/range-calendar'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { page } from '$app/state'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { locale, t } from '$lib/i18n'
  import type { PageData } from './$types'

  const title = $derived(routeLabel(page.url.pathname, $t))

  // Team settings page. Port of Nuxt `settings/team.vue`: live members +
  // invites from /api/team/*, search + role filters, edit / remove row
  // actions (local, with undo toast), invite dialog with client-side email
  // check, resend + revoke, joined-date range filter.
  let { data }: { data: PageData } = $props()

  interface Member {
    id: number
    name: string | null
    email: string
    role: string
    avatarUrl: string | null
    createdAt: string | Date
  }

  interface PendingInvite {
    id: number
    email: string
    role: string
    invitedBy: number | null
    expiresAt: string | Date
    createdAt: string | Date
  }

  const canInvite = $derived(data.user?.role === 'admin' || data.user?.role === 'editor')

  let members = $state<Member[]>([])
  let membersPending = $state(false)
  let membersFailed = $state(false)
  let pendingInvites = $state<PendingInvite[]>([])
  let invitesPending = $state(false)
  let invitesFailed = $state(false)
  let invitesForbidden = $state(false)

  function applyMembers(res: ApiResponse<{ members: Member[] }>) {
    membersFailed = !res.ok
    if (res.ok) members = res.data.members.map(m => ({ ...m }))
  }

  function applyInvites(res: ApiResponse<{ invites: PendingInvite[] }>) {
    invitesFailed = false
    invitesForbidden = false
    if (res.ok) pendingInvites = res.data.invites
    // A 403 on the invites endpoint just means the viewer isn't
    // admin/editor — not a failure. Show the viewer note instead.
    else if (res.error.code === 'FORBIDDEN') invitesForbidden = true
    else invitesFailed = true
  }

  // First paint comes from +page.server.ts (SSR'd lists, no empty flash);
  // the refresh functions below re-fetch after mutations.
  untrack(() => {
    applyMembers(data.membersRes as ApiResponse<{ members: Member[] }>)
    applyInvites(data.invitesRes as ApiResponse<{ invites: PendingInvite[] }>)
  })

  async function refreshMembers() {
    membersPending = true
    applyMembers(await apiFetch('/api/team/members'))
    membersPending = false
  }

  async function refreshInvites() {
    invitesPending = true
    applyInvites(await apiFetch('/api/team/invites'))
    invitesPending = false
  }

  const headerDescription = $derived(
    membersFailed
      ? 'Members, roles, and pending invitations.'
      : invitesForbidden || invitesFailed
        ? `${members.length} members`
        : $t('settings.team.subtitle', { members: members.length, pending: pendingInvites.length }),
  )

  const ROLES = ['admin', 'editor', 'user'] as const

  // ── Filters ────────────────────────────────────────────────────────────
  let query = $state('')
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

  const filteredMembers = $derived.by(() => {
    const q = query.trim().toLowerCase()
    const r = joinedRange
    const tz = getLocalTimeZone()
    const from = r?.start ? r.start.toDate(tz).getTime() : null
    // Inclusive end: the whole of the last selected day.
    const to = r?.end ? r.end.toDate(tz).getTime() + 86_400_000 - 1 : null
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false
      if (q && !`${m.name ?? ''} ${m.email}`.toLowerCase().includes(q)) return false
      const joined = new Date(m.createdAt).getTime()
      if (from !== null && joined < from) return false
      if (to !== null && joined > to) return false
      return true
    })
  })

  const activeFilters = $derived(
    (query.trim() ? 1 : 0) + (roleFilter !== 'all' ? 1 : 0) + (joinedRange?.start ? 1 : 0),
  )

  function resetFilters() {
    query = ''
    roleFilter = 'all'
    joinedRange = undefined
  }

  // ── Row actions ────────────────────────────────────────────────────────
  let editing = $state<Member | null>(null)
  let editName = $state('')
  let editEmail = $state('')
  let editRole = $state('user')
  let editError = $state('')

  function openEdit(m: Member) {
    editing = m
    editName = m.name ?? ''
    editEmail = m.email
    editRole = m.role
    editError = ''
  }

  function saveEdit() {
    const m = editing
    if (!m) return
    if (!editName.trim() || !/^\S+@\S+\.\S+$/.test(editEmail.trim())) {
      editError = $t('settings.team.editInvalid')
      return
    }
    Object.assign(m, { name: editName.trim(), email: editEmail.trim(), role: editRole })
    members = [...members]
    editing = null
    toast.success($t('admin.toast.updated', { name: displayName(m) }))
  }

  let removing = $state<Member | null>(null)

  function confirmRemove() {
    const m = removing
    if (!m) return
    const index = members.findIndex(x => x.id === m.id)
    members.splice(index, 1)
    members = [...members]
    removing = null
    toast.success($t('settings.team.removed', { name: displayName(m) }), {
      action: {
        label: $t('admin.toast.undo'),
        onClick: () => {
          members.splice(Math.min(index, members.length), 0, m)
          members = [...members]
          toast($t('admin.toast.restored', { name: displayName(m) }))
        },
      },
    })
  }

  function displayName(m: Member) {
    return m.name || m.email.split('@')[0] || m.email
  }

  const initials = (n: string) => n.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  const roleName = (r: string) => $t(`admin.roleNames.${r}`)

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString($locale ?? 'en', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Invite dialog state.
  let dialogOpen = $state(false)
  let inviteEmail = $state('')
  let inviteRole = $state('user')
  let submitState = $state<'idle' | 'submitting' | 'error'>('idle')
  let submitError = $state<string | null>(null)
  let notice = $state<string | null>(null)
  let revokingId = $state<number | null>(null)
  let resendingEmail = $state<string | null>(null)
  let revokeError = $state<string | null>(null)

  // Catch obvious typos before the round-trip; the server still validates.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  async function sendInvite() {
    if (!EMAIL_RE.test(inviteEmail.trim())) {
      submitError = $t('settings.team.invalidEmail')
      submitState = 'error'
      return
    }
    submitState = 'submitting'
    submitError = null
    const res: ApiResponse<{ invite: PendingInvite }> = await apiFetch('/api/team/invites', {
      method: 'POST',
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })

    if (!res.ok) {
      submitError = res.error.message
      submitState = 'error'
      return
    }

    inviteEmail = ''
    inviteRole = 'user'
    submitState = 'idle'
    dialogOpen = false
    notice = $t('settings.team.inviteSent', { email: res.data.invite.email })
    await refreshInvites()
  }

  async function revokeInvite(id: number) {
    revokingId = id
    notice = null
    const res: ApiResponse<{ revoked: number }> = await apiFetch(`/api/team/invites/${id}`, {
      method: 'DELETE',
    })
    revokingId = null

    if (!res.ok) {
      notice = null
      submitError = null
      // Surface revoke failures inline via the pending card error slot.
      revokeError = res.error.message
      return
    }
    revokeError = null
    await refreshInvites()
  }

  // Resend = revoke the stale row, then issue a fresh token via POST, so a
  // given email never stacks duplicate pending rows.
  async function resendInvite(invite: PendingInvite) {
    resendingEmail = invite.email
    notice = null
    revokeError = null
    await apiFetch(`/api/team/invites/${invite.id}`, { method: 'DELETE' })
    const res: ApiResponse<{ invite: PendingInvite }> = await apiFetch('/api/team/invites', {
      method: 'POST',
      body: JSON.stringify({ email: invite.email, role: invite.role }),
    })
    resendingEmail = null

    if (!res.ok) {
      revokeError = res.error.message
      await refreshInvites()
      return
    }
    notice = $t('settings.team.inviteSent', { email: invite.email })
    await refreshInvites()
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description={headerDescription} />
    {#snippet actions()}
      {#if canInvite && !invitesForbidden}
        <Dialog bind:open={dialogOpen}>
          <DialogTrigger>
            {#snippet child({ props })}
              <Button {...props} size="sm">
                <UserPlus class="size-4" aria-hidden="true" /> {$t('settings.team.invite')}
              </Button>
            {/snippet}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{$t('settings.team.dialogTitle')}</DialogTitle>
              <DialogDescription>{$t('settings.team.dialogDescription')}</DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-1">
              <div class="grid gap-2">
                <Label for="invite-email">{$t('settings.team.emailLabel')}</Label>
                <Input
                  id="invite-email"
                  bind:value={inviteEmail}
                  type="email"
                  placeholder={$t('settings.team.emailPlaceholder')}
                />
              </div>
              <div class="grid gap-2">
                <Label for="invite-role">{$t('settings.team.roleLabel')}</Label>
                <Select bind:value={inviteRole}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{roleName('user')}</SelectItem>
                    <SelectItem value="editor">{roleName('editor')}</SelectItem>
                    <SelectItem value="admin">{roleName('admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {#if submitError}
                <div class="text-destructive flex items-center gap-2 text-sm">
                  <AlertCircle class="size-4" aria-hidden="true" />
                  {submitError}
                </div>
              {/if}
            </div>
            <DialogFooter>
              <Button variant="outline" disabled={submitState === 'submitting'} onclick={() => (dialogOpen = false)}>
                {$t('settings.team.cancel')}
              </Button>
              <Button disabled={submitState === 'submitting' || !inviteEmail} onclick={sendInvite}>
                {#if submitState === 'submitting'}
                  <Loader2 class="size-4 animate-spin" />
                {/if}
                {submitState === 'submitting' ? $t('settings.team.sending') : $t('settings.team.send')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      {/if}
    {/snippet}
  </PageHeader>

  <PageBody class="space-y-4">
    {#if notice}
      <div
        class="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        role="status"
      >
        <CheckCircle2 class="size-4" aria-hidden="true" />
        {notice}
      </div>
    {/if}

    {#if membersFailed}
      <Card>
        <EmptyState icon={CloudOff} title="Couldn't load the team" description={$t('settings.team.loadFailed')} role="alert" class="p-4">
          <Button variant="outline" size="sm" class="mt-4" onclick={() => void refreshMembers()}>
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
              bind:value={query}
              size="small"
              prefixIcon={Search}
              allowClear
              placeholder={$t('settings.team.search')}
              aria-label={$t('settings.team.search')}
            />
          </div>
          <Select bind:value={roleFilter}>
            <SelectTrigger size="sm" class="sm:w-36" aria-label={$t('admin.filters.role')}>
              <SelectValue />
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
            {$t('admin.filters.showing', { shown: filteredMembers.length, total: members.length })}
          </span>
        </div>

        <TooltipProvider delayDuration={300}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{$t('settings.team.member')}</TableHead>
                <TableHead scope="col">{$t('settings.team.role')}</TableHead>
                <TableHead scope="col">{$t('settings.team.status')}</TableHead>
                <TableHead scope="col">{$t('settings.team.joined')}</TableHead>
                <TableHead scope="col" class="w-24 text-right">
                  <span class="sr-only">{$t('admin.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#if membersPending}
                <TableRow>
                  <TableCell colspan={5} class="text-muted-foreground text-sm">
                    {$t('settings.team.loading')}
                  </TableCell>
                </TableRow>
              {:else if !filteredMembers.length}
                <TableRow>
                  <TableCell colspan={5}>
                    <EmptyState
                      icon={UserX}
                      title={members.length ? $t('admin.noMatchTitle') : $t('settings.team.emptyMembers')}
                      description={members.length ? $t('admin.noMatchDescription') : undefined}
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
                {#each filteredMembers as m (m.id)}
                  <TableRow>
                    <TableCell>
                      <div class="flex items-center gap-3">
                        <Avatar class="size-8">
                          <AvatarFallback class="bg-muted text-muted-foreground text-xs font-medium">
                            {initials(displayName(m))}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div class="text-sm font-medium">{displayName(m)}</div>
                          <div class="text-muted-foreground text-xs">{m.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{$t(`admin.roleNames.${m.role}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span class="flex items-center gap-1.5 text-xs">
                        <span class="bg-success size-1.5 rounded-full" aria-hidden="true"></span>
                        {$t('settings.team.active')}
                      </span>
                    </TableCell>
                    <TableCell class="text-muted-foreground text-xs tabular-nums">
                      {formatDate(m.createdAt)}
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
                                aria-label={$t('admin.editFor', { name: displayName(m) })}
                                onclick={() => openEdit(m)}
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
                                aria-label={$t('settings.team.removeFor', { name: displayName(m) })}
                                onclick={() => (removing = m)}
                              >
                                <Trash2 class="size-4" />
                              </Button>
                            {/snippet}
                          </TooltipTrigger>
                          <TooltipContent>{$t('settings.team.remove')}</TooltipContent>
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

    {#if canInvite && !invitesForbidden}
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{$t('settings.team.pendingTitle')}</CardTitle>
          <CardDescription>{$t('settings.team.pendingDescription')}</CardDescription>
        </CardHeader>
        <CardContent class="divide-y">
          {#if invitesFailed}
            <div class="flex flex-wrap items-center justify-between gap-4 py-3 first:pt-0">
              <span class="text-muted-foreground text-sm">Couldn't load pending invites.</span>
              <Button variant="outline" size="sm" onclick={() => void refreshInvites()}>
                {$t('settings.activity.states.retry')}
              </Button>
            </div>
          {:else if invitesPending}
            <div class="text-muted-foreground py-3 text-sm first:pt-0">{$t('settings.team.loading')}</div>
          {:else if !pendingInvites.length}
            <div class="text-muted-foreground py-3 text-sm first:pt-0">{$t('settings.team.emptyPending')}</div>
          {:else}
            {#each pendingInvites as p (p.id)}
              <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                <div class="min-w-0 space-y-0.5">
                  <p class="truncate text-sm font-medium">{p.email}</p>
                  <p class="text-muted-foreground text-xs tabular-nums">
                    {$t('settings.team.invitedAs', { role: roleName(p.role) })} · {$t('settings.team.expires', { date: formatDate(p.expiresAt) })}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resendingEmail === p.email || revokingId === p.id}
                    onclick={() => void resendInvite(p)}
                  >
                    {#if resendingEmail === p.email}
                      <Loader2 class="size-4 animate-spin" aria-hidden="true" />
                    {/if}
                    {$t('settings.team.resend')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive"
                    disabled={revokingId === p.id || resendingEmail === p.email}
                    onclick={() => void revokeInvite(p.id)}
                  >
                    {#if revokingId === p.id}
                      <Loader2 class="size-4 animate-spin" aria-hidden="true" />
                    {/if}
                    {$t('settings.team.revoke')}
                  </Button>
                </div>
              </div>
            {/each}
          {/if}
          {#if revokeError}
            <div class="text-destructive flex items-center gap-2 pt-3 text-sm" role="alert">
              <AlertCircle class="size-4" aria-hidden="true" />
              {revokeError}
            </div>
          {/if}
        </CardContent>
      </Card>
    {:else}
      <p class="text-muted-foreground text-xs">{$t('settings.team.viewerNote')}</p>
    {/if}

    <!-- Edit member -->
    <Dialog open={!!editing} onOpenChange={(v) => { if (!v) editing = null }}>
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{$t('settings.team.editTitle')}</DialogTitle>
          <DialogDescription>{$t('settings.team.editDescription')}</DialogDescription>
        </DialogHeader>
        <form
          id="edit-member-form"
          onsubmit={(e) => {
            e.preventDefault()
            saveEdit()
          }}
        >
          <div class="grid gap-4 py-1">
            <div class="grid gap-2">
              <Label for="edit-member-name">{$t('admin.edit.name')}</Label>
              <Input id="edit-member-name" bind:value={editName} autocomplete="off" />
            </div>
            <div class="grid gap-2">
              <Label for="edit-member-email">{$t('settings.team.emailLabel')}</Label>
              <Input id="edit-member-email" bind:value={editEmail} type="email" autocomplete="off" />
            </div>
            <div class="grid gap-2">
              <Label for="edit-member-role">{$t('settings.team.role')}</Label>
              <Select bind:value={editRole}>
                <SelectTrigger id="edit-member-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {#each ROLES as r (r)}
                    <SelectItem value={r}>{$t(`admin.roleNames.${r}`)}</SelectItem>
                  {/each}
                </SelectContent>
              </Select>
            </div>
            {#if editError}
              <p class="text-destructive text-sm" role="alert">{editError}</p>
            {/if}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onclick={() => (editing = null)}>{$t('admin.edit.cancel')}</Button>
          <Button type="submit" form="edit-member-form">{$t('admin.edit.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Remove confirmation -->
    <Dialog open={!!removing} onOpenChange={(v) => { if (!v) removing = null }}>
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{$t('settings.team.removeTitle', { name: removing ? displayName(removing) : '' })}</DialogTitle>
          <DialogDescription>{$t('settings.team.removeDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onclick={() => (removing = null)}>{$t('admin.edit.cancel')}</Button>
          <Button variant="destructive" onclick={confirmRemove}>
            <Trash2 class="size-4" aria-hidden="true" />
            {$t('settings.team.remove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </PageBody>
</Page>
