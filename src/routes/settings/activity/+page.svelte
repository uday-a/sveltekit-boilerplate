<script lang="ts">
  import { untrack } from 'svelte'
  import { Activity as ActivityIcon, CloudOff, Loader2, LogIn, FolderPlus, MessageSquare, Search, Tag, UserPlus } from '@lucide/svelte'
  import { Card } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { page } from '$app/state'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { locale, t } from '$lib/i18n'

  const title = $derived(routeLabel(page.url.pathname, $t))

  // Audit-log settings page. Port of Nuxt `settings/activity.vue`:
  // the action filter is pushed to the server (?action= substring match);
  // the entity filter is applied client-side.
  interface ActivityItem {
    id: number
    userId: number | null
    action: string
    entity: string | null
    entityId: string | null
    metadata: Record<string, unknown> | null
    createdAt: string | Date
    actorEmail: string | null
  }

  let actionQuery = $state('')
  let entityQuery = $state('')

  let items = $state<ActivityItem[]>([])
  let pending = $state(true)
  let loadError = $state(false)

  // Debounced server fetch on the action filter (nuxt useFetch ?action= port).
  let debounce: ReturnType<typeof setTimeout> | null = null

  async function load() {
    pending = true
    loadError = false
    const q = actionQuery.trim() ? `?action=${encodeURIComponent(actionQuery.trim())}` : ''
    const res: ApiResponse<{ items: ActivityItem[], total: number }> = await apiFetch(`/api/activity${q}`)
    if (res.ok) items = res.data.items
    else loadError = true
    pending = false
  }

  function scheduleLoad() {
    if (debounce) clearTimeout(debounce)
    debounce = setTimeout(() => void load(), actionQuery ? 300 : 0)
  }

  $effect(() => {
    untrack(() => void load())
  })

  const filtered = $derived.by(() => {
    const needle = entityQuery.trim().toLowerCase()
    if (!needle) return items
    return items.filter(item =>
      item.entity?.toLowerCase().includes(needle)
      || item.entityId?.toLowerCase().includes(needle),
    )
  })

  const isFiltering = $derived(Boolean(actionQuery.trim() || entityQuery.trim()))

  function clearFilters() {
    actionQuery = ''
    entityQuery = ''
    void load()
  }

  function actionIcon(action: string) {
    if (action.startsWith('auth.')) return LogIn
    if (action.startsWith('projects.')) return FolderPlus
    if (action.startsWith('feedback.')) return MessageSquare
    if (action.startsWith('team.')) return UserPlus
    return ActivityIcon
  }

  function entityLabel(item: ActivityItem): string {
    if (!item.entity) return '—'
    return item.entityId ? `${item.entity} #${item.entityId}` : item.entity
  }

  function formatFull(value: string | Date): string {
    return new Date(value).toLocaleString($locale ?? 'en', { dateStyle: 'medium', timeStyle: 'short' })
  }

  function timeAgo(value: string | Date): string {
    const date = new Date(value)
    const diffMs = date.getTime() - Date.now()
    const rtf = new Intl.RelativeTimeFormat($locale ?? 'en', { numeric: 'auto' })
    const absSec = Math.abs(diffMs) / 1000
    if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), 'second')
    const mins = Math.round(diffMs / 60000)
    if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
    const hours = Math.round(diffMs / 3600000)
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
    const days = Math.round(diffMs / 86400000)
    if (Math.abs(days) < 30) return rtf.format(days, 'day')
    const months = Math.round(diffMs / 2592000000)
    if (Math.abs(months) < 12) return rtf.format(months, 'month')
    return rtf.format(Math.round(diffMs / 31536000000), 'year')
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description={$t('settings.activity.description')} />
  </PageHeader>

  <PageBody class="space-y-4">
    <Card>
      <!-- Filters -->
      <div class="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
        <div class="w-full sm:w-64">
          <Input
            bind:value={actionQuery}
            onValueChange={scheduleLoad}
            size="small"
            prefixIcon={Search}
            placeholder={$t('settings.activity.filters.action')}
            aria-label={$t('settings.activity.filters.action')}
          />
        </div>
        <div class="w-full sm:w-64">
          <Input
            bind:value={entityQuery}
            size="small"
            prefixIcon={Tag}
            placeholder={$t('settings.activity.filters.entity')}
            aria-label={$t('settings.activity.filters.entity')}
          />
        </div>
      </div>

      {#if pending}
        <div class="text-muted-foreground flex items-center gap-2 px-4 py-4 text-sm">
          <Loader2 class="size-4 animate-spin" />
          {$t('settings.activity.states.loading')}
        </div>
      {:else if loadError}
        <EmptyState
          icon={CloudOff}
          title={$t('settings.activity.states.error')}
          description="Something went wrong on our side. Please try again."
          role="alert"
          class="p-4"
        >
          <Button variant="outline" size="sm" class="mt-4" onclick={() => void load()}>
            {$t('settings.activity.states.retry')}
          </Button>
        </EmptyState>
      {:else if !filtered.length && isFiltering}
        <!-- Filters active: say so and offer the way out. -->
        <EmptyState
          icon={Search}
          title={$t('settings.activity.states.noMatchTitle')}
          description={$t('settings.activity.states.noMatchDescription')}
          class="p-4"
        >
          <Button variant="outline" size="sm" class="mt-4" onclick={clearFilters}>
            {$t('settings.activity.states.clearFilters')}
          </Button>
        </EmptyState>
      {:else if !filtered.length}
        <!-- Nothing recorded: explain why, so support can tell "empty" from "broken". -->
        <EmptyState
          icon={ActivityIcon}
          title={$t('settings.activity.states.empty')}
          description={$t('settings.activity.states.emptyDescription')}
          class="p-4"
        />
      {:else}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{$t('settings.activity.table.event')}</TableHead>
              <TableHead scope="col">{$t('settings.activity.table.actor')}</TableHead>
              <TableHead scope="col">{$t('settings.activity.table.entity')}</TableHead>
              <TableHead scope="col" class="text-right">{$t('settings.activity.table.time')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each filtered as item (item.id)}
              {@const ActionIcon = actionIcon(item.action)}
              <TableRow>
                <TableCell>
                  <span class="flex items-center gap-2 text-sm font-medium">
                    <ActionIcon class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                    <span class="font-mono text-xs">{item.action}</span>
                  </span>
                </TableCell>
                <TableCell class="text-muted-foreground max-w-55 truncate text-xs" title={item.actorEmail ?? undefined}>
                  {item.actorEmail ?? $t('settings.activity.feed.deletedUser')}
                </TableCell>
                <TableCell class="text-muted-foreground text-xs">{entityLabel(item)}</TableCell>
                <TableCell class="text-right">
                  <time title={formatFull(item.createdAt)} class="text-muted-foreground text-xs tabular-nums">
                    {timeAgo(item.createdAt)}
                  </time>
                </TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      {/if}
    </Card>
  </PageBody>
</Page>
