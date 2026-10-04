<script lang="ts">
  import { goto } from '$app/navigation'
  import Header01 from '$lib/components/blocks/header-01/Header01.svelte'
  import Pricing01, { type BillingCycle } from '$lib/components/blocks/pricing-01/Pricing01.svelte'
  import Faq01 from '$lib/components/blocks/faq-01/Faq01.svelte'
  import Footer01 from '$lib/components/blocks/footer-01/Footer01.svelte'
  import type { ApiResponse } from '$lib/server/response'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  type Plan = 'pro' | 'team' | 'enterprise'

  async function onSubscribe(plan: Plan, _cycle: BillingCycle) {
    // Not signed in? Bounce to /login with a return URL — the user
    // lands back on /pricing after auth and can click the plan again.
    // (Could also stash the plan in the session to auto-resume — leave
    // that polish to the consumer.)
    if (!data.user) {
      await goto(`/login?next=${encodeURIComponent('/pricing')}`)
      return
    }

    let res: ApiResponse<{ url: string }>
    try {
      const r = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      res = (await r.json()) as ApiResponse<{ url: string }>
    }
    catch {
      res = { ok: false, error: { code: 'INTERNAL', message: 'Checkout failed' } }
    }

    if (!res.ok) {
      alert(res.error.message)
      return
    }
    // Polar's hosted checkout — full-page redirect.
    window.location.href = res.data.url
  }

  function onContactSales() {
    window.location.href = 'mailto:sales@example.com?subject=Enterprise%20plan%20inquiry'
  }
</script>

<svelte:head>
  <title>Pricing | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <Header01 />
  <main>
    <div class="mx-auto max-w-6xl px-6 py-16">
      <header class="mx-auto max-w-2xl text-center">
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
          Pricing
        </h1>
        <p class="text-muted-foreground mt-3 text-base">
          Start free. Upgrade when you outgrow it.
        </p>
      </header>
    </div>
    <!-- Reuse the landing pricing block so plans live in one place. -->
    <section>
      <Pricing01
        {onSubscribe}
        {onContactSales}
      />
    </section>
    <section><Faq01 /></section>
  </main>
  <Footer01 />
</div>
