<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type * as L from 'leaflet'

  export interface LeafletPolygonProps {
    /** Ring points as [lng, lat][] — or [lng, lat][][] for holes/multi-polygons. */
    lngLatPath: [number, number][] | [number, number][][]
    color?: string
    weight?: number
    opacity?: number
    lineCap?: 'butt' | 'round' | 'square'
    lineJoin?: 'miter' | 'round' | 'bevel'
    dashArray?: string | number[]
    dashOffset?: string
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
  import { setContext } from 'svelte'
  import { browser } from '$app/environment'
  import {
    defined,
    loadLeaflet,
    toLatLngs,
    useLeafletMap,
    LeafletLayerState,
    LEAFLET_LAYER_KEY,
  } from './leaflet-context.svelte'

  let {
    lngLatPath,
    color = undefined,
    weight = undefined,
    opacity = undefined,
    lineCap = undefined,
    lineJoin = undefined,
    dashArray = undefined,
    dashOffset = undefined,
    fill = undefined,
    fillColor = undefined,
    fillOpacity = undefined,
    className = undefined,
    children,
    onclick,
  }: LeafletPolygonProps = $props()

  const mapState = useLeafletMap()
  const layerState = new LeafletLayerState()
  setContext(LEAFLET_LAYER_KEY, layerState)

  let layer: L.Polygon | null = null
  let cancelled = false

  function pathOptions(): L.PolylineOptions {
    return defined({
      color,
      weight,
      opacity,
      lineCap,
      lineJoin,
      dashArray,
      dashOffset,
      fill,
      fillColor,
      fillOpacity,
      className,
      interactive: true,
    } as L.PolylineOptions)
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
      const polygon = mod.polygon(toLatLngs(lngLatPath) as L.LatLngExpression[], pathOptions())
      if (onclick) polygon.on('click', (ev) => onclick(ev as L.LeafletMouseEvent))
      polygon.addTo(map)
      layer = polygon
      layerState.layer = polygon
    })()
  })

  $effect(() => {
    if (layer && lngLatPath) layer.setLatLngs(toLatLngs(lngLatPath) as L.LatLngExpression[])
  })
  $effect(() => {
    void [color, weight, opacity, fill, fillColor, fillOpacity, dashArray]
    layer?.setStyle(pathOptions())
  })
</script>

<div class="hidden">
  {@render children?.()}
</div>
