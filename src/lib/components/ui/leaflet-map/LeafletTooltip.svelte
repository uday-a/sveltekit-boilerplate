<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface LeafletTooltipProps {
    /** [lng, lat] — standalone tooltip on the map. Omit inside a layer to bind to it. */
    lngLat?: [number, number]
    offset?: [number, number]
    direction?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto'
    permanent?: boolean
    sticky?: boolean
    opacity?: number
    className?: string
    interactive?: boolean
    children?: Snippet
  }
</script>

<script lang="ts">
  import { onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import type * as L from 'leaflet'
  import {
    defined,
    loadLeaflet,
    toLatLng,
    useLeafletMap,
    useParentLeafletLayer,
  } from './leaflet-context.svelte'

  let {
    lngLat = undefined,
    offset = undefined,
    direction = undefined,
    permanent = undefined,
    sticky = undefined,
    opacity = undefined,
    className = undefined,
    interactive = undefined,
    children,
  }: LeafletTooltipProps = $props()

  const mapState = useLeafletMap()
  const parentLayer = useParentLeafletLayer()

  let el = $state<HTMLElement | null>(null)
  let tooltip: L.Tooltip | null = null
  let boundTo: L.Layer | null = null
  let cancelled = false

  onDestroy(() => {
    cancelled = true
    try {
      boundTo?.unbindTooltip()
      tooltip?.remove()
    } catch {
      /* map already destroyed */
    }
  })

  $effect(() => {
    const map = mapState.map
    const layer = parentLayer?.layer ?? null
    if (!browser || !map || !el) return
    if (layer) {
      if (boundTo === layer) return
      boundTo?.unbindTooltip()
      tooltip?.remove()
      tooltip = null
      boundTo = layer
      void (async () => {
        await loadLeaflet()
        if (cancelled) return
        layer.bindTooltip(el!, defined({ offset, direction, permanent, sticky, opacity, className, interactive } as Record<string, unknown>))
      })()
      return
    }
    if (lngLat && !tooltip) {
      void (async () => {
        const mod = await loadLeaflet()
        if (cancelled || tooltip) return
        tooltip = mod
          .tooltip(defined({ offset, direction, permanent, sticky, opacity, className, interactive } as Record<string, unknown>))
          .setLatLng(toLatLng(lngLat))
          .setContent(el!)
        tooltip.addTo(map)
      })()
    }
  })
</script>

<div bind:this={el} class="uipkge-leaflet-tooltip-src">
  {@render children?.()}
</div>
