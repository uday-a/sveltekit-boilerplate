<script lang="ts">
  import type { Component } from 'svelte'
  import {
    ArrowRight,
    Bell,
    CreditCard,
    Gauge,
    History,
    KeyRound,
    Plug,
    ShieldCheck,
    User,
    UserCircle,
    Users,
  } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'

  interface Section {
    slug: string
    icon: Component
    title: string
    description: string
    meta: string
  }

  const sections: Section[] = [
    { slug: 'general', icon: User, title: 'General', description: 'Workspace name, timezone, default locale, brand colours.', meta: 'You · 4 fields' },
    { slug: 'account', icon: UserCircle, title: 'Account', description: 'Profile, email, password, account deletion.', meta: 'Your personal info' },
    { slug: 'security', icon: ShieldCheck, title: 'Security', description: 'Sessions, two-factor auth, API tokens.', meta: '1 active session' },
    { slug: 'api-keys', icon: KeyRound, title: 'API keys', description: 'Scoped credentials for scripts, CLIs, and integrations.', meta: 'Scoped · revocable' },
    { slug: 'activity', icon: History, title: 'Activity', description: 'Audit trail of who did what in your workspace.', meta: 'Sign-ins · invites · changes' },
    { slug: 'notifications', icon: Bell, title: 'Notifications', description: 'Email and in-app delivery preferences.', meta: 'Email · in-app' },
    { slug: 'integrations', icon: Plug, title: 'Integrations', description: 'Connected OAuth apps and webhooks.', meta: '0 connected' },
    { slug: 'team', icon: Users, title: 'Team', description: 'Members, roles, invitations, and SSO configuration.', meta: '8 members · 2 pending invites' },
    { slug: 'billing', icon: CreditCard, title: 'Billing', description: 'Current plan, payment method, invoices, usage caps.', meta: 'Pro · $148.40 this cycle' },
    { slug: 'limits', icon: Gauge, title: 'Limits', description: 'API quotas, rate limits, storage allowances per workspace.', meta: '47% of monthly quota' },
  ]
</script>

<svelte:head>
  <title>Settings | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading title="Settings" description="Workspace configuration. Changes apply to all members." />
  </PageHeader>

  <div class="grid gap-4 sm:grid-cols-2">
    {#each sections as s (s.slug)}
      {@const SIcon = s.icon}
      <a href={`/settings/${s.slug}`} class="group block">
        <Card class="hover:border-foreground/20 h-full transition-colors">
          <CardHeader>
            <div class="flex items-start justify-between gap-3">
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <SIcon class="size-5" />
              </div>
              <ArrowRight
                class="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 size-4 transition-transform"
              />
            </div>
            <CardTitle class="text-base pt-3">{s.title}</CardTitle>
            <CardDescription>{s.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{s.meta}</Badge>
          </CardContent>
        </Card>
      </a>
    {/each}
  </div>
</Page>
