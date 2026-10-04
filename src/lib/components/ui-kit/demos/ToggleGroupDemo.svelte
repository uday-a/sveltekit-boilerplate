<script lang="ts">
  import { Image as ImageIcon, Link as LinkIcon, List, ListOrdered } from '@lucide/svelte'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'

  let value = $state('list')
</script>

<ToggleGroup type="single" bind:value>
  <ToggleGroupItem value="list" aria-label="Bulleted list"><List class="size-4" /></ToggleGroupItem>
  <ToggleGroupItem value="ordered" aria-label="Numbered list"><ListOrdered class="size-4" /></ToggleGroupItem>
  <ToggleGroupItem value="link" aria-label="Link"><LinkIcon class="size-4" /></ToggleGroupItem>
  <ToggleGroupItem value="image" aria-label="Image"><ImageIcon class="size-4" /></ToggleGroupItem>
</ToggleGroup>
