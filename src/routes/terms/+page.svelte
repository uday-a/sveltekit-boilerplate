<script lang="ts">
  import Header01 from '$lib/components/blocks/header-01/Header01.svelte'
  import Footer01 from '$lib/components/blocks/footer-01/Footer01.svelte'

  // Sample terms. Replace with your own before launch and have counsel review them.
  const sections = [
    {
      heading: 'Agreement',
      body: 'By creating an account or using UIPKGE, you agree to these terms on behalf of yourself and the organization you represent.',
    },
    {
      heading: 'Use of the service',
      body: 'Use the service only for lawful purposes. Do not attempt to disrupt it, access other customers\' data, or resell access without a written agreement.',
    },
    {
      heading: 'Accounts',
      body: 'You are responsible for the people you invite to your workspace and for keeping sign-in methods secure. Tell us promptly about any unauthorized access.',
    },
    {
      heading: 'Billing',
      body: 'Paid plans renew automatically each month or year until cancelled. Seat changes are prorated on your next invoice. Fees are non-refundable except where required by law.',
    },
    {
      heading: 'Termination',
      body: 'You can cancel at any time from Settings → Billing. We may suspend accounts that break these terms. After cancellation you can export your data for 30 days.',
    },
    {
      heading: 'Contact',
      body: 'Questions about these terms? Email legal@uipkge.dev.',
    },
  ]
</script>

<svelte:head>
  <title>Terms of Service | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <Header01 />
  <main class="mx-auto max-w-3xl px-4 py-4">
    <article class="space-y-4">
      <header class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p class="text-muted-foreground text-sm">
          Last updated: <time datetime="2026-05-17">May 17, 2026</time>
        </p>
      </header>

      {#each sections as section, i (section.heading)}
        <section class="space-y-2">
          <h2 class="text-xl font-semibold tracking-tight">
            {i + 1}. {section.heading}
          </h2>
          <p class="text-muted-foreground text-sm leading-relaxed">
            {section.body}
          </p>
        </section>
      {/each}
    </article>
  </main>
  <Footer01 />
</div>
