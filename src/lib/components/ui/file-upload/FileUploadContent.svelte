<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface FileUploadContentProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let { class: className, children, ref = $bindable(null), ...restProps }: FileUploadContentProps = $props()
</script>

<div bind:this={ref} data-uipkge data-slot="file-upload-content" class={cn('space-y-2', className)} {...restProps}>
  {@render children?.()}
</div>
