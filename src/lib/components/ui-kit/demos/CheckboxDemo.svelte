<script lang="ts">
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Label } from '$lib/components/ui/label'
</script>

<div class="space-y-2">
  <div class="flex items-center gap-2">
    <Checkbox id="ui-kit-terms" />
    <Label for="ui-kit-terms" class="text-sm font-normal">Accept terms</Label>
  </div>
  <div class="flex items-center gap-2">
    <Checkbox id="ui-kit-news" checked={true} />
    <Label for="ui-kit-news" class="text-sm font-normal">Newsletter</Label>
  </div>
</div>
