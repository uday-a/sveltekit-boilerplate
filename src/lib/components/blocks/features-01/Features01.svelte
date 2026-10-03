<script lang="ts">
  import type { Component } from 'svelte'
  import {
    ArrowRight,
    BarChart3,
    Bot,
    Check,
    ChevronRight,
    Code2,
    Copy,
    Layers,
    ShieldCheck,
    Users,
    Wallet,
  } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardFooter, CardHeader } from '$lib/components/ui/card'
  import { Separator } from '$lib/components/ui/separator'
  import { cn } from '$lib/utils'
  import DirectorySimulation from './DirectorySimulation.svelte'
  import PayrollSimulation from './PayrollSimulation.svelte'
  import ComplianceSimulation from './ComplianceSimulation.svelte'
  import ApiSimulation from './ApiSimulation.svelte'
  import CopilotSimulation from './CopilotSimulation.svelte'

  interface FeatureModule {
    id: string
    title: string
    category: 'core' | 'dx' | 'security' | 'ai'
    badge: string
    description: string
    icon: Component
    metrics: { label: string; value: string; trend: string }[]
    previewType: 'directory' | 'payroll' | 'performance' | 'compliance' | 'api' | 'copilot'
  }

  type Category = 'all' | 'core' | 'dx' | 'security' | 'ai'

  let activeCategory: Category = $state('all')
  let selectedFeatureId = $state('directory')
  let copied = $state(false)

  function copySnippet(text: string) {
    navigator.clipboard.writeText(text)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: 'All Modules' },
    { id: 'core', label: 'Core Platform' },
    { id: 'dx', label: 'Developer DX' },
    { id: 'security', label: 'Security' },
    { id: 'ai', label: 'Agentic AI' },
  ]

  const features: FeatureModule[] = [
    {
      id: 'directory',
      title: 'Global Employee Directory',
      category: 'core',
      badge: 'Real-time Sync',
      description:
        'Single source of truth for global teams, reporting hierarchies, custom attributes, and automated SCIM provisioning.',
      icon: Users,
      metrics: [
        { label: 'Sync Latency', value: '<12ms', trend: 'P99 Edge' },
        { label: 'SCIM Connectors', value: '24+', trend: 'Okta/Google' },
        { label: 'Export Formats', value: 'JSON/CSV', trend: 'Bi-directional' },
      ],
      previewType: 'directory',
    },
    {
      id: 'payroll',
      title: 'Multi-Currency Global Payroll',
      category: 'core',
      badge: 'Automated Tax',
      description:
        'Instant payroll calculation across 140+ countries with automated localized tax withholding, statutory benefits, and direct FX routing.',
      icon: Wallet,
      metrics: [
        { label: 'Supported Currencies', value: '140+', trend: 'Live FX' },
        { label: 'Settlement Time', value: 'Instant', trend: 'SEPA/FedNow' },
        { label: 'Tax Accuracy', value: '100%', trend: 'Statutory Verified' },
      ],
      previewType: 'payroll',
    },
    {
      id: 'performance',
      title: 'OKR & Continuous Reviews',
      category: 'dx',
      badge: '360 Calibration',
      description:
        'Transparent objective tracking, real-time 1:1 syncs, and peer review cycles tied directly to engineering and business milestones.',
      icon: BarChart3,
      metrics: [
        { label: 'Cycle Completion', value: '98.4%', trend: '+14% vs avg' },
        { label: 'Review Latency', value: '2.1 days', trend: '-40% faster' },
        { label: 'Goal Alignment', value: '94%', trend: 'Company-wide' },
      ],
      previewType: 'performance',
    },
    {
      id: 'compliance',
      title: 'SOC 2 & Continuous Compliance',
      category: 'security',
      badge: 'Zero Trust',
      description:
        'Continuous automated evidence collection across AWS, GCP, Cloudflare, and GitHub with automated auditor-ready export bundles.',
      icon: ShieldCheck,
      metrics: [
        { label: 'Continuous Tests', value: '142 / 142', trend: '100% Pass' },
        { label: 'Evidence Collection', value: 'Automated', trend: 'Every 5m' },
        { label: 'Standards', value: 'SOC2 / HIPAA', trend: 'ISO 27001' },
      ],
      previewType: 'compliance',
    },
    {
      id: 'api',
      title: 'REST & GraphQL Developer APIs',
      category: 'dx',
      badge: 'Type-Safe SDKs',
      description:
        'Fully typed OpenAPI 3.1 & TypeScript SDKs with sub-millisecond edge response times, webhooks, and granular scoped API keys.',
      icon: Code2,
      metrics: [
        { label: 'API Median Latency', value: '18ms', trend: 'Global Edge' },
        { label: 'Webhook Delivery', value: '99.98%', trend: 'Automatic Retry' },
        { label: 'Rate Limit', value: '10k req/s', trend: 'Configurable' },
      ],
      previewType: 'api',
    },
    {
      id: 'copilot',
      title: 'Autonomous People Ops Copilot',
      category: 'ai',
      badge: 'Agentic AI',
      description:
        'Natural language queries over workforce data, intelligent anomaly detection in compensation bands, and automated policy drafts.',
      icon: Bot,
      metrics: [
        { label: 'Inference Speed', value: '94 tps', trend: 'Claude 3.5' },
        { label: 'Accuracy Score', value: '99.6%', trend: 'RAG Grounded' },
        { label: 'Task Automation', value: '78%', trend: 'Self-serve' },
      ],
      previewType: 'copilot',
    },
  ]

  const filteredFeatures = $derived(
    activeCategory === 'all' ? features : features.filter((f) => f.category === activeCategory),
  )

  const activeFeature = $derived(features.find((f) => f.id === selectedFeatureId) ?? features[0]!)
