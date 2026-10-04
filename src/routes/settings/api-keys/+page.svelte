<script lang="ts">
  import { untrack } from 'svelte'
  import { AlertCircle, AlertTriangle, Check, CloudOff, Copy, KeyRound, Loader2, Plus, Trash2 } from '@lucide/svelte'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table'
  import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { page } from '$app/state'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { locale, t } from '$lib/i18n'

  const title = $derived(routeLabel(page.url.pathname, $t))

  // API keys settings page. Port of Nuxt `settings/api-keys.vue`:
  // list / create (raw key shown once) / revoke with a designed dialog.
  interface ApiKeyRow {
    id: number
    name: string
    prefix: string
    scopes: string
    lastUsedAt: string | null
    expiresAt: string | null
    revokedAt: string | null
    createdAt: string
  }

  let keys = $state<ApiKeyRow[]>([])
  let pending = $state(true)
  let fetchFailed = $state(false)

  async function refresh() {
    pending = true
    fetchFailed = false
    const res: ApiResponse<{ keys: ApiKeyRow[] }> = await apiFetch('/api/keys')
    if (res.ok) keys = res.data.keys
    else fetchFailed = true
    pending = false
  }

  $effect(() => {
    untrack(() => void refresh())
  })

  // Create-form state. Scope/expiry selects bind strings; scopes are split
  // into the array the POST schema expects at submit time.
  let formName = $state('')
  let formScope = $state('read')
  let formExpiry = $state('90')
  let creating = $state(false)
  let createError = $state<string | null>(null)

  // Show-raw-once dialog state. rawKey lives only in memory and is cleared
  // the moment the dialog closes — refresh the page and it's gone for good.
  let showRaw = $state(false)
  let rawKey = $state<string | null>(null)
  let copied = $state(false)

  let revokingId = $state<number | null>(null)
  let actionError = $state<string | null>(null)

  function scopeBadges(scopes: string): string[] {
    return scopes.split(' ').filter(Boolean)
  }

  function fmtDate(value: string | null): string {
    if (!value) return $t('settings.apikeys.never')
    return new Date(value).toLocaleDateString($locale ?? 'en', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  async function createKey(e: SubmitEvent) {
    e.preventDefault()
    if (!formName.trim() || creating) return
    creating = true
    createError = null
    const res: ApiResponse<{ key: ApiKeyRow, rawKey: string }> = await apiFetch('/api/keys', {
      method: 'POST',
      body: JSON.stringify({
        name: formName.trim(),
        scopes: formScope.split(' '),
        ...(formExpiry === 'never' ? {} : { expiresInDays: Number(formExpiry) }),
      }),
    })
    creating = false
    if (!res.ok) {
      createError = res.error.message
      return
    }
    rawKey = res.data.rawKey
    showRaw = true
    copied = false
    formName = ''
    await refresh()
  }

  // Key awaiting confirmation in the revoke dialog. Same pattern as
  // delete-user: a designed dialog with the consequence spelled out,
  // not window.confirm().
  let revokeTarget = $state<ApiKeyRow | null>(null)

  async function revokeKey(k: ApiKeyRow) {
    if (revokingId !== null) return
    revokeTarget = null
    revokingId = k.id
    actionError = null
    const res: ApiResponse<{ revoked: number }> = await apiFetch(`/api/keys/${k.id}`, {
      method: 'DELETE',
    })
    revokingId = null
    if (!res.ok) {
      actionError = res.error.message
      return
    }
    await refresh()
  }

  async function copyRaw() {
    if (!rawKey) return
    try {
      await navigator.clipboard.writeText(rawKey)
    }
    catch {
      // Clipboard API unavailable (permissions, insecure context) — fall
      // back to the legacy execCommand path.
      const ta = document.createElement('textarea')
      ta.value = rawKey
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    copied = true
    setTimeout(() => {
      copied = false
    }, 2000)
  }

  function closeRaw() {
    showRaw = false
    rawKey = null
    copied = false
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description={$t('settings.apikeys.description')} />
  </PageHeader>

  <PageBody class="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">{$t('settings.apikeys.createTitle')}</CardTitle>
        <CardDescription>{$t('settings.apikeys.createDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-3 sm:grid-cols-[1fr_170px_150px_auto] sm:items-end" onsubmit={createKey}>
          <div class="grid gap-2">
            <Label for="ak-name">{$t('settings.apikeys.nameLabel')}</Label>
            <Input
              id="ak-name"
              bind:value={formName}
              placeholder={$t('settings.apikeys.namePlaceholder')}
              maxlength={64}
            />
          </div>
          <div class="grid gap-2">
            <Label id="ak-scope-label">{$t('settings.apikeys.scopeLabel')}</Label>
            <Select bind:value={formScope} aria-labelledby="ak-scope-label">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="read">{$t('settings.apikeys.scopeRead')}</SelectItem>
                <SelectItem value="read write">{$t('settings.apikeys.scopeReadWrite')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label id="ak-expiry-label">{$t('settings.apikeys.expiryLabel')}</Label>
            <Select bind:value={formExpiry} aria-labelledby="ak-expiry-label">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">{$t('settings.apikeys.expiry30')}</SelectItem>
                <SelectItem value="90">{$t('settings.apikeys.expiry90')}</SelectItem>
                <SelectItem value="never">{$t('settings.apikeys.expiryNever')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={creating || !formName.trim()}>
            {#if creating}
              <Loader2 class="size-4 animate-spin" />
            {:else}
              <Plus class="size-4" />
            {/if}
            {creating ? $t('settings.apikeys.submitting') : $t('settings.apikeys.submit')}
          </Button>
        </form>
        {#if createError}
          <div class="text-destructive mt-3 flex items-center gap-2 text-sm">
            <AlertCircle class="size-4" />
            {createError}
          </div>
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">{$t('settings.apikeys.listTitle')}</CardTitle>
        <CardDescription>{$t('settings.apikeys.listDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {#if fetchFailed}
          <EmptyState
            icon={CloudOff}
            title="Couldn't load API keys"
            description="Something went wrong on our side. Please try again."
            role="alert"
            class="py-4"
          >
            <Button variant="outline" size="sm" class="mt-4" onclick={() => void refresh()}>
              {$t('settings.activity.states.retry')}
            </Button>
          </EmptyState>
        {:else if pending}
          <div class="text-muted-foreground flex items-center gap-2 py-4 text-sm">
            <Loader2 class="size-4 animate-spin" aria-hidden="true" />
            {$t('settings.apikeys.loading')}
          </div>
        {:else if !keys.length}
          <EmptyState
            icon={KeyRound}
            title={$t('settings.apikeys.emptyTitle')}
            description={$t('settings.apikeys.emptyDescription')}
            class="py-4"
          />
        {:else}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{$t('settings.apikeys.colName')}</TableHead>
                <TableHead scope="col">{$t('settings.apikeys.colKey')}</TableHead>
                <TableHead scope="col">{$t('settings.apikeys.colScopes')}</TableHead>
                <TableHead scope="col" class="tabular-nums">{$t('settings.apikeys.colCreated')}</TableHead>
                <TableHead scope="col" class="tabular-nums">{$t('settings.apikeys.colExpires')}</TableHead>
                <TableHead scope="col" class="tabular-nums">{$t('settings.apikeys.colLastUsed')}</TableHead>
                <TableHead scope="col" class="text-right">{$t('settings.apikeys.colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each keys as k (k.id)}
                <TableRow>
                  <TableCell class="font-medium">
                    <span class="mr-2">{k.name}</span>
                    {#if k.revokedAt}
                      <Badge variant="secondary">{$t('settings.apikeys.revoked')}</Badge>
                    {/if}
                  </TableCell>
                  <TableCell>
                    <code class="font-mono text-xs">{k.prefix}…</code>
                  </TableCell>
                  <TableCell>
                    <div class="flex gap-1">
                      {#each scopeBadges(k.scopes) as s (s)}
                        <Badge variant="secondary">{s}</Badge>
                      {/each}
                    </div>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-xs tabular-nums">{fmtDate(k.createdAt)}</TableCell>
                  <TableCell class="text-muted-foreground text-xs tabular-nums">{fmtDate(k.expiresAt)}</TableCell>
                  <TableCell class="text-muted-foreground text-xs tabular-nums">
                    {k.lastUsedAt ? fmtDate(k.lastUsedAt) : $t('settings.apikeys.neverUsed')}
                  </TableCell>
                  <TableCell class="text-right">
                    {#if !k.revokedAt}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={$t('settings.apikeys.revokeAria', { name: k.name })}
                        disabled={revokingId === k.id}
                        onclick={() => (revokeTarget = k)}
                      >
                        {#if revokingId === k.id}
                          <Loader2 class="size-4 animate-spin" />
                        {:else}
                          <Trash2 class="text-destructive size-4" />
                        {/if}
                      </Button>
                    {/if}
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>

        {/if}

        {#if actionError}
          <div class="text-destructive mt-3 flex items-center gap-2 text-sm">
            <AlertCircle class="size-4" />
            {actionError}
          </div>
        {/if}
      </CardContent>
    </Card>

    <Dialog bind:open={showRaw} onOpenChange={(v) => { if (!v) closeRaw() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{$t('settings.apikeys.rawTitle')}</DialogTitle>
          <DialogDescription>{$t('settings.apikeys.rawDescription')}</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-1">
          <div class="bg-muted flex items-center gap-2 rounded-md border px-3 py-2">
            <code class="flex-1 font-mono text-xs break-all">{rawKey}</code>
            <Button variant="outline" size="sm" class="shrink-0" onclick={copyRaw}>
              {#if copied}
                <Check class="size-4" />
              {:else}
                <Copy class="size-4" />
              {/if}
              {copied ? $t('settings.apikeys.rawCopied') : $t('settings.apikeys.rawCopy')}
            </Button>
          </div>
          <div class="border-warning/30 bg-warning/10 text-warning flex items-start gap-2 rounded-md border px-3 py-2">
            <AlertTriangle class="size-4 shrink-0" aria-hidden="true" />
            <p class="text-xs">{$t('settings.apikeys.rawWarning')}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onclick={closeRaw}>{$t('settings.apikeys.rawDone')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Revoke confirmation -->
    <Dialog open={!!revokeTarget} onOpenChange={(v) => { if (!v) revokeTarget = null }}>
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{$t('settings.apikeys.revokeTitle', { name: revokeTarget?.name ?? '' })}</DialogTitle>
          <DialogDescription>{$t('settings.apikeys.revokeDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onclick={() => (revokeTarget = null)}>
            {$t('settings.apikeys.revokeCancel')}
          </Button>
          <Button variant="destructive" onclick={() => revokeTarget && void revokeKey(revokeTarget)}>
            <Trash2 class="size-4" aria-hidden="true" />
            {$t('settings.apikeys.revoke')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </PageBody>
</Page>
