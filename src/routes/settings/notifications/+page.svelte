<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Label } from '$lib/components/ui/label'
  import { Separator } from '$lib/components/ui/separator'
  import { Switch } from '$lib/components/ui/switch'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { page } from '$app/state'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'

  const title = $derived(routeLabel(page.url.pathname, $t))

  interface Channel {
    email: boolean
    inApp: boolean
  }

  let prefs = $state<Record<string, Channel>>({
    mentions: { email: true, inApp: true },
    comments: { email: false, inApp: true },
    invites: { email: true, inApp: true },
    weeklyDigest: { email: true, inApp: false },
    productUpdates: { email: false, inApp: true },
    billing: { email: true, inApp: true },
  })

  interface Row {
    key: string
    label: string
    description: string
  }

  const rows: Row[] = [
    { key: 'mentions', label: 'Mentions', description: 'When someone @-mentions you in a comment or document.' },
    { key: 'comments', label: 'Comments on your items', description: 'New replies on threads you created or are subscribed to.' },
    { key: 'invites', label: 'Workspace invites', description: 'When you’re invited to a workspace or project.' },
    { key: 'weeklyDigest', label: 'Weekly digest', description: 'Mondays · top activity, usage, and outstanding tasks.' },
    { key: 'productUpdates', label: 'Product updates', description: 'New features, changelog highlights.' },
    { key: 'billing', label: 'Billing & invoices', description: 'Receipts, failed payments, plan changes.' },
  ]
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description="Pick which channels receive which events." />
  </PageHeader>

  <PageBody class="max-w-3xl space-y-4">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Delivery preferences</CardTitle>
        <CardDescription>Critical security alerts always send to email and can’t be disabled.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-[1fr_auto_auto] items-end gap-x-4 gap-y-1 pb-2 text-xs font-medium text-muted-foreground">
          <span>Event</span>
          <span class="px-1 text-center">Email</span>
          <span class="px-1 text-center">In-app</span>
        </div>
        <Separator />
        {#each rows as r, i (r.key)}
          <div>
            <div class="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-3">
              <div class="space-y-0.5">
                <Label for={`pref-${r.key}-email`} class="text-sm font-medium">{r.label}</Label>
                <p class="text-muted-foreground text-xs">{r.description}</p>
              </div>
              <Switch id={`pref-${r.key}-email`} bind:checked={prefs[r.key]!.email} />
              <Switch id={`pref-${r.key}-inapp`} bind:checked={prefs[r.key]!.inApp} />
            </div>
            {#if i < rows.length - 1}
              <Separator />
            {/if}
          </div>
        {/each}
      </CardContent>
    </Card>

    <div class="flex items-center justify-end gap-2">
      <Button variant="outline">Reset</Button>
      <Button>Save preferences</Button>
    </div>
  </PageBody>
</Page>
