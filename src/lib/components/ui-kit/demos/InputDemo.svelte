<script lang="ts">
  import { Mail } from '@lucide/svelte'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
</script>

<div class="grid gap-4 sm:grid-cols-2">
  <div class="space-y-2">
    <Label for="ui-kit-input-email">Text input</Label>
    <Input id="ui-kit-input-email" prefixIcon={Mail} placeholder="name@example.com" />
  </div>
  <div class="space-y-2">
    <Label for="ui-kit-input-password">Password</Label>
    <Input id="ui-kit-input-password" type="password" defaultValue="secret123" showPasswordToggle />
  </div>
</div>
