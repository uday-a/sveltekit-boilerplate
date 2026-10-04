<script lang="ts">
  import { Quote } from '@lucide/svelte'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { cn } from '$lib/utils'

  const testimonials = [
    {
      quote:
        'We replaced four spreadsheets and two SaaS tools with this. Onboarding time dropped from 6 days to under 4 hours.',
      name: 'Aisha Rahman',
      role: 'Head of People',
      company: 'Northwind Logistics',
      initials: 'AR',
    },
    {
      quote:
        'The audit trail alone is worth it. SOC2 evidence collection went from a quarterly nightmare to a one-click export.',
      name: 'Marco Vidal',
      role: 'Director of Compliance',
      company: 'Helio Health',
      initials: 'MV',
    },
    {
      quote:
        'My favourite part is how fast it is. No spinners, no loading states. Search returns instantly across the entire org.',
      name: 'Tomoko Saito',
      role: 'IT Operations',
      company: 'Pixel & Co',
      initials: 'TS',
    },
  ]

  let active = $state(0)
  const current = $derived(testimonials[active])
</script>

<section data-slot="testimonials-01" class="bg-muted/30">
  <div class="mx-auto max-w-4xl px-6 py-24">
    <div class="text-center">
      <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Testimonials</p>
      <h2 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Loved by teams everywhere</h2>
    </div>

    <Card class="mt-10">
      <CardContent class="space-y-6 p-8 text-center">
        <Quote class="text-primary mx-auto size-8" />
        <p class="text-foreground text-xl leading-relaxed sm:text-2xl">&ldquo;{current.quote}&rdquo;</p>
        <div class="flex flex-col items-center gap-2">
          <Avatar class="size-12">
            <AvatarFallback>{current.initials}</AvatarFallback>
          </Avatar>
          <div>
            <p class="text-sm font-semibold">{current.name}</p>
            <p class="text-muted-foreground text-xs">{current.role} · {current.company}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="mt-6 flex justify-center gap-2">
      {#each testimonials as t, i (t.name)}
        <button
          type="button"
          aria-label={`Show testimonial from ${t.name}`}
          aria-current={i === active}
          class={cn(
            'size-2 rounded-full transition-all duration-200',
            i === active ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60',
          )}
          onclick={() => (active = i)}
        ></button>
      {/each}
    </div>
  </div>
</section>
