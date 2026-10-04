<script lang="ts">
  import { Label } from '$lib/components/ui/label'
  import { Slider } from '$lib/components/ui/slider'

  let value = $state<number[]>([65])
</script>

<div class="max-w-sm space-y-2">
  <Label for="ui-kit-slider">Slider (<span class="tabular-nums">{value[0]}%</span>)</Label>
  <Slider
    id="ui-kit-slider"
    {value}
    onValueChange={v => (value = Array.isArray(v) ? v : [v])}
    min={0}
    max={100}
    step={1}
    aria-label="Demo slider"
  />
</div>
