<script lang="ts" module>
  export interface MapControlsProps {
    onzoomIn?: () => void
    onzoomOut?: () => void
    onreset?: () => void
  }
</script>

<script lang="ts">
  import { Minus, Plus, RotateCcw } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { t } from '$lib/i18n'

  let { onzoomIn, onzoomOut, onreset }: MapControlsProps = $props()
</script>

<!-- Zoom in / out / reset-to-fit overlay. Sits inside a `relative isolate`
     card; the parent wires the events to its map ref. Port of Nuxt
     `app/components/blocks/MapControls.vue`. -->
<div
  class="bg-card/90 absolute right-3 bottom-3 z-[800] flex flex-col overflow-hidden rounded-md border backdrop-blur-sm"
>
  <Button
    variant="ghost"
    size="icon"
    class="size-8 rounded-none"
    aria-label={$t('dashboard.locations.controls.zoomIn')}
    title={$t('dashboard.locations.controls.zoomIn')}
    onclick={() => onzoomIn?.()}
  >
    <Plus class="size-4" />
  </Button>
  <Button
    variant="ghost"
    size="icon"
    class="size-8 rounded-none border-t"
    aria-label={$t('dashboard.locations.controls.zoomOut')}
    title={$t('dashboard.locations.controls.zoomOut')}
    onclick={() => onzoomOut?.()}
  >
    <Minus class="size-4" />
  </Button>
  <Button
    variant="ghost"
    size="icon"
    class="size-8 rounded-none border-t"
    aria-label={$t('dashboard.locations.controls.reset')}
    title={$t('dashboard.locations.controls.reset')}
    onclick={() => onreset?.()}
  >
    <RotateCcw class="size-4" />
  </Button>
</div>
