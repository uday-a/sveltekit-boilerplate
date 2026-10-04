<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '$lib/components/ui/dialog'

  let open = $state(false)
</script>

<Dialog bind:open>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" size="sm">Open dialog</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm action</DialogTitle>
      <DialogDescription>This will permanently delete the selected item. This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" size="sm" onclick={() => (open = false)}>Cancel</Button>
      <Button variant="destructive" size="sm" onclick={() => (open = false)}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
