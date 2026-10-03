<script lang="ts" module>
  export interface FaqItem {
    id: string
    question: string
    answer: string
    category: 'ownership' | 'security' | 'architecture' | 'pricing'
    tags: string[]
    helpfulCount: number
  }
</script>

<script lang="ts">
  import {
    ExternalLink,
    FileQuestion,
    HelpCircle,
    Mail,
    MessageSquare,
    Search,
    ThumbsDown,
    ThumbsUp,
  } from '@lucide/svelte'
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '$lib/components/ui/accordion'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { cn } from '$lib/utils'

  const faqs: FaqItem[] = [
    {
      id: 'ownership',
      question: 'Do I actually own the component code after running the add command?',
      answer:
        'Yes, 100%. UIPKGE follows the unbundled registry architecture pioneered by shadcn. When you run `npx shadcn-svelte add` or `npx shadcn add`, the raw TypeScript, Svelte, and variant files are copied directly into your repository. You are never bound to semver release cycles or rigid third-party package internals.',
      category: 'ownership',
      tags: ['Ownership', 'Zero Lock-in', 'MIT License'],
      helpfulCount: 342,
    },
    {
      id: 'security',
      question: 'How do you ensure zero supply-chain security risks without npm packages?',
      answer:
        'Every registry manifest and code payload is statically generated and cryptographically verifiable. Because source files live in your project tree, your static analysis tools (SonarQube, Snyk, ESLint, TypeScript compiler) inspect every single line of code during your existing CI pipeline with zero runtime black boxes.',
      category: 'security',
      tags: ['SOC 2', 'Zero Black Box', 'Static Audit'],
      helpfulCount: 289,
    },
    {
      id: 'architecture',
      question: 'How does cross-framework parity work between Svelte 5, Vue 3, and React 19?',
      answer:
        'All three registry trees are built against canonical shared Tailwind v4 design tokens and CVA variants in `packages/shared/`. Vue components leverage Reka UI primitives, React components leverage Radix UI primitives, and Svelte components hand-roll the same headless behaviour with runes, ensuring identical DOM contracts, keyboard navigation, and accessibility semantics.',
      category: 'architecture',
      tags: ['Svelte 5', 'Vue 3.5', 'React 19', 'Tailwind v4'],
      helpfulCount: 215,
    },
    {
      id: 'migration',
      question: 'Can we integrate these blocks into an existing Tailwind v4 or SvelteKit project?',
      answer:
        'Absolutely. You only need to run `npx shadcn-svelte add @uipkge/svelte/init` to configure the baseline `@theme` tokens and `cn()` utility in your CSS. From there, individual blocks and primitives can be added incrementally without rewriting your existing styles.',
      category: 'architecture',
      tags: ['SvelteKit', 'Tailwind v4', 'Vite'],
      helpfulCount: 198,
    },
    {
      id: 'pricing',
      question: 'What is the pricing model for commercial applications and vertical SaaS?',
      answer:
        'The UIPKGE registry is 100% open source under the permissive MIT license. You can use all primitives and blocks in personal projects, commercial SaaS products, and internal client applications with zero licensing fees or seat royalties.',
      category: 'pricing',
      tags: ['MIT License', 'Commercial Use', 'Free Forever'],
      helpfulCount: 456,
    },
    {
      id: 'updates',
      question: 'How do we pull updates or improvements to components we already copied?',
      answer:
        'Because you own the code, you can inspect diffs using Git. If you want to re-pull the newest upstream implementation of a component or block, simply run `npx shadcn-svelte add <name> --overwrite` and review the git diff in your IDE before committing.',
      category: 'ownership',
      tags: ['Git Diff', 'Custom Overwrites', 'Upgrades'],
      helpfulCount: 167,
    },
  ]

  let searchQuery = $state('')
  let activeCategory = $state<'all' | 'ownership' | 'security' | 'architecture' | 'pricing'>('all')
  let votedMap = $state<Record<string, 'up' | 'down'>>({})

  function vote(id: string, dir: 'up' | 'down') {
    if (votedMap[id] === dir) {
      const { [id]: _removed, ...rest } = votedMap
      votedMap = rest
    } else {
      votedMap = { ...votedMap, [id]: dir }
    }
  }

  const filteredFaqs = $derived(
    faqs.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    }),
  )

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'ownership', label: 'Ownership' },
    { id: 'security', label: 'Security' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'pricing', label: 'Licensing' },
  ] as const
</script>

