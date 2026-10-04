<script lang="ts">
  import { BarChart3, Calendar, FileCheck2, ShieldCheck, Users, Wallet } from '@lucide/svelte'
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'

  const features = [
    {
      icon: Users,
      title: 'Employee directory',
      body: 'Single source of truth for people, roles and reporting lines — searchable and exportable.',
    },
    {
      icon: Wallet,
      title: 'Payroll',
      body: 'Multi-currency runs with automatic tax filing and direct deposit. Pause and resume in one click.',
    },
    {
      icon: BarChart3,
      title: 'Performance',
      body: 'OKRs, 1:1s, 360 reviews and continuous feedback all linked to the org chart.',
    },
    {
      icon: FileCheck2,
      title: 'Onboarding',
      body: '34 templated tasks split across pre-start, day 1, week 1, month 1 and 90-day milestones.',
    },
    {
      icon: Calendar,
      title: 'Time off',
      body: 'Accrual-based leave with manager approval workflow and shared team calendar.',
    },
    {
      icon: ShieldCheck,
      title: 'Compliance',
      body: 'GDPR, SOC2 and HIPAA-ready audit trails. Right-to-erasure built in.',
    },
  ]
</script>

<section data-slot="features-01" class="bg-background">
  <div class="mx-auto max-w-6xl px-6 py-24">
    <div class="mb-12 max-w-2xl space-y-3">
      <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Features</p>
      <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Everything teams need, nothing they don't.</h2>
      <p class="text-muted-foreground text-lg">
        Six modules that work together out of the box. Pay only for what you use.
      </p>
    </div>
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each features as f (f.title)}
        <Card>
          <CardHeader class="space-y-3">
            <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <f.icon class="size-5" />
            </div>
            <CardTitle class="text-base">{f.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground text-sm">{f.body}</p>
          </CardContent>
        </Card>
      {/each}
    </div>
  </div>
</section>
