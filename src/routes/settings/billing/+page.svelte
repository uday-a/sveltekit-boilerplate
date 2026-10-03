<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { page } from '$app/state'
  import { AlertCircle, CheckCircle2, Copy, CreditCard, Download, Loader2 } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { toast } from 'svelte-sonner'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import UsageBar from '$lib/components/blocks/usage-bar/UsageBar.svelte'
  import { locale, t } from '$lib/i18n'
  import { apiFetch, type ApiResponse } from '$lib/api'

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
  let subLoading = $state(true)

  async function refreshSub() {
    const res: ApiResponse<{ subscription: SubscriptionRow | null }> = await apiFetch('/api/me/subscription')
    if (res.ok) {
      subscription = res.data.subscription
    }
    subLoading = false
  }

  onMount(() => {
    void refreshSub()
  })

  const hasActiveSub = $derived(
    !!subscription && ['active', 'trialing', 'past_due'].includes(subscription.status),
  )

  // Derive the displayed plan label from the real subscription, falling
  // back to a "Free" presentation when the user hasn't checked out yet.
  const plan = $derived.by(() => {
    if (!subscription) return { name: 'Free', price: 0, cycle: '—', renews: null as string | null }
    const label = subscription.plan
      ? subscription.plan[0]!.toUpperCase() + subscription.plan.slice(1)
      : 'Subscribed'
    return {
      name: label,
      price: 0,
      cycle: '—',
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

  const usageThisCycle = [
    { label: 'API calls', used: 482300, limit: 1000000, unit: '' },
    { label: 'Compute (hours)', used: 127.4, limit: 250, unit: 'h' },
    { label: 'Storage', used: 38.2, limit: 100, unit: 'GB' },
    { label: 'Team seats', used: 8, limit: 25, unit: '' },
  ]

  const invoices = [
    { id: 'INV-2031', date: '2026-05-01', period: 'Apr 2026', amount: 148.40, status: 'paid', method: 'Visa ··4242' },
    { id: 'INV-2018', date: '2026-04-01', period: 'Mar 2026', amount: 148.40, status: 'paid', method: 'Visa ··4242' },
    { id: 'INV-1994', date: '2026-03-01', period: 'Feb 2026', amount: 145.00, status: 'paid', method: 'Visa ··4242' },
    { id: 'INV-1972', date: '2026-02-01', period: 'Jan 2026', amount: 145.00, status: 'paid', method: 'Visa ··4242' },
    { id: 'INV-1948', date: '2026-01-01', period: 'Dec 2025', amount: 145.00, status: 'paid', method: 'Visa ··4242' },
    { id: 'INV-1923', date: '2025-12-01', period: 'Nov 2025', amount: 133.00, status: 'paid', method: 'Visa ··4242' },
  ]

  function fmt(n: number, unit: string): string {
    return `${n.toLocaleString()}${unit}`
  }

  // Dates render with the i18n locale, not the runtime default, so SSR and
  // the client agree (no hydration mismatch). Port of the nuxt 462c304 fix.
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
  <title>Billing · Settings | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading title="Billing" description="Plan, usage, payment method, and invoice history." />
  </PageHeader>

  <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
    <Card>
      <CardHeader>
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <CardDescription class="text-xs uppercase tracking-wider">Current plan</CardDescription>
            <CardTitle class="text-base">{plan.name}</CardTitle>
          </div>
          {#if renewsLabel}
            <Badge variant="secondary">
              Renews {renewsLabel}
            </Badge>
          {/if}
        </div>
      </CardHeader>
      <CardContent class="space-y-3">
        {#if subLoading}
          <div class="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 class="size-4 animate-spin" />
            Loading subscription…
          </div>
        {:else if justCheckedOut && !hasActiveSub}
          <div class="border-primary/30 bg-primary/5 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Loader2 class="text-primary size-4 animate-spin" />
            Finalising your subscription… (Polar's webhook usually arrives in a second or two.)
          </div>
        {:else if subscription}
          <Badge variant="secondary" class="capitalize">{subscription.status}</Badge>
        {:else}
          <div class="text-muted-foreground text-sm">
            You're on the free tier. Upgrade for more seats, integrations, and priority support.
          </div>
        {/if}
        <div class="flex flex-wrap gap-2 pt-2">
          {#if hasActiveSub}
            <Button disabled={portalState === 'opening'} onclick={openPortal}>
              {#if portalState === 'opening'}
                <Loader2 class="size-4 animate-spin" />
              {:else}
                <CreditCard class="size-4" />
              {/if}
              Manage subscription
            </Button>
          {:else}
            <Button>
              {#snippet child({ props })}
                <a href="/pricing" {...props}>View plans</a>
              {/snippet}
            </Button>
          {/if}
        </div>
        {#if portalError}
          <div class="text-destructive flex items-center gap-2 text-sm">
            <AlertCircle class="size-4" />
            {portalError}
          </div>
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Payment method</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="flex items-center gap-3">
          <CreditCard class="text-muted-foreground size-5" />
          <div class="flex-1">
            <p class="text-sm font-medium">Visa ending in 4242</p>
            <p class="text-muted-foreground text-xs">Expires 09 / 28</p>
          </div>
        </div>
        <Button variant="outline" size="sm" class="w-full">Update card</Button>
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Usage this cycle</CardTitle>
      <CardDescription
        >Resets {renewsLabel ?? '—'}. Anything over the cap is billed at the overage rate (see plan details).</CardDescription
      >
    </CardHeader>
    <CardContent class="space-y-4">
      {#each usageThisCycle as u (u.label)}
        <UsageBar label={u.label} used={u.used} limit={u.limit} valueText={`${fmt(u.used, u.unit)} / ${fmt(u.limit, u.unit)}`} />
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
                  class="text-muted-foreground inline-flex items-center rounded p-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label={$t('dashboard.billing.copyAria', { id: inv.id })}
                  title={$t('dashboard.billing.copyAria', { id: inv.id })}
                  onclick={() => copyInvoiceId(inv.id)}
                >
                  <Copy class="size-3.5" aria-hidden="true" />
                </button>
              </span>
            </TableCell>
            <TableCell class="text-muted-foreground text-xs tabular-nums">{fmtDate(inv.date)}</TableCell>
            <TableCell class="text-xs">{inv.period}</TableCell>
            <TableCell class="text-right tabular-nums">${inv.amount.toFixed(2)}</TableCell>
            <TableCell>
              <span class="text-success flex items-center gap-1 text-xs capitalize">
                <CheckCircle2 class="size-3" />
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
</Page>