<section data-slot="faq-01" class="bg-background border-border relative w-full border-y py-16 lg:py-24">
  <div class="mx-auto max-w-5xl space-y-12 px-4 sm:px-6 lg:px-8">
    <!-- Section Header -->
    <div class="mx-auto max-w-2xl space-y-4 text-center">
      <div class="inline-flex items-center gap-2">
        <Badge
          variant="outline"
          class="border-primary/30 text-primary bg-primary/5 gap-1.5 px-2.5 py-1 font-mono text-xs tracking-wide uppercase"
        >
          <HelpCircle class="size-3.5" />
          Knowledge Base
        </Badge>
        <span class="text-muted-foreground font-mono text-xs">Architecture & Licensing</span>
      </div>
      <h2 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
        Frequently Answered Architecture Questions.
      </h2>
      <p class="text-muted-foreground text-base leading-relaxed sm:text-lg">
        Everything you need to know about component ownership, security verification, and multi-framework integration.
      </p>
    </div>

    <!-- Search and Filter Bar -->
    <div
      class="bg-card border-border flex flex-col items-center justify-between gap-4 rounded-xl border p-3 shadow-xs sm:flex-row"
    >
      <div class="relative w-full sm:w-80">
        <Search class="text-muted-foreground absolute top-2.5 left-3 size-4" />
        <Input bind:value={searchQuery} placeholder="Search questions or keywords..." class="h-9 pl-9 font-sans text-xs" />
      </div>

      <div class="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
        {#each categories as cat (cat.id)}
          <button
            type="button"
            class={cn(
              'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
            onclick={() => (activeCategory = cat.id)}
          >
            {cat.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- FAQ Accordion List -->
    <div class="space-y-4">
      {#if filteredFaqs.length === 0}
        <div class="space-y-3 py-12 text-center">
          <FileQuestion class="text-muted-foreground mx-auto size-10" />
          <p class="text-foreground text-sm font-medium">No matching questions found</p>
          <p class="text-muted-foreground text-xs">Try adjusting your search query or topic filter.</p>
        </div>
      {:else}
        <Accordion type="multiple" class="w-full space-y-3">
          {#each filteredFaqs as item (item.id)}
            <AccordionItem
              value={item.id}
              class="border-border bg-card/60 data-[state=open]:bg-card data-[state=open]:border-primary/40 rounded-xl border px-5 transition-colors data-[state=open]:shadow-xs"
            >
              <AccordionTrigger class="py-4 text-left hover:no-underline">
                <div class="flex items-center gap-3 pr-4">
                  <span class="text-foreground text-sm font-semibold tracking-tight sm:text-base">
                    {item.question}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent
                class="text-muted-foreground border-border/50 space-y-4 border-t pt-1 pb-5 text-xs leading-relaxed sm:text-sm"
              >
                <p>{item.answer}</p>

                <!-- Meta tags & feedback row -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    {#each item.tags as tag (tag)}
                      <Badge variant="secondary" class="font-mono text-xs">
                        {tag}
                      </Badge>
                    {/each}
                  </div>

                  <div class="text-muted-foreground flex items-center gap-2 text-xs">
                    <span>Helpful?</span>
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        class={cn(
                          'hover:bg-muted inline-flex items-center gap-1 rounded p-1 text-xs transition-colors',
                          votedMap[item.id] === 'up' ? 'text-success font-semibold' : '',
                        )}
                        onclick={() => vote(item.id, 'up')}
                      >
                        <ThumbsUp class="size-3.5" />
                        <span>{item.helpfulCount + (votedMap[item.id] === 'up' ? 1 : 0)}</span>
                      </button>
                      <button
                        type="button"
                        class={cn(
                          'hover:bg-muted inline-flex items-center gap-1 rounded p-1 text-xs transition-colors',
                          votedMap[item.id] === 'down' ? 'text-destructive font-semibold' : '',
                        )}
                        onclick={() => vote(item.id, 'down')}
                      >
                        <ThumbsDown class="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          {/each}
        </Accordion>
      {/if}
    </div>

    <!-- Support & Helpdesk CTA Box -->
    <Card
      class="bg-muted/30 border-border flex flex-col items-center justify-between gap-4 rounded-xl p-6 sm:flex-row"
    >
      <div class="flex items-center gap-3.5 text-left">
        <div
          class="bg-primary/10 text-primary border-primary/20 flex size-10 shrink-0 items-center justify-center rounded-lg border"
        >
          <MessageSquare class="size-5" />
        </div>
        <div>
          <h4 class="text-foreground text-sm font-semibold">Have an edge-case or enterprise question?</h4>
          <p class="text-muted-foreground mt-0.5 text-xs">
            Join our Discord community or open an architecture RFC on GitHub.
          </p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-2.5">
        <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
          {#snippet child({ props })}
            <a {...props} href="https://github.com/uday-a/uipkge-registry/issues" target="_blank" rel="noreferrer">
              <ExternalLink class="size-3.5" />
              Open GitHub RFC
            </a>
          {/snippet}
        </Button>
        <Button size="sm" class="h-8 gap-1.5 text-xs">
          {#snippet child({ props })}
            <a {...props} href="mailto:hello@uipkge.dev">
              <Mail class="size-3.5" />
              Contact Architecture Team
            </a>
          {/snippet}
        </Button>
      </div>
    </Card>
  </div>
</section>
