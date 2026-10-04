<script lang="ts">
  import { Label } from '$lib/components/ui/label'
  import { PinInput, PinInputGroup, PinInputSeparator, PinInputSlot } from '$lib/components/ui/pin-input'

  let otp = $state<string[]>([])
</script>

<div class="space-y-2">
  <Label>Verification code</Label>
  <PinInput bind:value={otp} class="flex gap-2" otp>
    <PinInputGroup>
      <PinInputSlot index={0} />
      <PinInputSlot index={1} />
      <PinInputSlot index={2} />
      <PinInputSeparator />
      <PinInputSlot index={3} />
      <PinInputSlot index={4} />
      <PinInputSlot index={5} />
    </PinInputGroup>
  </PinInput>
</div>
