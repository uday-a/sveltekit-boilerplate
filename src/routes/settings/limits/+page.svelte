<script lang="ts">
  import { AlertTriangle, ChevronRight } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import UsageBar from '$lib/components/blocks/usage-bar/UsageBar.svelte'

  const quotas = [
    { name: 'Genesis API calls', used: 248_120, limit: 600_000, period: 'this month' },
    { name: 'Explorer API calls', used: 71_300, limit: 200_000, period: 'this month' },
    { name: 'Quantum API calls', used: 1_840_000, limit: 3_000_000, period: 'this month' },
    { name: 'Batch endpoint requests', used: 2_140, limit: 5_000, period: 'this month' },
    { name: 'File bundles (active)', used: 47, limit: 50, period: 'workspace total' },
    { name: 'Compute hours', used: 127.4, limit: 250, period: 'this month' },
    { name: 'Storage', used: 38.2, limit: 100, period: 'workspace total' },
    { name: 'Team seats', used: 8, limit: 25, period: 'workspace total' },
  ]

  const rateLimits = [
    { endpoint: '/complete', tier: 'Pro', perMinute: 600, burst: 100 },
    { endpoint: '/complete/stream', tier: 'Pro', perMinute: 600, burst: 100 },
    { endpoint: '/complete (Explorer)', tier: 'Pro', perMinute: 200, burst: 50 },
    { endpoint: '/complete (Quantum)', tier: 'Pro', perMinute: 3000, burst: 500 },
    { endpoint: '/batch', tier: 'Pro', perMinute: 10, burst: 5 },
    { endpoint: '/files/upload', tier: 'Pro', perMinute: 60, burst: 20 },
  ]
</script>

<svelte:head>
  <title>Limits · Settings | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading title="Limits" description="Quotas and rate limits for your workspace. Quotas at 90% or more need attention." />
  </PageHeader>

  <Card class="border-destructive/30 bg-destructive/5">
    <CardContent class="flex items-start gap-3 py-4">
      <AlertTriangle class="text-destructive mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div class="flex-1 space-y-1">
        <p class="text-sm font-semibold">File bundles approaching limit</p>
        <p class="text-muted-foreground text-xs">47 of 50 active bundles. Archive unused bundles or upgrade to remove the cap.</p>
      </div>
      <Button variant="outline" size="sm">Manage bundles</Button>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Quotas</CardTitle>
      <CardDescription>Monthly quotas reset on the 1st. Workspace-total quotas don't reset.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      {#each quotas as q (q.name)}
        <UsageBar label={q.name} used={q.used} limit={q.limit} scope={q.period} />
      {/each}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Rate limits</CardTitle>
      <CardDescription>Per-API-key limits. Multiple keys multiply your effective ceiling.</CardDescription>
    </CardHeader>
    <CardContent class="divide-y">
      {#each rateLimits as r (r.endpoint)}
        <div class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div class="space-y-0.5">
            <p class="font-mono text-sm">{r.endpoint}</p>
            <p class="text-muted-foreground text-xs">{r.tier} tier</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium tabular-nums">
              {r.perMinute.toLocaleString()} <span class="text-muted-foreground font-normal">/ min</span>
            </p>
            <p class="text-muted-foreground text-xs tabular-nums">Burst: {r.burst}</p>
          </div>
        </div>
      {/each}
    </CardContent>
  </Card>

  <Card class="hover:bg-muted/40 cursor-pointer transition-colors">
    <CardContent class="flex items-center justify-between gap-4 py-4">
      <div>
        <p class="text-sm font-semibold">Need higher limits?</p>
        <p class="text-muted-foreground text-xs">Enterprise tier lifts all caps and adds dedicated capacity in your region.</p>
      </div>
      <ChevronRight class="text-muted-foreground size-4" />
    </CardContent>
  </Card>
</Page>
