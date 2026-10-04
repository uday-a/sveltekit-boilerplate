<script lang="ts">
  import { AlertCircle } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
</script>

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon" class="size-8" aria-label="More information">
          <AlertCircle class="size-4" aria-hidden="true" />
        </Button>
      {/snippet}
    </TooltipTrigger>
    <TooltipContent><p>More information about this feature</p></TooltipContent>
  </Tooltip>
</TooltipProvider>
