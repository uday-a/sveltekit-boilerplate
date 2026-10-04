<script lang="ts">
  import { ArrowRight } from '@lucide/svelte'
  import { page } from '$app/state'
  import { Button } from '$lib/components/ui/button'

  const loggedIn = $derived(!!page.data.user)
</script>

<section data-slot="cta-01" class="bg-background relative overflow-hidden">
  <div class="mx-auto max-w-4xl px-6 py-24 text-center">
    <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">
      Ready to give your team a Monday they'll actually look forward to?
    </h2>
    <p class="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
      Set up takes 12 minutes. Migrate from your current tool with one CSV upload.
    </p>
    <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Button size="lg">
        {#snippet child({ props })}
          <a href={loggedIn ? '/dashboard' : '/sign-up'} {...props}>
            {loggedIn ? 'Go to dashboard' : 'Start free trial'}
            <ArrowRight class="ml-2 size-4" />
          </a>
        {/snippet}
      </Button>
      <Button size="lg" variant="outline">
        {#snippet child({ props })}<a href="/login" {...props}>Book a demo</a>{/snippet}
      </Button>
    </div>
    <p class="text-muted-foreground mt-4 text-xs">14-day free trial · No credit card required · Cancel anytime</p>
  </div>
</section>
