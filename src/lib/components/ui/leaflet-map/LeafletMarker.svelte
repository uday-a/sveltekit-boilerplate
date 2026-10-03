<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type * as L from 'leaflet'

  export type MarkerAnchor =
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'

  export interface LeafletMarkerProps {
    /** [lng, lat] — Mapbox order. */
    lngLat: [number, number]
    /** Which edge/corner of the marker content sits on the coordinate. */
    anchor?: MarkerAnchor
    draggable?: boolean
    opacity?: number
    zIndexOffset?: number
    title?: string
    alt?: string
    children?: Snippet
    onclick?: (ev: L.LeafletMouseEvent) => void
    onready?: (marker: L.Marker) => void
  }
</script>

<script lang="ts">
  import { onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import {
    defined,
    loadLeaflet,
    toLatLng,
    useLeafletMap,
    LEAFLET_LAYER_KEY,
    LeafletLayerState,
  } from './leaflet-context.svelte'
  import { setContext } from 'svelte'

  let {
    lngLat,
    anchor = 'center',
    draggable = undefined,
    opacity = undefined,
    zIndexOffset = undefined,
    title = undefined,
    alt = undefined,
    children,
    onclick,
    onready,
  }: LeafletMarkerProps = $props()

  const mapState = useLeafletMap()
  // This marker's own layer scope for nested popups/tooltips.
  const layerState = new LeafletLayerState()
  setContext(LEAFLET_LAYER_KEY, layerState)

  let el = $state<HTMLElement | null>(null)
  let marker: L.Marker | null = null
  let cancelled = false

  onDestroy(() => {
    cancelled = true
    try {
      marker?.remove()
    } catch {
      /* map already destroyed */
    }
    marker = null
    layerState.layer = null
  })

  $effect(() => {
    const map = mapState.map
    if (!browser || !map || marker) return
    void lngLat
    void anchor
    let done = false
    ;(async () => {
      const mod = await loadLeaflet()
      if (cancelled || done || marker) return
      // Only treat slot content as icon when it holds non-popup/tooltip nodes.
      const hasIconContent = Boolean(el?.childNodes.length)
      const options: L.MarkerOptions = defined({
        interactive: true,
        draggable,
        opacity,
        zIndexOffset,
        title,
        alt,
      })
      if (hasIconContent && el) {
        options.icon = mod.divIcon({ className: 'uipkge-leaflet-div-icon', html: el })
      }
      const m = mod.marker(toLatLng(lngLat), options)
      if (onclick) m.on('click', (ev) => onclick(ev as L.LeafletMouseEvent))
      m.addTo(map)
      marker = m
      layerState.layer = m
      onready?.(m)
      done = true
    })()
  })

  $effect(() => {
    if (marker && lngLat) marker.setLatLng(toLatLng(lngLat))
  })
  $effect(() => {
    if (marker && opacity !== undefined) marker.setOpacity(opacity)
  })
  $effect(() => {
    if (marker && zIndexOffset !== undefined) marker.setZIndexOffset(zIndexOffset)
  })
</script>

<div bind:this={el} class="uipkge-leaflet-anchor" data-anchor={anchor}>
  {@render children?.()}
</div>
