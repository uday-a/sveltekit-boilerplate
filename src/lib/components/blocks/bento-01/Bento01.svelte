<script lang="ts">
  import {
    Activity,
    ArrowRight,
    Bot,
    CheckCircle2,
    Globe2,
    Layers,
    ShieldCheck,
    Terminal,
    Zap,
  } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Progress } from '$lib/components/ui/progress'
  import { cn } from '$lib/utils'

  interface Props {
    class?: string
  }

  let { class: className }: Props = $props()

  let activeEventFilter = $state<'all' | 'deploy' | 'security' | 'database'>('all')
  let isSimulatingPrompt = $state(false)
  let aiPromptInput = $state('Optimize database indexing for high concurrency tenant reads')
  let aiDraftOutput = $state(
    'Generated compound B-Tree index on `(tenant_id, created_at DESC)` reducing p99 latency from 142ms to 6ms.',
  )

  const liveTelemetryEvents = [
    {
      id: 1,
      type: 'deploy',
      title: 'Edge worker edge-us-east-1 deployed',
      latency: '18ms',
      time: '12s ago',
      status: 'healthy',
    },
    {
      id: 2,
      type: 'database',
      title: 'CDC stream synced 42,800 records',
      latency: '4ms',
      time: '34s ago',
      status: 'healthy',
    },
    {
      id: 3,
      type: 'security',
      title: 'Automated mTLS key rotation complete',
      latency: '120ms',
      time: '1m ago',
      status: 'healthy',
    },
    {
      id: 4,
      type: 'deploy',
      title: 'Static asset bundle cached in 32 edge PoPs',
      latency: '8ms',
      time: '2m ago',
      status: 'healthy',
    },
  ]

  const filteredEvents = $derived(
    activeEventFilter === 'all' ? liveTelemetryEvents : liveTelemetryEvents.filter((e) => e.type === activeEventFilter),
  )

  const edgeRegions = [
    { code: 'iad1', name: 'US East (N. Virginia)', status: 'Active', latency: '12ms' },
    { code: 'fra1', name: 'EU Central (Frankfurt)', status: 'Active', latency: '18ms' },
    { code: 'hnd1', name: 'AP East (Tokyo)', status: 'Active', latency: '24ms' },
  ]

  function runAiOptimization() {
    isSimulatingPrompt = true
    aiDraftOutput = 'Analyzing query AST and cache hit rates...'
    setTimeout(() => {
      aiDraftOutput = 'Applied index pushdown & partitioned query plan. Estimated cache hit rate: 98.4%.'
      isSimulatingPrompt = false
    }, 900)
  }
</script>

