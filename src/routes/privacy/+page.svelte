<script lang="ts">
  import Header01 from '$lib/components/blocks/header-01/Header01.svelte'
  import Footer01 from '$lib/components/blocks/footer-01/Footer01.svelte'
</script>

<svelte:head>
  <title>Privacy Policy | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <Header01 />
  <main class="mx-auto max-w-3xl px-6 py-16">
    <article class="prose dark:prose-invert max-w-none">
      <h1 class="text-3xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p class="text-muted-foreground text-sm">
        Last updated: <time datetime="2026-05-17">May 17, 2026</time>
      </p>

      <h2 class="mt-8 text-xl font-semibold">
        1. Data we collect
      </h2>
      <p class="text-muted-foreground">
        Replace this stub with your actual policy. Cover what you store, why, and how long.
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        2. How we use data
      </h2>
      <p class="text-muted-foreground">
        …
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        3. Sub-processors
      </h2>
      <p class="text-muted-foreground">
        …
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        4. Your rights
      </h2>
      <p class="text-muted-foreground">
        Access, rectification, deletion, portability, objection.
      </p>

      <h2 class="mt-6 text-xl font-semibold">
        5. Contact
      </h2>
      <p class="text-muted-foreground">
        privacy@acme.dev
      </p>
    </article>
  </main>
  <Footer01 />
</div>
