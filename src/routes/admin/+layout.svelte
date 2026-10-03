<script lang="ts">
  import AppShell from '$lib/components/blocks/app-shell/AppShell.svelte'

  // Admin shell: same app chrome as /dashboard (sidebar, breadcrumbs,
  // header controls). Anonymous or non-admin visitors never reach here —
  // hooks.server.ts bounces them (to /login, or /dashboard?error=forbidden)
  // first; +layout.server.ts is the route-level mirror.
  let { data, children } = $props()
</script>

<AppShell {data}>
  {@render children?.()}
</AppShell>
