<script lang="ts" module>
  import type { TargetRect } from './use-tour-target.svelte'

  export interface TourMaskProps {
    rect: TargetRect | null
    zIndex?: number
    opacity?: number
    padding?: number
    radius?: number
  }
</script>

<script lang="ts">
  let { rect, zIndex = 1000, opacity = undefined, padding = 4, radius = 6 }: TourMaskProps = $props()

  // An explicit `opacity` wins; otherwise dim 50% in light and 75% in dark —
  // 50% black over an already-dark UI barely changes it, so the spotlight got lost.
  const customFill = $derived(opacity !== undefined ? `rgba(0, 0, 0, ${opacity})` : undefined)

  // Unique mask id so multiple open tours (or other SVG masks on the page) never collide.
  const maskId = $props.id()

  const cutout = $derived.by(() => {
    if (!rect) return null
    return {
      x: rect.x - padding,
      y: rect.y - padding,
      w: rect.width + padding * 2,
      h: rect.height + padding * 2,
    }
  })

  /**
   * Clip-path leaves a hole over the target so pointer events pass through to the
   * highlighted element. SVG mask alone does not punch a hit-test hole.
   */
  const hitClipPath = $derived.by(() => {
    const c = cutout
    if (!c) return undefined
    const { x, y, w, h } = c
    return `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${x}px ${y}px, ${x}px ${y + h}px, ${x + w}px ${y + h}px, ${x + w}px ${y}px, ${x}px ${y}px)`
  })

  const reduceMotion = $derived.by(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
</script>

<!-- Visual dim with rounded cutout (decorative only — no hit testing). -->
<svg
  class="pointer-events-none fixed inset-0"
  style:z-index={zIndex}
  style:--tour-padding={`${padding}px`}
  style:--tour-radius={`${radius}px`}
  width="100%"
  height="100%"
  aria-hidden="true"
>
  <defs>
    <mask id={maskId}>
      <rect width="100%" height="100%" fill="white" />
      {#if cutout}
        <rect x={cutout.x} y={cutout.y} width={cutout.w} height={cutout.h} rx={radius} fill="black" />
      {/if}
    </mask>
  </defs>
  <rect
    width="100%"
    height="100%"
    fill={customFill}
    class={customFill ? undefined : 'fill-black/50 dark:fill-black/75'}
    mask={`url(#${maskId})`}
    style={reduceMotion ? undefined : 'transition: all 200ms ease'}
  />
  <!-- Ring around the spotlight so the focus reads in both themes. -->
  {#if cutout}
    <rect
      x={cutout.x}
      y={cutout.y}
      width={cutout.w}
      height={cutout.h}
      rx={radius}
      class="stroke-primary/70 fill-none"
      stroke-width="2"
      style={reduceMotion ? undefined : 'transition: all 200ms ease'}
    />
  {/if}
</svg>
<!-- Hit layer: blocks clicks outside the cutout; hole is click-through. -->
<div
  class="fixed inset-0"
  aria-hidden="true"
  style:z-index={zIndex}
  style:clip-path={hitClipPath}
  style:background="transparent"
></div>
