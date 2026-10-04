<script lang="ts">
  import { page } from '$app/state'
  import { buttonVariants } from '$lib/components/ui/button'

  const is404 = $derived(page.status === 404)
  const title = $derived(is404 ? 'Page not found' : 'Something broke')
  const description = $derived(
    is404
      ? 'The page you were looking for doesn’t exist or was moved.'
      : page.error?.message || 'An unexpected error occurred.',
  )
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <main class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
    <p class="text-muted-foreground font-mono text-sm tracking-widest">
      {page.status ?? 'ERROR'}
    </p>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
      {title}
    </h1>
    <p class="text-muted-foreground mt-3 text-base">
      {description}
    </p>
    <div class="mt-8 flex gap-3">
      <a href="/" class={buttonVariants()}>Go home</a>
      <a href="/dashboard" class={buttonVariants({ variant: 'outline' })}>Dashboard</a>
    </div>
  </main>
</div>
