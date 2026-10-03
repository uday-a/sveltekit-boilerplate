<script lang="ts">
  import AppShell from '$lib/components/blocks/app-shell/AppShell.svelte'

  let { data, children } = $props()
</script>

<AppShell {data}>
  {@render children?.()}
</AppShell>
