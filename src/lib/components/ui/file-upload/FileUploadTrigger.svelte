<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface FileUploadTriggerProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let { class: className, children, ref = $bindable(null), ...restProps }: FileUploadTriggerProps = $props()
</script>

<div
  bind:this={ref}
  data-uipkge
  data-slot="file-upload-trigger"
  class={cn('cursor-pointer', className)}
  {...restProps}
>
  {@render children?.()}
</div>
