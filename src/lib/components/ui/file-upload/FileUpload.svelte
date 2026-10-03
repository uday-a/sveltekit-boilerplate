<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface FileUploadProps extends HTMLAttributes<HTMLDivElement> {
    accept?: string
    multiple?: boolean
    disabled?: boolean
    /** Selected files. Two-way bindable (`bind:modelValue`). Port of Nuxt `modelValue`. */
    modelValue?: File[]
    onModelValueChange?: (files: File[]) => void
    icon?: Snippet
    content?: Snippet
    children?: Snippet
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let {
    class: className,
    accept = undefined,
    multiple = false,
    disabled = false,
    modelValue = $bindable<File[] | undefined>(undefined),
    onModelValueChange,
    icon,
    content,
    children,
    ref = $bindable(null),
    ...restProps
  }: FileUploadProps = $props()

  let inputRef = $state<HTMLInputElement | null>(null)
  let isDragging = $state(false)

  function emit(files: File[]) {
    modelValue = files
    onModelValueChange?.(files)
  }

  function handleFiles(files: FileList | null) {
    if (disabled || !files) return
    const fileArray = Array.from(files)
    const first = fileArray[0]
    emit(multiple ? fileArray : first ? [first] : [])
  }

  function handleInputChange(e: Event) {
    handleFiles((e.target as HTMLInputElement).files)
  }

  function handleDrop(e: DragEvent) {
    isDragging = false
    if (disabled) return
    handleFiles(e.dataTransfer?.files ?? null)
  }

  function handleDragOver(e: DragEvent) {
    if (disabled) return
    e.preventDefault()
    isDragging = true
  }

  function handleDragLeave() {
    isDragging = false
  }

  function openFilePicker() {
    if (disabled) return
    inputRef?.click()
  }

  function onDropzoneKeydown(e: KeyboardEvent) {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openFilePicker()
    }
  }
</script>

<div bind:this={ref} data-uipkge data-slot="file-upload" class={cn('space-y-3', className)} {...restProps}>
  <input
    bind:this={inputRef}
    type="file"
    {accept}
    {multiple}
    {disabled}
    class="sr-only"
    tabindex="-1"
    onchange={handleInputChange}
  />

  <div
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-disabled={disabled || undefined}
    aria-label={multiple ? 'Upload files' : 'Upload file'}
    class={[
      'border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/50 focus-visible:ring-ring flex flex-col items-center justify-center rounded-lg border border-dashed p-8 transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none',
      isDragging && 'border-primary bg-primary/5',
      disabled && 'pointer-events-none opacity-50',
    ]}
    onclick={openFilePicker}
    onkeydown={onDropzoneKeydown}
    ondrop={(e) => {
      e.preventDefault()
      handleDrop(e)
    }}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
  >
    {#if icon}
      {@render icon()}
    {:else}
      <svg
        class="text-muted-foreground mb-2 size-10"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
    {/if}
    {#if children}
      {@render children()}
    {:else}
      <p class="text-muted-foreground text-sm">
        <span class="text-foreground font-semibold">Click to upload</span> or drag and drop
      </p>
      {#if accept}
        <p class="text-muted-foreground/70 mt-1 text-xs">{accept}</p>
      {/if}
    {/if}
  </div>

  {#if content}
    {@render content()}
  {/if}
</div>
