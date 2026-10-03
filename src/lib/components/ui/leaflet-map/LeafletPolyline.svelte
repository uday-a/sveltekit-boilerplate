<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type * as L from 'leaflet'

  export interface LeafletPolylineProps {
    /** Path points as [lng, lat][] — or [lng, lat][][] for multi-part lines. */
    lngLatPath: [number, number][] | [number, number][][]
    color?: string
    weight?: number
    opacity?: number
    lineCap?: 'butt' | 'round' | 'square'
    lineJoin?: 'miter' | 'round' | 'bevel'
    dashArray?: string | number[]
    dashOffset?: string
    smoothFactor?: number
    noClip?: boolean
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
    smoothFactor = undefined,
    noClip = undefined,
    className = undefined,
    children,
    onclick,
  }: LeafletPolylineProps = $props()

  const mapState = useLeafletMap()
  const layerState = new LeafletLayerState()
  setContext(LEAFLET_LAYER_KEY, layerState)

  let layer: L.Polyline | null = null
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
      smoothFactor,
      noClip,
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
      const line = mod.polyline(toLatLngs(lngLatPath) as L.LatLngExpression[], pathOptions())
      if (onclick) line.on('click', (ev) => onclick(ev as L.LeafletMouseEvent))
      line.addTo(map)
      layer = line
      layerState.layer = line
    })()
  })

  $effect(() => {
    if (layer && lngLatPath) layer.setLatLngs(toLatLngs(lngLatPath) as L.LatLngExpression[])
  })
  $effect(() => {
    void [color, weight, opacity, dashArray, dashOffset, lineCap, lineJoin]
    layer?.setStyle(pathOptions())
  })
</script>

<div class="hidden">
  {@render children?.()}
</div>
