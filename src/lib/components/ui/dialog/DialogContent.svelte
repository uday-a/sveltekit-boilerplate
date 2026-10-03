<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
    showCloseButton?: boolean
    /** Fired on Escape, before close. Call `preventDefault()` to keep the
     *  dialog open (Radix `onEscapeKeyDown` parity). */
    onEscapeKeyDown?: (e: KeyboardEvent) => void
    /** Fired on pointer-down outside the panel, before close. Call
     *  `preventDefault()` to keep the dialog open (Radix parity). */
    onPointerDownOutside?: (e: PointerEvent) => void
    /** Override the panel's `data-slot` value (e.g. `command-dialog`). Default `'dialog-content'`. */
    dataSlot?: string
    /** Override the inner overlay's `data-slot` value (e.g. `command-dialog-overlay`). Default `'dialog-overlay'`. */
    overlayDataSlot?: string
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { tick } from 'svelte'
  import { X } from '@lucide/svelte'
  import { cn } from '$lib/utils'
  import { getDialogContext } from './context'
  import { portal } from './portal'
  import DialogClose from './DialogClose.svelte'
  import DialogOverlay from './DialogOverlay.svelte'

  let {
    class: className,
    showCloseButton = true,
    dataSlot = 'dialog-content',
    overlayDataSlot = 'dialog-overlay',
    children,
    ref = $bindable(null),
    onEscapeKeyDown,
    onPointerDownOutside,
    ...restProps
  }: DialogContentProps = $props()

  const ctx = getDialogContext()

  $effect(() => {
    if (!ctx.open) return
    const modal = ctx.modal
    // Focus-return: the opener (usually the dialog trigger) holds focus when
    // the panel mounts — hand it back on close (Esc, X, overlay,
    // programmatic) so keyboard users don't lose their place.
    const previouslyFocused = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscapeKeyDown?.(e)
        if (e.defaultPrevented) return
        e.preventDefault()
        ctx.setOpen(false)
        return
      }
      // Minimal focus trap: cycle Tab within the panel (modal only — a
      // non-modal dialog leaves background tab order untouched, like Radix).
      if (!modal || e.key !== 'Tab' || !ref) return
      const focusables = ref.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables.length) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    // Non-modal: the overlay is pointer-events-none so outside pointerdowns
    // reach the page — dismiss from the document level instead (Radix parity).
    const onDocPointerDown = (e: PointerEvent) => {
      if (modal || !ref || ref.contains(e.target as Node)) return
      onPointerDownOutside?.(e)
      if (e.defaultPrevented) return
      ctx.setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown, true)
    const prevOverflow = modal ? document.body.style.overflow : null
    if (modal) {
      document.body.style.overflow = 'hidden'
      tick().then(() => ref?.focus({ preventScroll: true }))
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onDocPointerDown, true)
      if (modal && prevOverflow !== null) document.body.style.overflow = prevOverflow
      // Hand focus back to the opener captured above (no-op when it left
      // the DOM, e.g. the row that opened a delete dialog was removed).
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  })
</script>

{#if ctx.open}
  <div use:portal>
    <DialogOverlay dataSlot={overlayDataSlot} onPointerDownOutside={onPointerDownOutside} />
    <div
      bind:this={ref}
      data-uipkge
      data-slot={dataSlot}
      role="dialog"
      aria-modal={ctx.modal}
      aria-labelledby={ctx.titleId}
      aria-describedby={ctx.descriptionId}
      tabindex="-1"
      data-state="open"
      class={cn(
        'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:ease-emphasized data-[state=open]:blur-in-2 data-[state=closed]:blur-out-2 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-4 shadow-lg duration-200 data-[state=closed]:duration-[var(--dur-exit)] data-[state=open]:duration-200 sm:max-w-lg',
        className,
      )}
      {...restProps}
    >
      {@render children?.()}

      {#if showCloseButton}
        <DialogClose
          class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <X aria-hidden="true" />
          <span class="sr-only">Close</span>
        </DialogClose>
      {/if}
    </div>
  </div>
{/if}