</script>

<section data-slot="features-01" class="bg-background border-border relative w-full border-y py-16 lg:py-24">
  <div class="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
    <!-- Section Header -->
    <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div class="max-w-2xl space-y-3">
        <div class="inline-flex items-center gap-2">
          <Badge
            variant="outline"
            class="border-primary/30 text-primary bg-primary/5 gap-1.5 px-2.5 py-1 font-mono text-xs tracking-wide uppercase"
          >
            <Layers class="size-3.5" />
            Unified Architecture
          </Badge>
          <span class="text-muted-foreground font-mono text-xs">v4.2 Enterprise Release</span>
        </div>
        <h2 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
          Engineered for High-Velocity Teams.
        </h2>
        <p class="text-muted-foreground text-base leading-relaxed sm:text-lg">
          Six modular, composable building blocks that directly interconnect without third-party glue code.
        </p>
      </div>

      <!-- Category Filters -->
      <div class="bg-muted/60 border-border flex flex-wrap items-center gap-1.5 rounded-lg border p-1">
        {#each categories as cat (cat.id)}
          <button
            type="button"
            class={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              activeCategory === cat.id
                ? 'bg-background text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onclick={() => (activeCategory = cat.id)}
          >
            {cat.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Main Interactive Workbench Layout -->
    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      <!-- Feature Cards Navigation (5 Cols) -->
      <div class="space-y-3 lg:col-span-5">
        {#each filteredFeatures as item (item.id)}
          {@const ItemIcon = item.icon}
          <div
            class={cn(
              'group cursor-pointer rounded-xl border p-4 transition-colors duration-150',
              selectedFeatureId === item.id
                ? 'bg-card border-primary/40 ring-primary/20 shadow-xs ring-1'
                : 'bg-card/40 border-border hover:bg-card/80 hover:border-border/80',
            )}
            onclick={() => (selectedFeatureId = item.id)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                selectedFeatureId = item.id
              }
            }}
            role="button"
            tabindex="0"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class={cn(
                    'flex size-9 items-center justify-center rounded-lg border transition-colors',
                    selectedFeatureId === item.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border group-hover:text-foreground',
                  )}
                >
                  <ItemIcon class="size-4.5" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-foreground text-sm font-semibold tracking-tight">{item.title}</h3>
                    <Badge variant="secondary" class="px-1.5 py-0 text-xs font-normal">
                      {item.badge}
                    </Badge>
                  </div>
                  <p class="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                    {item.description}
                  </p>
                </div>
              </div>
              <ChevronRight
                class={cn(
                  'text-muted-foreground size-4 shrink-0 transition-transform',
                  selectedFeatureId === item.id ? 'text-primary translate-x-0.5' : 'group-hover:translate-x-0.5',
                )}
              />
            </div>

            <!-- Key metrics row in card -->
            {#if selectedFeatureId === item.id}
              <div class="border-border/60 mt-4 grid grid-cols-3 gap-2 border-t pt-3">
                {#each item.metrics as m (m.label)}
                  <div class="space-y-0.5">
                    <p class="text-muted-foreground font-mono text-xs tracking-wider uppercase">{m.label}</p>
                    <div class="flex items-baseline gap-1">
                      <span class="text-foreground text-xs font-semibold">{m.value}</span>
                      <span class="text-success font-mono text-xs">{m.trend}</span>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Live Interactive Simulation Canvas (7 Cols) -->
      <div class="lg:col-span-7">
        <Card class="bg-card border-border sticky top-6 overflow-hidden shadow-sm">
          <!-- Workbench Header Bar -->
          <CardHeader
            class="border-border bg-muted/20 flex-row items-center justify-between space-y-0 border-b px-5 py-3.5"
          >
            <div class="flex items-center gap-2.5">
              <div class="bg-success flex size-2 rounded-full"></div>
              <span class="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                Interactive Simulation
              </span>
              <Separator orientation="vertical" class="h-3.5" />
              <span class="text-foreground text-xs font-semibold">{activeFeature.title}</span>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-7 gap-1.5 px-2.5 font-mono text-xs"
                onclick={() => copySnippet(JSON.stringify(activeFeature, null, 2))}
              >
                {#if copied}
                  <Check class="text-success size-3" />
                {:else}
                  <Copy class="size-3" />
                {/if}
                <span>{copied ? 'Copied' : 'Schema JSON'}</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent class="space-y-6 p-6">
            <!-- Simulation 1: Global Employee Directory -->
            {#if activeFeature.previewType === 'directory'}
              <DirectorySimulation />
            {:else if activeFeature.previewType === 'payroll'}
              <!-- Simulation 2: Multi-Currency Global Payroll -->
              <PayrollSimulation />
            {:else if activeFeature.previewType === 'compliance'}
              <!-- Simulation 3: SOC 2 & Compliance -->
              <ComplianceSimulation />
            {:else if activeFeature.previewType === 'api'}
              <!-- Simulation 4: Developer APIs & SDKs -->
              <ApiSimulation />
            {:else}
              <!-- Simulation 5: AI Copilot & Agentic Ops -->
              <CopilotSimulation />
            {/if}
          </CardContent>

          <CardFooter class="border-border bg-muted/10 flex items-center justify-between border-t px-5 py-3 text-xs">
            <span class="text-muted-foreground font-mono">Architecture SLA: 99.99% Multi-region Active-Active</span>
            <Button variant="link" size="sm" class="text-primary h-auto gap-1 p-0 text-xs">
              Explore Full Documentation
              <ArrowRight class="size-3.5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</section>
