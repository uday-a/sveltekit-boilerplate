<script lang="ts">
  import { page } from '$app/state'
  import { FileQuestion } from '@lucide/svelte'
</script>

<svelte:head>
  <title>{page.status === 404 ? 'Page not found' : 'Something broke'} | UIPKGE</title>
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
  <FileQuestion class="text-muted-foreground size-10" aria-hidden="true" />
  <div class="space-y-1">
    <h1 class="text-2xl font-semibold tracking-tight">
      {page.status === 404 ? 'Page not found' : 'Something broke'}
    </h1>
    <p class="text-muted-foreground text-sm">
      {page.status === 404
        ? "The page you're looking for doesn't exist or was moved."
        : 'An unexpected error occurred. Please try again.'}
    </p>
  </div>
  <div class="flex items-center gap-2">
    <a href="/" class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium">
      Go home
    </a>
    <a href="/dashboard" class="border-border bg-card hover:bg-muted inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium">
      Dashboard
    </a>
  </div>
</div>
