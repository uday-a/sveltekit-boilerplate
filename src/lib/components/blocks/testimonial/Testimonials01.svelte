<script lang="ts" module>
  export type WorkbenchIndustry = 'all' | 'saas' | 'healthtech' | 'fintech' | 'devtools'

  interface WorkbenchTestimonial {
    id: string
    name: string
    role: string
    company: string
    industry: 'saas' | 'healthtech' | 'fintech' | 'devtools'
    initials: string
    avatarBg: string
    quote: string
    subquote: string
    rating: number
    verifiedBadge: string
    metrics: { label: string; value: string; trend: string }[]
    stack: string[]
  }
</script>

<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { BadgeCheck, CheckCircle2, ChevronLeft, ChevronRight, Pause, Play, Quote, Star } from '@lucide/svelte'
  import { cn } from '$lib/utils'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card } from '$lib/components/ui/card'

  const testimonials: WorkbenchTestimonial[] = [
    {
      id: '1',
      name: 'Aisha Rahman',
      role: 'VP of People & Operations',
      company: 'Northwind Global Logistics',
      industry: 'saas',
      initials: 'AR',
      avatarBg: 'bg-info/10 text-info border-info/20',
      quote:
        'We replaced four legacy spreadsheets and two disjointed SaaS subscriptions with UIPKGE blocks. Onboarding time dropped from 6 days to under 4 hours.',
      subquote:
        'The unbundled registry architecture gave our engineers total ownership without ever dealing with broken npm updates or rigid vendor locks.',
      rating: 5,
      verifiedBadge: 'Verified Enterprise Customer · 2,400+ Seats',
      metrics: [
        { label: 'Onboarding Velocity', value: '< 4 hours', trend: '-88% time' },
        { label: 'SaaS Tooling Spend', value: '$140k / yr', trend: 'Saved' },
        { label: 'Employee NPS', value: '+74', trend: 'Top Decile' },
      ],
      stack: ['Svelte 5', 'Tailwind CSS v4', 'PostgreSQL', 'SCIM Okta'],
    },
    {
      id: '2',
      name: 'Marco Vidal',
      role: 'Director of Information Security',
      company: 'Helio Health Systems',
      industry: 'healthtech',
      initials: 'MV',
      avatarBg: 'bg-success/10 text-success border-success/20',
      quote:
        'SOC 2 and HIPAA evidence collection went from a grueling quarterly nightmare to a continuous, automated background audit trail.',
      subquote:
        'Our external auditors completed our Type II examination in record time because every UI state change is cryptographically verifiable.',
      rating: 5,
      verifiedBadge: 'Verified Healthcare Provider · HIPAA Tier 1',
      metrics: [
        { label: 'Audit Prep Duration', value: '1.5 days', trend: 'Down from 3 wks' },
        { label: 'Compliance Adherence', value: '100.0%', trend: '142 Controls' },
        { label: 'Zero Trust Rollout', value: '14 Days', trend: '100% Org' },
      ],
      stack: ['SvelteKit', 'Runes Primitives', 'Cloudflare Workers', 'AuditLog API'],
    },
    {
      id: '3',
      name: 'Tomoko Saito',
      role: 'Staff Infrastructure Architect',
      company: 'Pixel & Co Engine Labs',
      industry: 'devtools',
      initials: 'TS',
      avatarBg: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
      quote:
        'My favourite part is how blazing fast it is. Sub-20ms P99 search latencies across 50,000 workforce records without a single loading spinner.',
      subquote:
        'Keyboard shortcuts for every workflow make our engineering managers feel like they are operating a sleek CLI rather than a web dashboard.',
      rating: 5,
      verifiedBadge: 'Verified DevTools Customer · 450+ Devs',
      metrics: [
        { label: 'P99 Edge Latency', value: '18ms', trend: 'Global Edge' },
        { label: 'Daily Hotkey Actions', value: '42k / day', trend: '+310%' },
        { label: 'Memory Footprint', value: '< 12MB', trend: 'Zero bloat' },
      ],
      stack: ['Svelte 5', 'Vite', 'Turborepo', 'WebAssembly'],
    },
    {
      id: '4',
      name: 'Julian Montgomery',
      role: 'Chief Financial Officer',
      company: 'Vanguard FinTech Matrix',
      industry: 'fintech',
      initials: 'JM',
      avatarBg: 'bg-warning/10 text-warning border-warning/20',
      quote:
        'Multi-currency payroll runs across 34 countries used to require 5 days of manual reconciliation. Now it settles automatically with zero FX fee slippage.',
      subquote:
        'Direct ledger sync and real-time tax calculations give our board instant visibility into gross-to-net runway.',
      rating: 5,
      verifiedBadge: 'Verified FinTech Customer · $800M+ Volume',
      metrics: [
        { label: 'Payroll Settlement', value: 'Instant', trend: 'FedNow / SEPA' },
        { label: 'FX Reconciliation', value: '0.00%', trend: 'Zero error' },
        { label: 'Tax Auto-filing', value: '34 Regs', trend: 'Statutory' },
      ],
      stack: ['SvelteKit', 'Svelte 5', 'Tailwind v4', 'Stripe Treasury'],
    },
  ]

  const industries: { id: WorkbenchIndustry; label: string }[] = [
    { id: 'all', label: 'All Industries' },
    { id: 'saas', label: 'Enterprise SaaS' },
    { id: 'healthtech', label: 'HealthTech' },
    { id: 'devtools', label: 'Developer DX' },
    { id: 'fintech', label: 'FinTech' },
  ]

  let activeIndex = $state(0)
  let activeIndustry = $state<WorkbenchIndustry>('all')
  let isAutoPlaying = $state(true)
  let timer: ReturnType<typeof setInterval> | undefined

  const filteredTestimonials = $derived(
    activeIndustry === 'all' ? testimonials : testimonials.filter((t) => t.industry === activeIndustry),
  )

  const activeTestimonial = $derived(
    filteredTestimonials[activeIndex] ?? filteredTestimonials[0] ?? testimonials[0]!,
  )

  function setIndustry(id: WorkbenchIndustry) {
    activeIndustry = id
    activeIndex = 0
  }

  function next() {
    activeIndex = (activeIndex + 1) % filteredTestimonials.length
  }

  function prev() {
    activeIndex = (activeIndex - 1 + filteredTestimonials.length) % filteredTestimonials.length
  }

  function startTimer() {
    if (timer) clearInterval(timer)
    if (!isAutoPlaying) return
    timer = setInterval(() => {
      next()
    }, 6500)
  }

  function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying
    if (isAutoPlaying) {
      startTimer()
    } else if (timer) {
      clearInterval(timer)
    }
  }

  onMount(() => {
    startTimer()
  })

  onDestroy(() => {
    if (timer) clearInterval(timer)
  })
