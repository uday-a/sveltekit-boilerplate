<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { SearchX } from '@lucide/svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { Button } from '$lib/components/ui/button'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import FoundationsPanel from '$lib/components/ui-kit/FoundationsPanel.svelte'
  import FinderToolbar, { type FinderFilters } from '$lib/components/ui-kit/FinderToolbar.svelte'
  import CatalogCard, { type DemoLoader, type UsedInLink } from '$lib/components/ui-kit/CatalogCard.svelte'
  import {
    buildCatalog,
    CATALOG_CATEGORIES,
    CATALOG_STATUSES,
    demoNameFor,
    searchCatalog,
    type CatalogCategory,
    type CatalogStatus,
    type SnapshotItem,
  } from '$lib/data/ui-catalog/catalog'
  import { CURATED, CURATED_BLOCKS } from '$lib/data/ui-catalog/curated'
  import snapshot from '$lib/data/ui-catalog/registry.snapshot.json'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'

  // Port of nuxt `app/pages/dashboard/ui-kit.vue`: a searchable catalog of
  // the registry, with live demos for what this app has installed.
  let { data } = $props()

  const title = $derived(routeLabel(page.url.pathname, $t))

  const entries = $derived(buildCatalog({
    snapshot: snapshot.items as SnapshotItem[],
    curated: CURATED,
    curatedBlocks: CURATED_BLOCKS,
    usage: data.usage,
  }))

  // Filters live in the URL (?q=&cat=&status=) so a search can be shared
  // and survives reload.
  function param<T extends string>(key: string, allowed: readonly T[] | null, fallback: T): T {
    const value = page.url.searchParams.get(key) ?? ''
    if (!value) return fallback
    return allowed && !allowed.includes(value as T) ? fallback : value as T
  }
  const q = $derived(param<string>('q', null, ''))
  const category = $derived(param<CatalogCategory | 'all'>('cat', ['all', ...CATALOG_CATEGORIES], 'all'))
  const status = $derived(param<CatalogStatus | 'all'>('status', ['all', ...CATALOG_STATUSES], 'all'))

  const results = $derived(searchCatalog(entries, { q, category, status }))

  const URL_KEYS = { q: 'q', category: 'cat', status: 'status' } as const
  function setFilters(patch: Partial<FinderFilters>) {
    const url = new URL(page.url)
    for (const [field, value] of Object.entries(patch)) {
      const key = URL_KEYS[field as keyof FinderFilters]
      if (value && value !== 'all') url.searchParams.set(key, value)
      else url.searchParams.delete(key)
    }
    void goto(url, { replaceState: true, keepFocus: true, noScroll: true })
  }

  function clearFilters() {
    void goto(page.url.pathname + page.url.hash, { replaceState: true, keepFocus: true, noScroll: true })
  }

  function usedInLinks(keys: string[]): UsedInLink[] {
    return keys.map((key) => {
      if (key.startsWith('layout:')) return { label: $t('uiKit.card.layout', { name: key.slice(7) }) }
      if (key === 'app:root') return { label: $t('uiKit.card.appShell') }
      if (key === 'app:error') return { label: $t('uiKit.card.errorPage') }
      if (key.includes('[')) return { label: key }
      return { label: key === '/' ? $t('uiKit.card.home') : routeLabel(key, $t), href: key }
    })
  }

  // One chunk per demo, loaded when its card scrolls into view.
  const demoLoaders = import.meta.glob('/src/lib/components/ui-kit/demos/*Demo.svelte') as Record<string, DemoLoader>
  const demos = new Map(Object.entries(demoLoaders).map(([path, load]) => [path.split('/').pop()!.replace(/\.svelte$/, ''), load]))
  const demoFor = (name: string, kind: 'ui' | 'block') => kind === 'ui' ? demos.get(demoNameFor(name)) : undefined

  // Deep links (#range-calendar) scroll to the card once it has rendered.
  onMount(async () => {
    if (!page.url.hash) return
    await tick()
    document.getElementById(decodeURIComponent(page.url.hash.slice(1)))?.scrollIntoView({ block: 'start' })
  })
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description={$t('uiKit.description')} />
  </PageHeader>

  <PageBody class="space-y-4">
    <FoundationsPanel />
    <FinderToolbar {q} {category} {status} count={results.length} onChange={setFilters} />

    {#if !results.length}
      <EmptyState icon={SearchX} title={$t('uiKit.empty.title')} description={$t('uiKit.empty.description')} headingTag="h2">
        <Button variant="outline" size="sm" class="mt-4" onclick={clearFilters}>{$t('uiKit.empty.clear')}</Button>
      </EmptyState>
    {:else}
      <div class="grid items-start gap-4 xl:grid-cols-2">
        {#each results as entry (`${entry.kind}:${entry.name}`)}
          <CatalogCard {entry} usedIn={usedInLinks(entry.usedIn)} demo={demoFor(entry.name, entry.kind)} />
        {/each}
      </div>
    {/if}
  </PageBody>
</Page>
