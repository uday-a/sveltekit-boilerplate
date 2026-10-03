<script lang="ts" module>
  export interface DemoDataBannerProps {
    message?: string
  }
</script>

<script lang="ts">
  import { Info } from '@lucide/svelte'

  // The single place a page admits it's showing sample data. Replaces the
  // scattered implementation notes that used to sit in page copy.
  // Port of Nuxt `DemoDataBanner.vue`.
  let { message = 'Sample data. Connect a database to see live records.' }: DemoDataBannerProps = $props()
</script>

<div
  class="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
  role="note"
  data-slot="demo-data-banner"
>
  <Info class="size-3.5 shrink-0" aria-hidden="true" />
  <span>{message}</span>
</div>
