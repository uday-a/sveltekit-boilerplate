<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type * as L from 'leaflet'

  export interface LeafletCircleProps {
    /** [lng, lat] — Mapbox order. */
    center: [number, number]
    /** Radius in meters. */
    radius?: number
    color?: string
    weight?: number
    opacity?: number
    dashArray?: string | number[]
    fill?: boolean
    fillColor?: string
    fillOpacity?: number
    className?: string
    children?: Snippet
    onclick?: (ev: L.LeafletMouseEvent) => void
  }
</script>

<script lang="ts">
  import { onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { defined, loadLeaflet, toLatLng, useLeafletMap } from './leaflet-context.svelte'
  import { LeafletLayerState, LEAFLET_LAYER_KEY } from './leaflet-context.svelte'
  import { setContext } from 'svelte'

  let {
    center,
    radius = undefined,
    color = undefined,
    weight = undefined,
    opacity = undefined,
    dashArray = undefined,
    fill = undefined,
    fillColor = undefined,
    fillOpacity = undefined,
    className = undefined,
    children,
    onclick,
  }: LeafletCircleProps = $props()

  const mapState = useLeafletMap()
  const layerState = new LeafletLayerState()
  setContext(LEAFLET_LAYER_KEY, layerState)

  let layer: L.Circle | null = null
  let cancelled = false

  function pathOptions(): L.CircleMarkerOptions {
    return defined({
      color,
      weight,
      opacity,
      dashArray,
      fill,
      fillColor,
      fillOpacity,
      className,
      interactive: true,
    } as L.CircleMarkerOptions)
  }

  onDestroy(() => {
    cancelled = true
    try {
      layer?.remove()
    } catch {
      /* map already destroyed */
    }
    layer = null
    layerState.layer = null
  })

  $effect(() => {
    const map = mapState.map
    if (!browser || !map || layer) return
    void (async () => {
      const mod = await loadLeaflet()
      if (cancelled || layer) return
      const circle = mod.circle(toLatLng(center), { ...pathOptions(), radius: radius ?? 10 })
      if (onclick) circle.on('click', (ev) => onclick(ev as L.LeafletMouseEvent))
      circle.addTo(map)
      layer = circle
      layerState.layer = circle
    })()
  })

  $effect(() => {
    if (layer && center) layer.setLatLng(toLatLng(center))
  })
  $effect(() => {
    if (layer && radius !== undefined) layer.setRadius(radius)
  })
  $effect(() => {
    void [color, weight, opacity, fill, fillColor, fillOpacity, dashArray]
    layer?.setStyle(pathOptions())
  })
</script>

<div class="hidden">
  {@render children?.()}
</div>
