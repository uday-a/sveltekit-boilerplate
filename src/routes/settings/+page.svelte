<script lang="ts">
  import { Bell, CreditCard, Gauge, History, KeyRound, Plug, Settings2, ShieldCheck, UserCircle, Users } from '@lucide/svelte'
  import { page } from '$app/state'
  import { Card } from '$lib/components/ui/card'
  import { IconBox } from '$lib/components/ui/icon-box'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { locale, t } from '$lib/i18n'
  import { SAMPLE_PLAN, SAMPLE_USAGE, usagePct } from '$lib/usage-mock'

  const title = $derived(routeLabel(page.url.pathname, $t))

  const apiCalls = SAMPLE_USAGE.find(u => u.id === 'api-calls')!
  const renews = $derived(new Date(SAMPLE_PLAN.renews).toLocaleDateString($locale ?? 'en', { month: 'short', day: 'numeric' }))

  // Titles come from the same nav.items.* labels as the sidebar and the
  // page H1, so a card never names its page differently.
  const sections = $derived([
    { slug: 'general', icon: Settings2, title: $t('nav.items.general'), description: 'Workspace name, URL, locale and defaults.', meta: 'Acme Inc' },
    { slug: 'account', icon: UserCircle, title: $t('nav.items.account'), description: 'Profile, email, password and account deletion.', meta: 'Personal' },
    { slug: 'security', icon: ShieldCheck, title: $t('nav.items.security'), description: 'Two-factor auth and active sessions.', meta: '2 active sessions' },
    { slug: 'api-keys', icon: KeyRound, title: $t('nav.items.apiKeys'), description: 'Scoped keys for scripts, CLIs and integrations.', meta: 'Read or read-write scopes' },
    { slug: 'notifications', icon: Bell, title: $t('nav.items.notifications'), description: 'Email and in-app delivery preferences.', meta: 'Email · in-app' },
    { slug: 'integrations', icon: Plug, title: $t('nav.items.integrations'), description: 'Connected apps and webhooks.', meta: '1 connected' },
    { slug: 'team', icon: Users, title: $t('nav.items.team'), description: 'Members, roles and invitations.', meta: '8 members · 2 pending' },
    { slug: 'activity', icon: History, title: $t('nav.items.activityLog'), description: 'Audit trail of sign-ins and changes.', meta: 'Workspace-wide' },
    { slug: 'billing', icon: CreditCard, title: $t('nav.items.billing'), description: 'Plan, payment method and invoices.', meta: `${SAMPLE_PLAN.name} · renews ${renews}` },
    { slug: 'limits', icon: Gauge, title: $t('nav.items.limits'), description: 'Quotas and per-key rate limits.', meta: `${usagePct(apiCalls)}% of API calls used` },
  ])
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description="Workspace configuration. Changes apply to all members." />
  </PageHeader>

  <PageBody>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each sections as s (s.slug)}
        <a
          href={`/settings/${s.slug}`}
          class="group focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-[3px]"
        >
          <Card class="group-hover:border-foreground/20 group-hover:bg-muted/40 flex h-full flex-row items-start gap-4 p-4 transition-colors">
            <IconBox icon={s.icon} size="md" aria-hidden="true" />
            <div class="min-w-0 flex-1 space-y-1">
              <p class="text-sm font-semibold">{s.title}</p>
              <p class="text-muted-foreground text-xs">{s.description}</p>
              <p class="text-muted-foreground pt-1 text-xs tabular-nums">{s.meta}</p>
            </div>
          </Card>
        </a>
      {/each}
    </div>
  </PageBody>
</Page>
