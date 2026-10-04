<script lang="ts">
  import { AlertTriangle, ChevronRight } from '@lucide/svelte'
  import { page } from '$app/state'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import DemoDataBanner from '$lib/components/blocks/demo-data-banner/DemoDataBanner.svelte'
  import UsageBar from '$lib/components/blocks/usage-bar/UsageBar.svelte'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'
  import { SAMPLE_PLAN, SAMPLE_USAGE, usagePct, usageText } from '$lib/usage-mock'

  const title = $derived(routeLabel(page.url.pathname, $t))

  // Same sample meters as Settings -> Billing, so both pages agree.
  const quotas = SAMPLE_USAGE
  // Quotas at or over the UsageBar destructive threshold get a callout.
  const critical = quotas.filter(q => usagePct(q) >= 90)

  const rateLimits = [
    { endpoint: '/v1/projects', perMinute: 600, burst: 100 },
    { endpoint: '/v1/deploys', perMinute: 300, burst: 60 },
    { endpoint: '/v1/events', perMinute: 3000, burst: 500 },
    { endpoint: '/v1/customers', perMinute: 600, burst: 100 },
    { endpoint: '/v1/batch', perMinute: 10, burst: 5 },
    { endpoint: '/v1/files/upload', perMinute: 60, burst: 20 },
  ]
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description="Quotas and rate limits for your workspace." />
  </PageHeader>

  <PageBody class="max-w-3xl space-y-4">
    <DemoDataBanner message="Sample usage data. Connect metering to see live quotas." />

    {#each critical as q (q.id)}
      <Card class="border-destructive/30 bg-destructive/5">
        <CardContent class="flex items-start gap-4 p-4">
          <AlertTriangle class="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div class="flex-1 space-y-1">
            <p class="text-sm font-semibold">{q.label} approaching limit</p>
            <p class="text-muted-foreground text-xs tabular-nums">
              {q.used.toLocaleString()} of {q.limit.toLocaleString()} used. Archive unused items or upgrade to raise the cap.
            </p>
          </div>
          <Button variant="outline" size="sm">Review</Button>
        </CardContent>
      </Card>
    {/each}

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Quotas</CardTitle>
        <CardDescription>Cycle quotas reset on the 1st. Workspace totals don't reset.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#each quotas as q (q.id)}
          <UsageBar
            label={q.label}
            used={q.used}
            limit={q.limit}
            valueText={usageText(q)}
            scope={q.period === 'cycle' ? 'this cycle' : 'workspace total'}
          />
        {/each}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Rate limits</CardTitle>
        <CardDescription>Per-API-key limits on the {SAMPLE_PLAN.name} plan. Multiple keys multiply your effective ceiling.</CardDescription>
      </CardHeader>
      <CardContent class="divide-y">
        {#each rateLimits as r (r.endpoint)}
          <div class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <p class="font-mono text-sm">{r.endpoint}</p>
            <div class="text-right">
              <p class="text-sm font-medium tabular-nums">
                {r.perMinute.toLocaleString()} <span class="text-muted-foreground font-normal">/ min</span>
              </p>
              <p class="text-muted-foreground text-xs tabular-nums">Burst {r.burst}</p>
            </div>
          </div>
        {/each}
      </CardContent>
    </Card>

    <a href="/pricing" class="group focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-[3px]">
      <Card class="group-hover:bg-muted/40 transition-colors">
        <CardContent class="flex items-center justify-between gap-4 p-4">
          <div class="space-y-1">
            <p class="text-sm font-semibold">Need higher limits?</p>
            <p class="text-muted-foreground text-xs">Enterprise lifts all caps and adds dedicated capacity in your region.</p>
          </div>
          <ChevronRight class="text-muted-foreground size-4" aria-hidden="true" />
        </CardContent>
      </Card>
    </a>
  </PageBody>
</Page>
