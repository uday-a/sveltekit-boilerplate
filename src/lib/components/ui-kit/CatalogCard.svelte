<script lang="ts" module>
  import type { Component } from 'svelte'

  export interface UsedInLink {
    label: string
    /** Absent for layouts, the app shell and dynamic routes. */
    href?: string
  }

  /** Lazy demo module; every demo takes the entry name (ChartDemo renders by it). */
  export type DemoLoader = () => Promise<{ default: Component<{ name?: string }> }>
</script>

<script lang="ts">
  import { ExternalLink } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { categoryKey, type CatalogEntry } from '$lib/data/ui-catalog/catalog'
  import { t } from '$lib/i18n'
  import InstallCommand from './InstallCommand.svelte'

  let { entry, usedIn, demo }: { entry: CatalogEntry, usedIn: UsedInLink[], demo?: DemoLoader } = $props()

  const STATUS_VARIANT = { 'installed': 'success', 'demo-only': 'warning', 'available': 'outline' } as const
  const STATUS_KEY = { 'installed': 'installed', 'demo-only': 'demoOnly', 'available': 'available' } as const

  const USED_IN_LIMIT = 8
  let showAllUsage = $state(false)
  const visibleUsedIn = $derived(showAllUsage ? usedIn : usedIn.slice(0, USED_IN_LIMIT))

  // Load the demo the first time the card scrolls near the viewport, so
  // leaflet, tiptap and echarts stay out of the initial page JS.
  let demoEl = $state<HTMLElement | null>(null)
  let Demo = $state<Component<{ name?: string }> | null>(null)
  $effect(() => {
    if (!demoEl || !demo) return
    const load = demo
    const io = new IntersectionObserver(([hit]) => {
      if (!hit?.isIntersecting) return
      io.disconnect()
      void load().then(m => (Demo = m.default))
    }, { rootMargin: '200px' })
    io.observe(demoEl)
    return () => io.disconnect()
  })

  const isInstalled = $derived(entry.status !== 'available')
</script>

<Card id={entry.name} class="scroll-mt-20">
  <CardHeader class="gap-2 space-y-0 p-4 pb-0">
    <div class="flex flex-wrap items-center gap-2">
      <CardTitle class="text-base">
        <a
          href="#{entry.name}"
          class="focus-visible:ring-ring rounded-sm hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >{entry.title}</a>
      </CardTitle>
      <code class="text-muted-foreground font-mono text-xs">{entry.name}</code>
      <div class="ml-auto flex items-center gap-1.5">
        <Badge variant="secondary">{$t(`uiKit.category.${categoryKey(entry.category)}`)}</Badge>
        <Badge variant={STATUS_VARIANT[entry.status]}>{$t(`uiKit.status.${STATUS_KEY[entry.status]}`)}</Badge>
      </div>
    </div>
    <CardDescription class="text-sm">{entry.whenToUse ?? entry.description}</CardDescription>
    {#if entry.whenToUse && entry.description}
      <p class="text-muted-foreground line-clamp-2 text-xs">{entry.description}</p>
    {/if}
  </CardHeader>

  <CardContent class="space-y-4 p-4">
    {#if demo}
      <div
        bind:this={demoEl}
        class="bg-background min-h-24 rounded-lg border p-4"
        aria-label={$t('uiKit.card.demo')}
        role="group"
      >
        {#if Demo}
          <Demo name={entry.name} />
        {:else}
          <div class="space-y-2" aria-label={$t('uiKit.card.loadingDemo')} role="status">
            <Skeleton class="h-4 w-1/3" />
            <Skeleton class="h-16 w-full" />
          </div>
        {/if}
      </div>
    {/if}

    {#if isInstalled}
      <div class="space-y-2">
        <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">{$t('uiKit.card.usedIn')}</p>
        {#if !usedIn.length}
          <p class="text-muted-foreground text-xs">{$t('uiKit.card.notUsed')}</p>
        {:else}
          <ul class="flex flex-wrap gap-1.5">
            {#each visibleUsedIn as link (link.label)}
              <li>
                {#if link.href}
                  <a
                    href={link.href}
                    class="hover:bg-accent focus-visible:ring-ring inline-flex rounded-md border px-2 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >{link.label}</a>
                {:else}
                  <span class="text-muted-foreground inline-flex rounded-md border border-dashed px-2 py-0.5 text-xs">{link.label}</span>
                {/if}
              </li>
            {/each}
            {#if usedIn.length > USED_IN_LIMIT && !showAllUsage}
              <li>
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex rounded-md px-2 py-0.5 text-xs tabular-nums focus-visible:ring-2 focus-visible:outline-none"
                  onclick={() => (showAllUsage = true)}
                >+{usedIn.length - USED_IN_LIMIT}</button>
              </li>
            {/if}
          </ul>
        {/if}
      </div>
    {/if}

    <div class="space-y-2">
      <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {entry.installCmd ? $t('uiKit.card.install') : $t('uiKit.card.source')}
      </p>
      {#if entry.installCmd}
        <InstallCommand command={entry.installCmd} />
      {:else}
        <p class="text-muted-foreground text-xs">
          {$t('uiKit.card.localBlock')}
          <code class="font-mono">src/lib/components/blocks/{entry.name}/</code>
        </p>
      {/if}
    </div>
  </CardContent>

  {#if entry.docsUrl}
    <CardFooter class="p-4 pt-0">
      <Button variant="ghost" size="sm" class="text-muted-foreground -ml-2">
        {#snippet child({ props })}
          <a {...props} href={entry.docsUrl} target="_blank" rel="noopener">
            {$t('uiKit.card.docs')}
            <ExternalLink class="size-4" aria-hidden="true" />
          </a>
        {/snippet}
      </Button>
    </CardFooter>
  {/if}
</Card>
