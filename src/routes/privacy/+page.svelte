<script lang="ts">
  import Header01 from '$lib/components/blocks/header-01/Header01.svelte'
  import Footer01 from '$lib/components/blocks/footer-01/Footer01.svelte'

  // Sample policy. Replace with your own: cover what you store, why, and for how long.
  const sections = [
    {
      heading: 'Data we collect',
      body: 'Account details (name, email, workspace), the content you create in projects, and usage data such as pages visited and features used.',
    },
    {
      heading: 'How we use data',
      body: 'To run and secure the service, send product and billing emails, and improve features. We never sell personal data.',
    },
    {
      heading: 'Sub-processors',
      body: 'We use a small set of vetted providers for hosting, payments, email delivery and error monitoring. The current list is available on request.',
    },
    {
      heading: 'Your rights',
      body: 'You can access, correct, export or delete your personal data at any time from your account settings, or by contacting us.',
    },
    {
      heading: 'Contact',
      body: 'Privacy questions or requests? Email privacy@uipkge.dev.',
    },
  ]
</script>

<svelte:head>
  <title>Privacy Policy | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <Header01 />
  <main class="mx-auto max-w-3xl px-4 py-4">
    <article class="space-y-4">
      <header class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight">
          Privacy Policy
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
