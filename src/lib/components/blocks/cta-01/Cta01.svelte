<script lang="ts" module>
  export type CtaFramework = 'vue' | 'react' | 'svelte'
</script>

<script lang="ts">
  import {
    ArrowRight,
    Check,
    CheckCircle2,
    Code2,
    Copy,
    Download,
    Globe,
    Layers,
    ShieldCheck,
    Zap,
  } from '@lucide/svelte'
  import { cn } from '$lib/utils'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card } from '$lib/components/ui/card'

  let activeFramework = $state<CtaFramework>('vue')
  let copied = $state(false)
  const pingMs = 14

  const installCommands: Record<CtaFramework, { command: string; subtitle: string }> = {
    vue: {
      command: 'npx shadcn-vue@latest add https://uipkge.dev/r/vue/init.json -y',
      subtitle: 'Zero-config Vue 3.5 + Tailwind v4 + Reka UI primitives',
    },
    react: {
      command: 'npx shadcn@latest add https://uipkge.dev/r/react/init.json -y',
      subtitle: 'Production-ready React 19 + Radix primitives + CVA variants',
    },
    svelte: {
      command: 'npx shadcn-svelte@latest add https://uipkge.dev/r/svelte/init.json -y',
      subtitle: 'SvelteKit-ready Svelte 5 runes, SSR-safe, unbundled ownership',
    },
  }

  const frameworks: { id: CtaFramework; label: string }[] = [
    { id: 'vue', label: 'Vue 3.5' },
    { id: 'react', label: 'React 19' },
    { id: 'svelte', label: 'Svelte 5' },
  ]

  function copyCommand() {
    navigator.clipboard.writeText(installCommands[activeFramework].command)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }
</script>

<section
  data-slot="cta-01"
  class="bg-background border-border relative w-full overflow-hidden border-y py-16 lg:py-24"
>
  <div class="mx-auto max-w-5xl space-y-10 px-4 text-center sm:px-6 lg:px-8">
    <!-- Eyebrow Pill -->
    <div class="inline-flex items-center gap-2">
      <Badge
        variant="outline"
        class="gap-1.5 font-mono tracking-wider uppercase"
      >
        <Zap class="size-3.5" aria-hidden="true" />
        Unbundled Registry Distribution
      </Badge>
      <div class="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
        <span class="bg-success size-2 rounded-full"></span>
        <span>CDN Edge: {pingMs}ms P99</span>
      </div>
    </div>

    <!-- Main Headline & Narrative -->
    <div class="mx-auto max-w-3xl space-y-4">
      <h2 class="text-foreground text-3xl leading-[1.15] font-semibold tracking-tight sm:text-5xl">
        Own Your UI. No Semver Lock-in. Zero Bloat.
      </h2>
      <p class="text-muted-foreground text-base leading-relaxed sm:text-lg">
        The components are the product. Source files are copied directly into your workspace. Modify, compose, and
        refactor without fighting external package boundaries.
      </p>
    </div>

    <!-- Interactive Developer Terminal Box -->
    <Card class="mx-auto max-w-2xl overflow-hidden bg-muted text-left text-foreground shadow-sm">
      <!-- Terminal Titlebar -->
      <div class="flex items-center justify-between border-b px-4 py-3">
        <div class="flex items-center gap-2">
          <div class="flex gap-1.5">
            <div class="bg-destructive/80 size-3 rounded-full"></div>
            <div class="bg-warning/80 size-3 rounded-full"></div>
            <div class="bg-success/80 size-3 rounded-full"></div>
          </div>
          <span class="text-muted-foreground ml-2 font-mono text-xs">terminal — bootstrap workspace</span>
        </div>

        <!-- Framework selector tabs -->
        <div class="flex items-center gap-1 rounded-md border bg-background p-0.5">
          {#each frameworks as fw (fw.id)}
            <button
              type="button"
              class={cn(
                'rounded px-2 py-0.5 font-mono text-xs transition-colors',
                activeFramework === fw.id
                  ? 'bg-accent font-semibold text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onclick={() => (activeFramework = fw.id)}
            >
              {fw.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Terminal Command Runner Body -->
      <div class="space-y-3 p-4 font-mono text-xs sm:p-5">
        <div class="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
          <div class="text-foreground flex items-center gap-2.5 overflow-x-auto select-all">
            <span class="text-muted-foreground shrink-0">$</span>
            <span class="whitespace-nowrap">{installCommands[activeFramework].command}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="h-7 shrink-0 gap-1.5 px-2.5 font-mono text-xs"
            onclick={copyCommand}
          >
            {#if copied}
              <Check class="text-success size-3.5" />
            {:else}
              <Copy class="size-3.5" />
            {/if}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>

        <p class="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span>{installCommands[activeFramework].subtitle}</span>
        </p>
      </div>
    </Card>

    <!-- Primary Action Buttons -->
    <div class="flex flex-wrap items-center justify-center gap-3.5 pt-2">
      <Button size="lg" class="h-11 gap-2 px-6 font-semibold shadow-sm" onclick={copyCommand}>
        <Download class="size-4" />
        {copied ? 'Command Copied to Clipboard' : 'Install Components'}
      </Button>
      <Button size="lg" variant="outline" class="h-11 gap-2 px-6 font-semibold">
        {#snippet child({ props })}
          <a href="https://github.com/uday-a/uipkge-registry" target="_blank" rel="noreferrer" {...props}>
            <Code2 class="size-4" />
            Explore Source Registry
            <ArrowRight class="size-4" />
          </a>
        {/snippet}
      </Button>
    </div>

    <!-- Trust Badges & Guarantees Grid -->
    <div class="border-border grid grid-cols-2 gap-4 border-t pt-8 text-left sm:grid-cols-4">
      <div class="flex items-start gap-2.5">
        <CheckCircle2 class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p class="text-foreground text-xs font-semibold">100% Code Ownership</p>
          <p class="text-muted-foreground mt-0.5 text-xs">Files live in your repository</p>
        </div>
      </div>
      <div class="flex items-start gap-2.5">
        <ShieldCheck class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p class="text-foreground text-xs font-semibold">Zero Runtime Bloat</p>
          <p class="text-muted-foreground mt-0.5 text-xs">No opaque wrapper dependencies</p>
        </div>
      </div>
      <div class="flex items-start gap-2.5">
        <Layers class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p class="text-foreground text-xs font-semibold">Tailwind CSS v4</p>
          <p class="text-muted-foreground mt-0.5 text-xs">OKLCH color system & tokens</p>
        </div>
      </div>
      <div class="flex items-start gap-2.5">
        <Globe class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p class="text-foreground text-xs font-semibold">Triple Framework</p>
          <p class="text-muted-foreground mt-0.5 text-xs">Strict Vue 3.5, React 19 & Svelte 5 parity</p>
        </div>
      </div>
    </div>
  </div>
</section>
