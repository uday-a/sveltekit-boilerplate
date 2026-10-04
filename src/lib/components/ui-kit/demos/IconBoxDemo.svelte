<script lang="ts">
  import { Fingerprint, Mail, Palette, Settings } from '@lucide/svelte'
  import { IconBox } from '$lib/components/ui/icon-box'
</script>

<div class="flex gap-2">
  <IconBox icon={Mail} />
  <IconBox icon={Settings} variant="muted" />
  <IconBox icon={Palette} variant="muted" />
  <IconBox icon={Fingerprint} variant="outline" />
</div>
