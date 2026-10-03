<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface FileUploadItemSizeProps extends HTMLAttributes<HTMLSpanElement> {
    children?: Snippet
    ref?: HTMLSpanElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let { class: className, children, ref = $bindable(null), ...restProps }: FileUploadItemSizeProps = $props()
</script>

<span
  bind:this={ref}
  data-uipkge
  data-slot="file-upload-item-size"
  class={cn('text-muted-foreground text-xs', className)}
  {...restProps}
>
  {@render children?.()}
</span>