</script>

<section
  data-slot="testimonials-01"
  class="bg-background border-border relative w-full overflow-hidden border-y py-16 lg:py-24"
>
  <div class="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
    <!-- Section Header -->
    <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div class="max-w-2xl space-y-3">
        <div class="inline-flex items-center gap-2">
          <Badge
            variant="outline"
            class="border-primary/30 text-primary bg-primary/5 gap-1.5 px-2.5 py-1 font-mono text-xs tracking-wide uppercase"
          >
            <BadgeCheck class="size-3.5" />
            Verified Case Studies
          </Badge>
          <span class="text-muted-foreground font-mono text-xs">Real-World Customer Telemetry</span>
        </div>
        <h2 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
          Trusted by the Teams Building the Future.
        </h2>
        <p class="text-muted-foreground text-base leading-relaxed sm:text-lg">
          See how high-growth scaleups and enterprise leaders accelerate engineering velocity and operational clarity.
        </p>
      </div>

      <!-- Industry Filter Switcher -->
      <div class="bg-muted/60 border-border flex flex-wrap items-center gap-1.5 rounded-lg border p-1">
        {#each industries as cat (cat.id)}
          <button
            type="button"
            class={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              activeIndustry === cat.id
                ? 'bg-background text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onclick={() => setIndustry(cat.id)}
          >
            {cat.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Featured Testimonial Canvas -->
    <Card class="bg-card border-border overflow-hidden shadow-md">
      <div class="grid grid-cols-1 lg:grid-cols-12">
        <!-- Left Main Quote Area (7 cols) -->
        <div class="flex flex-col justify-between space-y-8 p-6 sm:p-10 lg:col-span-7">
          <div class="space-y-6">
            <!-- Rating & Badge -->
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="text-warning flex items-center gap-1">
                {#each Array.from({ length: activeTestimonial.rating }, (_, s) => s) as s (s)}
                  <Star class="fill-warning size-4" />
                {/each}
              </div>
              <Badge variant="outline" class="border-success/20 bg-success/10 text-success gap-1.5 font-mono text-xs">
                <CheckCircle2 class="size-3" />
                {activeTestimonial.verifiedBadge}
              </Badge>
            </div>

            <!-- Quote Content -->
            <div class="relative space-y-3">
              <Quote class="text-primary/20 absolute -top-4 -left-3 -z-10 size-8" />
              <p class="text-foreground text-xl leading-relaxed font-medium tracking-tight sm:text-2xl">
                &ldquo;{activeTestimonial.quote}&rdquo;
              </p>
              <p class="text-muted-foreground text-sm leading-relaxed">
                {activeTestimonial.subquote}
              </p>
            </div>
          </div>

          <!-- Author Info & Controls -->
          <div class="border-border flex flex-col justify-between gap-4 border-t pt-6 sm:flex-row sm:items-center">
            <div class="flex items-center gap-3.5">
              <div
                class={cn(
                  'flex size-11 items-center justify-center rounded-full border text-sm font-semibold',
                  activeTestimonial.avatarBg,
                )}
              >
                {activeTestimonial.initials}
              </div>
              <div>
                <h4 class="text-foreground text-sm font-semibold">{activeTestimonial.name}</h4>
                <p class="text-muted-foreground text-xs">
                  {activeTestimonial.role} ·
                  <span class="text-foreground font-medium">{activeTestimonial.company}</span>
                </p>
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                class="size-8 rounded-lg"
                aria-label="Previous customer story"
                onclick={prev}
              >
                <ChevronLeft class="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="size-8 rounded-lg"
                aria-label={isAutoPlaying ? 'Pause rotation' : 'Resume rotation'}
                onclick={toggleAutoPlay}
              >
                {#if isAutoPlaying}
                  <Pause class="text-primary size-3.5" />
                {:else}
                  <Play class="size-3.5" />
                {/if}
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="size-8 rounded-lg"
                aria-label="Next customer story"
                onclick={next}
              >
                <ChevronRight class="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Right Telemetry & Metrics Sidebar (5 cols) -->
        <div
          class="bg-muted/20 border-border flex flex-col justify-between space-y-6 border-t p-6 sm:p-8 lg:col-span-5 lg:border-t-0 lg:border-l"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground font-mono text-xs tracking-wider uppercase">Impact Telemetry</span>
              <span class="text-success font-mono text-xs">Production Validated</span>
            </div>

            <!-- Metrics Grid -->
            <div class="space-y-3">
              {#each activeTestimonial.metrics as m (m.label)}
                <div
                  class="border-border bg-card/80 flex items-center justify-between rounded-lg border p-3.5 shadow-xs"
                >
                  <div>
                    <p class="text-muted-foreground text-xs">{m.label}</p>
                    <p class="text-foreground mt-0.5 text-lg font-semibold tracking-tight">{m.value}</p>
                  </div>
                  <Badge variant="secondary" class="bg-success/10 text-success font-mono text-xs font-semibold">
                    {m.trend}
                  </Badge>
                </div>
              {/each}
            </div>

            <!-- Stack Tags -->
            <div class="space-y-2 pt-2">
              <p class="text-muted-foreground font-mono text-xs tracking-wider uppercase">Tech Stack Architecture</p>
              <div class="flex flex-wrap gap-1.5">
                {#each activeTestimonial.stack as tech (tech)}
                  <Badge variant="outline" class="bg-background font-mono text-xs">
                    {tech}
                  </Badge>
                {/each}
              </div>
            </div>
          </div>

          <!-- Story Navigation Dots -->
          <div class="border-border/60 flex items-center justify-between border-t pt-4">
            <div class="flex items-center gap-1.5">
              {#each filteredTestimonials as t, i (t.id)}
                <button
                  type="button"
                  aria-label={`Jump to testimonial ${i + 1}`}
                  class={cn(
                    'h-1.5 rounded-full transition-colors duration-300',
                    i === activeIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60 w-2',
                  )}
                  onclick={() => (activeIndex = i)}
                ></button>
              {/each}
            </div>
            <span class="text-muted-foreground font-mono text-xs">
              {activeIndex + 1} of {filteredTestimonials.length} Stories
            </span>
          </div>
        </div>
      </div>
    </Card>
  </div>
</section>
