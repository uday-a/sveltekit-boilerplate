<script lang="ts" module>
  import type { Component } from 'svelte'
  import type { Snippet } from 'svelte'

  export interface StatTileProps {
    label: string
    value: string
    delta?: string
    /** Tone for the delta string. Default 'positive'. Use 'negative' when
     *  the metric is "up = bad" (latency) — direction can't be inferred
     *  from the sign because churn going DOWN is good. */
    deltaTone?: 'positive' | 'negative'
    /** Short muted unit/context under the value ("sessions/day"). */
    caption?: string
    icon?: Component
    /** Category dot before the label, e.g. 'bg-chart-1'. */
    dotClass?: string
    // WHY (Rule97): optional formula/grain note rendered as an info tooltip
    // next to the label so a KPI's definition is one hover away.
    definition?: string
    class?: string
    children?: Snippet
    footer?: Snippet
  }
</script>

<script lang="ts">
  import { Info, TrendingDown, TrendingUp } from '@lucide/svelte'
  import { Card, CardContent, CardDescription, CardHeader } from '$lib/components/ui/card'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'

  let { label, value, delta, deltaTone = 'positive', caption, icon: Icon, dotClass, definition, class: className, children, footer }: StatTileProps = $props()

  // WHY (Rules 37/40): color never carries direction alone -- a shape
  // (TrendingUp/TrendingDown) rides next to the delta. Sign is read from the
  // string ('-', '−' and '↓' count as down); tone only picks the color.
  const deltaDown = $derived.by(() => {
    const d = (delta ?? '').trim()
    return d.startsWith('-') || d.startsWith('−') || d.startsWith('↓')
  })
  const DeltaIcon = $derived(deltaDown ? TrendingDown : TrendingUp)
</script>

<!-- The app's one stat tile. Every KPI strip (dashboard, calendar,
     activity, locations) uses this so label, number and delta read the
     same everywhere. Port of Nuxt `StatTile.vue`. -->
<Card class={['flex flex-col', className]} data-slot="stat-tile">
  <CardHeader class="px-4 pt-4 pb-1">
    <CardDescription class="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium tracking-wider uppercase">
      <span class="flex min-w-0 items-center gap-1.5">
        {#if dotClass}
          <span class={['size-2 shrink-0 rounded-full', dotClass]} aria-hidden="true"></span>
        {/if}
        <span class="truncate" title={label}>{label}</span>
        {#if definition}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <button
                    type="button"
                    {...props}
                    class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 items-center rounded focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={`${label} definition`}
                  >
                    <Info class="size-3.5" aria-hidden="true" />
                  </button>
                {/snippet}
              </TooltipTrigger>
              <TooltipContent class="max-w-56 text-xs">
                {definition}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        {/if}
      </span>
      {#if Icon}
        {@const TileIcon = Icon}
        <TileIcon class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      {/if}
    </CardDescription>
  </CardHeader>
  <CardContent class="flex flex-1 flex-col px-4 pb-4">
    <div class="flex flex-wrap items-baseline gap-x-2">
      <span class="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      {#if delta}
        <span class={['inline-flex items-center gap-0.5 text-xs font-medium tabular-nums', deltaTone === 'negative' ? 'text-destructive' : 'text-success']}>
          <DeltaIcon class="size-3" aria-hidden="true" />
          {delta}
        </span>
      {/if}
    </div>
    {#if caption}
      <p class="text-muted-foreground mt-0.5 text-xs">{caption}</p>
    {/if}
    {@render children?.()}
    {#if footer}
      <div class="text-muted-foreground mt-auto pt-3 text-xs">
        {@render footer()}
      </div>
    {/if}
  </CardContent>
</Card>
