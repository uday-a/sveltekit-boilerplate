<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { FormActions, FormItem } from '$lib/components/ui/form'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
</script>

<div class="max-w-md space-y-4">
  <FormItem description="Shown in invites and on invoices." required>
    {#snippet labelContent()}
      <Label for="ui-kit-form-name">Workspace name</Label>
    {/snippet}
    <Input id="ui-kit-form-name" defaultValue="Acme Inc" />
  </FormItem>
  <FormItem status="error" help="Enter a valid email address.">
    {#snippet labelContent()}
      <Label for="ui-kit-form-email">Billing email</Label>
    {/snippet}
    <Input id="ui-kit-form-email" defaultValue="billing@acme" status="error" />
  </FormItem>
  <FormActions>
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Save</Button>
  </FormActions>
</div>
