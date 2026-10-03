<script lang="ts">
  import AppShell from '$lib/components/blocks/app-shell/AppShell.svelte'

  // Projects shell: same app chrome as /dashboard (sidebar, breadcrumbs,
  // header controls). Anonymous visitors never reach here — hooks.server.ts
  // bounces them to /login?next=<path> first. No +layout.server.ts needed:
  // the user comes from the root +layout.server.ts load via `data`.
  let { data, children } = $props()
</script>

<AppShell {data}>
  {@render children?.()}
</AppShell>
