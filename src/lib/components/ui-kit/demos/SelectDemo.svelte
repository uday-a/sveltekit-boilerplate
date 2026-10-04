<script lang="ts">
  import { Label } from '$lib/components/ui/label'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'

  const plans = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
  ]
  let plan = $state('pro')
  const planLabel = $derived(plans.find(p => p.value === plan)?.label)
</script>

<div class="max-w-xs space-y-2">
  <Label for="ui-kit-select">Plan</Label>
  <Select bind:value={plan}>
    <SelectTrigger id="ui-kit-select"><SelectValue>{planLabel}</SelectValue></SelectTrigger>
    <SelectContent>
      {#each plans as p (p.value)}
        <SelectItem value={p.value}>{p.label}</SelectItem>
      {/each}
    </SelectContent>
  </Select>
</div>