<section data-slot="bento-01" class={cn('bg-background w-full py-16 sm:py-24', className)}>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-12 max-w-2xl space-y-3">
      <div
        class="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-2xs"
      >
        <Layers class="size-3.5" />
        <span>Unified Enterprise Architecture</span>
      </div>
      <h2 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
        Everything your engineering team needs to move at velocity
      </h2>
      <p class="text-muted-foreground text-base sm:text-lg">
        Engineered for extreme performance, continuous security governance, and multi-cloud resilience from day one.
      </p>
    </div>

    <!-- Bento Grid (High Density) -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- Tile 1: AI Code & Query Optimization Copilot (Span 2 cols on desktop) -->
      <Card
        class="border-border bg-card hover:border-primary/40 relative overflow-hidden shadow-xs transition-colors duration-200 md:col-span-2"
      >
        <CardContent class="flex h-full flex-col justify-between space-y-6 p-6 sm:p-8">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Bot class="size-5" />
              </div>
              <div>
                <h3 class="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
                  Autonomous AI Query & Performance Copilot
                </h3>
                <p class="text-muted-foreground text-xs">
                  Analyzes production query patterns in real-time and recommends zero-downtime optimizations.
                </p>
              </div>
            </div>
            <Badge variant="secondary" class="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
              LLM Grounded · v4.8
            </Badge>
          </div>

          <!-- Interactive Mini Workbench -->
          <div class="border-border bg-muted/30 space-y-4 rounded-xl border p-4 sm:p-5">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="text-muted-foreground font-mono">Input Prompt Context:</span>
              <span class="text-success inline-flex items-center gap-1 font-medium">
                <CheckCircle2 class="size-3.5" />
                <span>AST Validated</span>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <input
                  bind:value={aiPromptInput}
                  type="text"
                  class="border-border bg-card text-foreground focus:border-primary w-full rounded-md border px-3 py-2 font-mono text-xs focus:outline-hidden"
                />
              </div>
              <Button
                size="sm"
                class="h-9 gap-1.5 text-xs font-medium"
                disabled={isSimulatingPrompt}
                onclick={runAiOptimization}
              >
                <Zap class="size-3.5 fill-current" />
                <span>{isSimulatingPrompt ? 'Running...' : 'Optimize'}</span>
              </Button>
            </div>

            <!-- AI Result Output -->
            <div class="border-border/80 bg-card text-foreground space-y-2 rounded-lg border p-3.5 font-mono text-xs">
              <div class="text-muted-foreground flex items-center justify-between text-xs">
                <span class="flex items-center gap-1.5">
                  <Terminal class="text-primary size-3" />
                  <span>Optimization Plan Output</span>
                </span>
                <span class="text-success font-semibold">98.4% Efficiency Gain</span>
              </div>
              <p class="text-foreground leading-relaxed">{aiDraftOutput}</p>
            </div>
          </div>

          <div class="border-border grid grid-cols-3 gap-4 border-t pt-2 text-center text-xs">
            <div>
              <p class="text-foreground font-mono text-base font-semibold">0.4ms</p>
              <p class="text-muted-foreground">Inference Overhead</p>
            </div>
            <div>
              <p class="text-foreground font-mono text-base font-semibold">99.8%</p>
              <p class="text-muted-foreground">Syntactic Accuracy</p>
            </div>
            <div>
              <p class="text-foreground font-mono text-base font-semibold">3.4M</p>
              <p class="text-muted-foreground">Queries Analyzed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Tile 2: Global Edge Network & Latency Radar -->
      <Card
        class="border-border bg-card hover:border-primary/40 relative overflow-hidden shadow-xs transition-colors duration-200"
      >
        <CardContent class="flex h-full flex-col justify-between space-y-6 p-6">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Globe2 class="size-5" />
              </div>
              <span
                class="bg-success/10 text-success border-success/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold"
              >
                <span class="bg-success size-1.5 rounded-full"></span>
                <span>32 Edge PoPs</span>
              </span>
            </div>
            <div>
              <h3 class="text-foreground text-lg font-semibold tracking-tight">Global Edge Mesh</h3>
              <p class="text-muted-foreground text-xs">
                Sub-20ms p99 execution worldwide with automatic zero-downtime failover routing.
              </p>
            </div>
          </div>

          <!-- Edge Regions List -->
          <div class="border-border bg-muted/20 space-y-2.5 rounded-lg border p-3">
            {#each edgeRegions as region (region.code)}
              <div
                class="border-border/50 flex items-center justify-between border-b py-1 text-xs last:border-0"
              >
                <div class="flex items-center gap-2">
                  <span class="text-foreground font-mono text-xs font-semibold uppercase">{region.code}</span>
                  <span class="text-muted-foreground max-w-[120px] truncate">{region.name}</span>
                </div>
                <span class="text-primary font-mono text-xs font-semibold">{region.latency}</span>
              </div>
            {/each}
          </div>

          <div class="space-y-2">
            <div class="text-muted-foreground flex justify-between font-mono text-xs">
              <span>Global Route SLA</span>
              <span class="text-foreground font-semibold">99.995%</span>
            </div>
            <Progress value={99.9} class="h-1.5" />
          </div>
        </CardContent>
      </Card>

      <!-- Tile 3: Live Telemetry Event Stream (Span 2 cols on lg) -->
      <Card
        class="border-border bg-card hover:border-primary/40 relative overflow-hidden shadow-xs transition-colors duration-200 lg:col-span-2"
      >
        <CardContent class="flex h-full flex-col justify-between space-y-6 p-6 sm:p-8">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Activity class="size-5" />
              </div>
              <div>
                <h3 class="text-foreground text-lg font-semibold tracking-tight">Real-Time Event Stream</h3>
                <p class="text-muted-foreground text-xs">
                  Deterministic audit feed capturing deployments, schema migrations, and security operations.
                </p>
              </div>
            </div>

            <!-- Filter Tabs -->
            <div class="border-border bg-muted/40 flex items-center gap-1 rounded-lg border p-1">
              <button
                type="button"
                class={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  activeEventFilter === 'all'
                    ? 'bg-card text-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onclick={() => (activeEventFilter = 'all')}
              >
                All
              </button>
              <button
                type="button"
                class={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  activeEventFilter === 'deploy'
                    ? 'bg-card text-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onclick={() => (activeEventFilter = 'deploy')}
              >
                Deploy
              </button>
              <button
                type="button"
                class={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  activeEventFilter === 'database'
                    ? 'bg-card text-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onclick={() => (activeEventFilter = 'database')}
              >
                Data
              </button>
              <button
                type="button"
                class={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  activeEventFilter === 'security'
                    ? 'bg-card text-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onclick={() => (activeEventFilter = 'security')}
              >
                Security
              </button>
            </div>
          </div>

          <!-- Event Feed Table -->
          <div class="divide-border border-border bg-muted/20 divide-y rounded-xl border">
            {#each filteredEvents as ev (ev.id)}
              <div
                class="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-3 p-3.5 text-xs transition-colors"
              >
                <div class="flex items-center gap-2.5">
                  <span class="bg-success size-2 rounded-full"></span>
                  <span class="text-foreground font-medium">{ev.title}</span>
                </div>
                <div class="text-muted-foreground flex items-center gap-3 font-mono">
                  <span class="bg-muted text-foreground rounded px-1.5 py-0.5">{ev.latency}</span>
                  <span>{ev.time}</span>
                </div>
              </div>
            {/each}
          </div>

          <div
            class="text-muted-foreground border-border flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs"
          >
            <span class="flex items-center gap-1.5">
              <ShieldCheck class="text-success size-4" />
              <span>Zero message loss guaranteed via Raft consensus</span>
            </span>
            <span class="font-mono">Throughput: ~14,200 ev/sec</span>
          </div>
        </CardContent>
      </Card>

      <!-- Tile 4: Enterprise Security & Compliance Vault -->
      <Card
        class="border-border bg-card hover:border-primary/40 relative overflow-hidden shadow-xs transition-colors duration-200"
      >
        <CardContent class="flex h-full flex-col justify-between space-y-6 p-6">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <ShieldCheck class="size-5" />
              </div>
              <Badge variant="outline" class="font-mono text-xs">SOC 2 Type II</Badge>
            </div>
            <div>
              <h3 class="text-foreground text-lg font-semibold tracking-tight">Compliance & Vault</h3>
              <p class="text-muted-foreground text-xs">
                Continuous cryptographic verification, automated KMS key rotation, and granular RBAC.
              </p>
            </div>
          </div>

          <div class="border-border bg-muted/20 space-y-3 rounded-lg border p-3.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">AES-256 GCM at rest</span>
              <span class="text-success flex items-center gap-1 font-semibold">
                <CheckCircle2 class="size-3.5" /> Enforced
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">mTLS v1.3 in transit</span>
              <span class="text-success flex items-center gap-1 font-semibold">
                <CheckCircle2 class="size-3.5" /> Enforced
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">SCIM v2 Directory Sync</span>
              <span class="text-foreground font-semibold">Active</span>
            </div>
          </div>

          <Button variant="outline" class="h-9 w-full gap-1.5 text-xs font-semibold">
            <span>View Trust Center</span>
            <ArrowRight class="size-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</section>
