<script lang="ts">
  import Header01 from '$lib/components/blocks/header-01/Header01.svelte'
  import Footer01 from '$lib/components/blocks/footer-01/Footer01.svelte'
</script>

<svelte:head>
  <title>Terms of Service | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <Header01 />
  <main class="mx-auto max-w-3xl px-6 py-16">
    <article class="prose dark:prose-invert max-w-none">
      <h1 class="text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p class="text-muted-foreground text-sm">
        Last updated: <time datetime="2026-05-17">May 17, 2026</time>
      </p>

      <h2 class="mt-8 text-xl font-semibold">
        1. Agreement
      </h2>
      <p class="text-muted-foreground">
        Replace this stub with your actual terms before launch. Consider consulting counsel.
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        2. Use of the Service
      </h2>
      <p class="text-muted-foreground">
        …
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        3. Accounts
      </h2>
      <p class="text-muted-foreground">
        …
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        4. Billing
      </h2>
      <p class="text-muted-foreground">
        …
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        5. Termination
      </h2>
      <p class="text-muted-foreground">
        …
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        6. Contact
      </h2>
      <p class="text-muted-foreground">
        support@acme.dev
      </p>
    </article>
  </main>
  <Footer01 />
</div>
