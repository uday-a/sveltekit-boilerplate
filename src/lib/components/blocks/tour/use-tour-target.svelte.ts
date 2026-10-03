import { browser } from '$app/environment'

export type TourTarget = string | (() => HTMLElement | null) | HTMLElement | null

export interface TargetRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Tracks the bounding rect of a tour step's target. Port of Nuxt
 * `use-tour-target.ts` to Svelte 5 runes. SSR-safe: `attach()` is a no-op
 * unless `browser` is true — the Tour only activates in the browser via
 * `browser` from `$app/environment`.
 */
export function useTourTarget(getTarget: () => TourTarget | undefined) {
  let rect = $state<TargetRect | null>(null)
  let element = $state<HTMLElement | null>(null)

  let resizeObs: ResizeObserver | null = null
  let raf = 0

  function resolve(): HTMLElement | null {
    if (!browser) return null
    const t = getTarget()
    if (!t) return null
    if (typeof t === 'string') return document.querySelector(t) as HTMLElement | null
    if (typeof t === 'function') return t()
    return t
  }

  function measure() {
    if (!browser) return
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      if (!element) {
        rect = null
        return
      }
      const r = element.getBoundingClientRect()
      rect = { x: r.left, y: r.top, width: r.width, height: r.height }
    })
  }

  function attach() {
    if (!browser) return
    detach()
    element = resolve()
    if (!element) {
      rect = null
      return
    }
    const r = element.getBoundingClientRect()
    if (r.bottom < 0 || r.top > window.innerHeight) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      element.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    }
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(measure)
      resizeObs.observe(element)
      resizeObs.observe(document.documentElement)
    }
    window.addEventListener('scroll', measure, { passive: true, capture: true })
    window.addEventListener('resize', measure, { passive: true })
  }

  function detach() {
    resizeObs?.disconnect()
    resizeObs = null
    if (browser) {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(raf)
    }
  }

  return {
    get rect() {
      return rect
    },
    get element() {
      return element
    },
    attach,
    detach,
    measure,
  }
}
