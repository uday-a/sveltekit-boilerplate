<script lang="ts">
  import { Label } from '$lib/components/ui/label'
  import { Switch } from '$lib/components/ui/switch'
</script>

<div class="max-w-xs space-y-2">
  <div class="flex items-center justify-between">
    <Label for="ui-kit-switch-notifications" class="text-sm font-normal">Notifications</Label>
    <Switch id="ui-kit-switch-notifications" defaultChecked={true} />
  </div>
  <div class="flex items-center justify-between">
    <Label for="ui-kit-switch-digest" class="text-sm font-normal">Weekly digest</Label>
    <Switch id="ui-kit-switch-digest" />
  </div>
</div>
