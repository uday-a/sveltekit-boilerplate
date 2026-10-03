<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface FileUploadItemNameProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: Snippet
    ref?: HTMLParagraphElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let { class: className, children, ref = $bindable(null), ...restProps }: FileUploadItemNameProps = $props()
</script>

<p
  bind:this={ref}
  data-uipkge
  data-slot="file-upload-item-name"
  class={cn('truncate text-sm font-medium', className)}
  {...restProps}
>
  {@render children?.()}
</p>
