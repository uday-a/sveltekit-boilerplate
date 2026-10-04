<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from '$lib/components/ui/sheet'

  let open = $state(false)
</script>

<Sheet bind:open>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" size="sm">Open sheet</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Details</SheetTitle>
      <SheetDescription>View and edit item details.</SheetDescription>
    </SheetHeader>
    <div class="space-y-4 px-4">
      <div class="space-y-2">
        <Label for="ui-kit-sheet-name">Name</Label>
        <Input id="ui-kit-sheet-name" defaultValue="Acme Inc" />
      </div>
      <div class="space-y-2">
        <Label for="ui-kit-sheet-email">Email</Label>
        <Input id="ui-kit-sheet-email" defaultValue="hello@acme.com" />
      </div>
    </div>
    <SheetFooter>
      <Button size="sm" onclick={() => (open = false)}>Save</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
