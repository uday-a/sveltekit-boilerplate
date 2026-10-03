<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface FileUploadItemProps extends HTMLAttributes<HTMLDivElement> {
    /** File rendered in the row. Port of Nuxt `defineModel<File>`. */
    file: File
    onRemove?: () => void
    children?: Snippet
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { File as FileIcon, X } from '@lucide/svelte'
  import { cn } from '$lib/utils'

  let { class: className, file, onRemove, children, ref = $bindable(null), ...restProps }: FileUploadItemProps = $props()

  function sizeLabel(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(1)} KB`
  }
</script>

<div
  bind:this={ref}
  data-uipkge
  data-slot="file-upload-item"
  class={cn('bg-muted/50 flex items-center gap-3 rounded-md border p-3', className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {:else}
    <FileIcon class="text-muted-foreground size-8 shrink-0" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{file.name}</p>
      <p class="text-muted-foreground text-xs">{sizeLabel(file.size)}</p>
    </div>
  {/if}
  <button
    type="button"
    class="text-muted-foreground hover:text-foreground focus-visible:ring-ring ml-auto rounded-sm transition-colors duration-200 focus-visible:ring-1 focus-visible:outline-none"
    aria-label="Remove file"
    onclick={() => onRemove?.()}
  >
    <X class="size-4" aria-hidden="true" />
    <span class="sr-only">Remove file</span>
  </button>
</div>
