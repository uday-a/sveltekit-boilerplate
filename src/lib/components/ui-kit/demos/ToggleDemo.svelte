<script lang="ts">
  import { Bold, Italic, Underline } from '@lucide/svelte'
  import { Toggle } from '$lib/components/ui/toggle'
</script>

<div class="flex gap-2">
  <Toggle aria-label="Bold"><Bold class="size-4" /></Toggle>
  <Toggle aria-label="Italic"><Italic class="size-4" /></Toggle>
  <Toggle aria-label="Underline"><Underline class="size-4" /></Toggle>
</div>
