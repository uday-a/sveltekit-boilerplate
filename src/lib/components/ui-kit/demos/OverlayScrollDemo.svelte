<script lang="ts">
  import { OverlayScroll } from '$lib/components/ui/overlay-scroll'
</script>

<OverlayScroll class="h-24 rounded-md border p-2">
  {#each Array.from({ length: 10 }, (_, i) => i + 1) as i (i)}
    <p class="py-1 text-xs">Scrollable content line {i}</p>
  {/each}
</OverlayScroll>
