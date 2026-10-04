<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { Button } from '$lib/components/ui/button'

  // The <Toaster /> host is mounted once in the root layout; demos just call toast().
  function withUndo() {
    toast.success('Invoice INV-2031 deleted', {
      action: { label: 'Undo', onClick: () => toast('Invoice restored') },
    })
  }
</script>

<div class="flex flex-wrap gap-2">
  <Button variant="outline" size="sm" onclick={() => toast.success('Changes saved')}>Success</Button>
  <Button variant="outline" size="sm" onclick={() => toast.error('Couldn’t reach the server')}>Error</Button>
  <Button variant="outline" size="sm" onclick={withUndo}>With undo</Button>
</div>
