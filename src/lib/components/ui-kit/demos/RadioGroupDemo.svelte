<script lang="ts">
  import { Label } from '$lib/components/ui/label'
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group'

  const options = [
    { value: 'compact', label: 'Compact' },
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'spacious', label: 'Spacious' },
  ]
</script>

<RadioGroup defaultValue="comfortable" aria-label="Density">
  {#each options as opt (opt.value)}
    <div class="flex items-center gap-2">
      <RadioGroupItem id="ui-kit-radio-{opt.value}" value={opt.value} />
      <Label for="ui-kit-radio-{opt.value}" class="text-sm font-normal">{opt.label}</Label>
    </div>
  {/each}
</RadioGroup>
