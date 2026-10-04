<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui/collapsible'

  const repos = ['acme/web-app', 'acme/api-gateway', 'acme/billing-service']
</script>

<Collapsible>
  <div class="flex items-center justify-between">
    <p class="text-sm font-medium">3 repositories connected</p>
    <CollapsibleTrigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="sm">Toggle</Button>
      {/snippet}
    </CollapsibleTrigger>
  </div>
  <CollapsibleContent class="mt-2 space-y-2">
    {#each repos as repo (repo)}
      <div class="rounded-md border px-3 py-2 font-mono text-xs">{repo}</div>
    {/each}
  </CollapsibleContent>
</Collapsible>
