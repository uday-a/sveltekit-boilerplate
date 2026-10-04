<script lang="ts">
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
</script>

<div class="space-y-2">
  <Label for="ui-kit-textarea">Message</Label>
  <Textarea id="ui-kit-textarea" placeholder="Enter your message..." rows={3} />
</div>
