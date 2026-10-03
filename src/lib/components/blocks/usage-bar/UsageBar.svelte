<script lang="ts" module>
  export interface UsageBarProps {
    label: string
    used: number
    limit: number
    /** Pre-formatted "used / limit" text; defaults to locale numbers. */
    valueText?: string
    /** Muted qualifier next to the label ("this month", "workspace total"). */
    scope?: string
  }
</script>

<script lang="ts">
  let { label, used, limit, valueText, scope }: UsageBarProps = $props()

  // One usage meter for Billing and Limits. Colour follows a single
  // threshold rule: < 70% neutral, 70-89% warning, >= 90% destructive.
  // Port of Nuxt `UsageBar.vue`.
  const pct = $derived(limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0)
  const tone = $derived(pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-warning' : 'bg-primary')
  const text = $derived(valueText ?? `${used.toLocaleString()} / ${limit.toLocaleString()}`)
</script>

<div class="space-y-1.5" data-slot="usage-bar">
  <div class="flex items-baseline justify-between gap-3 text-sm">
    <span class="font-medium">
      {label}
      {#if scope}
        <span class="text-muted-foreground ml-1 text-xs font-normal">{scope}</span>
      {/if}
    </span>
    <span class="text-muted-foreground text-xs tabular-nums">
      {text}
      <span class={pct >= 90 ? 'text-destructive font-medium' : pct >= 70 ? 'text-warning font-medium' : ''}>({pct}%)</span>
    </span>
  </div>
  <div
    class="bg-muted h-1.5 w-full overflow-hidden rounded-full"
    role="progressbar"
    aria-label={label}
    aria-valuenow={pct}
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class={['h-full rounded-full transition-[width] duration-200', tone]} style={`width: ${pct}%`}></div>
  </div>
</div>
