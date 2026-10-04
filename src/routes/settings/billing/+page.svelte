<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { page } from '$app/state'
  import { AlertCircle, CheckCircle2, Copy, CreditCard, Download, Loader2 } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { toast } from 'svelte-sonner'
  import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import DemoDataBanner from '$lib/components/blocks/demo-data-banner/DemoDataBanner.svelte'
  import UsageBar from '$lib/components/blocks/usage-bar/UsageBar.svelte'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { locale, t } from '$lib/i18n'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { SAMPLE_INVOICES, SAMPLE_PLAN, SAMPLE_USAGE, usageText } from '$lib/usage-mock'

  const title = $derived(routeLabel(page.url.pathname, $t))

  interface SubscriptionRow {
    status: string
    productId: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    canceledAt: string | null
    plan: 'pro' | 'team' | 'enterprise' | null
  }

  const justCheckedOut = $derived(page.url.searchParams.get('status') === 'success')

  let subscription = $state<SubscriptionRow | null>(null)

  async function refreshSub() {
    const res: ApiResponse<{ subscription: SubscriptionRow | null }> = await apiFetch('/api/me/subscription')
    if (res.ok) {
      subscription = res.data.subscription
    }
  }

  onMount(() => {
    void refreshSub()
  })

  const hasActiveSub = $derived(
    !!subscription && ['active', 'trialing', 'past_due'].includes(subscription.status),
  )

  // Derive the displayed plan from the real subscription. Without one the
  // page shows the shared sample plan ($lib/usage-mock) so plan, usage and
  // invoices agree with each other and with Settings -> Limits.
  const isSample = $derived(!subscription)
  const plan = $derived.by(() => {
    if (!subscription) return { name: SAMPLE_PLAN.name, price: SAMPLE_PLAN.price as number | null, renews: SAMPLE_PLAN.renews as string | null }
    const label = subscription.plan
      ? subscription.plan[0]!.toUpperCase() + subscription.plan.slice(1)
      : 'Subscribed'
    return {
      name: label,
      price: null,
      renews: subscription.currentPeriodEnd,
    }
  })

  let portalState = $state<'idle' | 'opening' | 'error'>('idle')
  let portalError = $state<string | null>(null)

  async function openPortal() {
    portalState = 'opening'
    portalError = null
    const res: ApiResponse<{ url: string }> = await apiFetch('/api/billing/portal', { method: 'POST' })
    if (!res.ok) {
      portalError = res.error.message
      portalState = 'error'
      return
    }
    window.location.href = res.data.url
  }

  // If the user just landed back from a successful checkout, poll the
  // subscription endpoint a few times — the webhook fires async on Polar's
  // side and the row may not exist yet on first read.
  let pollTimer: ReturnType<typeof setInterval> | null = null

  onMount(() => {
    if (!justCheckedOut) return
    let attempts = 0
    pollTimer = setInterval(async () => {
      attempts++
      await refreshSub()
      if (hasActiveSub || attempts >= 6) {
        if (pollTimer) clearInterval(pollTimer)
        pollTimer = null
      }
    }, 1500)
  })

  onDestroy(() => {
    if (pollTimer) clearInterval(pollTimer)
  })

  const usageThisCycle = SAMPLE_USAGE.filter(u => u.billable)
  const invoices = SAMPLE_INVOICES

  // Dates render with the i18n locale, not the runtime default, so SSR and
  // the client agree (no hydration mismatch).
  function fmtDate(value: string | null): string {
    if (!value) return '—'
    return new Date(value).toLocaleDateString($locale ?? 'en', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const renewsLabel = $derived(plan.renews ? fmtDate(plan.renews) : null)

  // WHY (Rule67): the invoice id carries a copy button (clipboard with a
  // textarea fallback for non-secure contexts) so ids leave the page intact.
  async function copyInvoiceId(id: string) {
    try {
      await navigator.clipboard.writeText(id)
    }
    catch {
      const ta = document.createElement('textarea')
      ta.value = id
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    toast.success(t('dashboard.billing.copied'))
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description="Plan, usage, payment method, and invoice history." />
  </PageHeader>

  <PageBody class="space-y-4">
    {#if isSample}
      <DemoDataBanner message="Sample billing data. Your plan and invoices appear here once you subscribe." />
    {/if}

    <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardDescription class="text-xs font-medium tracking-wider uppercase">Current plan</CardDescription>
          <CardTitle class="text-base">{plan.name}</CardTitle>
          <CardAction>
            <Badge variant="secondary">{renewsLabel ? `Renews ${renewsLabel}` : 'No renewal date'}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent class="space-y-4">
          {#if justCheckedOut && !hasActiveSub}
            <div class="border-primary/30 bg-primary/5 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Loader2 class="text-primary size-4 animate-spin" aria-hidden="true" />
              Finalizing your subscription…
            </div>
          {:else if subscription}
            <p class="text-sm capitalize">{subscription.status}</p>
          {:else if plan.price !== null}
            <p class="text-sm">
              <span class="text-2xl font-semibold tracking-tight tabular-nums">${plan.price}</span>
              <span class="text-muted-foreground"> / {SAMPLE_PLAN.cycle}</span>
            </p>
          {/if}
          <div class="flex flex-wrap gap-2">
            {#if hasActiveSub}
              <Button disabled={portalState === 'opening'} onclick={openPortal}>
                {#if portalState === 'opening'}
                  <Loader2 class="size-4 animate-spin" aria-hidden="true" />
                {:else}
                  <CreditCard class="size-4" aria-hidden="true" />
                {/if}
                Manage subscription
              </Button>
            {:else}
              <Button>
                {#snippet child({ props })}
                  <a href="/pricing" {...props}>Change plan</a>
                {/snippet}
              </Button>
            {/if}
          </div>
          {#if portalError}
            <div class="text-destructive flex items-center gap-2 text-sm">
              <AlertCircle class="size-4" aria-hidden="true" />
              {portalError}
            </div>
          {/if}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Payment method</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center gap-4">
            <CreditCard class="text-muted-foreground size-5" aria-hidden="true" />
            <div class="flex-1">
              <p class="text-sm font-medium">Visa ending in 4242</p>
              <p class="text-muted-foreground text-xs tabular-nums">Expires 09 / 28</p>
            </div>
          </div>
          <Button variant="outline" size="sm" class="w-full">Update card</Button>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Usage this cycle</CardTitle>
        <CardDescription>
          {renewsLabel ? `Resets ${renewsLabel}.` : 'Resets at the start of each billing cycle.'}
          Anything over the cap is billed at the overage rate.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#each usageThisCycle as u (u.id)}
          <UsageBar
            label={u.label}
            used={u.used}
            limit={u.limit}
            valueText={usageText(u)}
            scope={u.period === 'cycle' ? 'this cycle' : 'workspace total'}
          />
        {/each}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Invoices</CardTitle>
        <CardDescription>PDF downloads stay available for 7 years.</CardDescription>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Period</TableHead>
            <TableHead class="text-right">{$t('dashboard.billing.amount')}</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead class="text-right">PDF</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each invoices as inv (inv.id)}
            <TableRow>
              <TableCell class="font-mono text-xs">
                <span class="inline-flex items-center gap-1.5">
                  {inv.id}
                  <button
                    type="button"
                    class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={$t('dashboard.billing.copyAria', { id: inv.id })}
                    title={$t('dashboard.billing.copyAria', { id: inv.id })}
                    onclick={() => copyInvoiceId(inv.id)}
                  >
                    <Copy class="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              </TableCell>
              <TableCell class="text-muted-foreground text-xs tabular-nums">{inv.date}</TableCell>
              <TableCell>{inv.period}</TableCell>
              <TableCell class="text-right text-sm tabular-nums">${inv.amount.toFixed(2)}</TableCell>
              <TableCell>
                <span class="text-success flex items-center gap-1.5 text-xs capitalize">
                  <CheckCircle2 class="size-3.5" aria-hidden="true" />
                  {inv.status}
                </span>
              </TableCell>
              <TableCell class="text-muted-foreground text-xs">{inv.method}</TableCell>
              <TableCell class="text-right">
                <!-- WHY (Rule76/87): the download trigger is 32px with both
                     an accessible name and a tooltip. -->
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger>
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          variant="ghost"
                          size="icon"
                          class="size-8"
                          aria-label={$t('dashboard.billing.downloadAria', { id: inv.id })}
                        >
                          <Download class="size-4" aria-hidden="true" />
                        </Button>
                      {/snippet}
                    </TooltipTrigger>
                    <TooltipContent>{$t('dashboard.billing.downloadAria', { id: inv.id })}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </Card>
  </PageBody>
</Page>
