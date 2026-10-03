<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type * as L from 'leaflet'

  export interface LeafletGeoJsonProps {
    /** GeoJSON FeatureCollection / Feature / geometry. */
    geojson: GeoJSON.GeoJSON
    /** Leaflet GeoJSON options: `style`, `pointToLayer`, `onEachFeature`, `filter`, `coordsToLatLng`. */
    options?: L.GeoJSONOptions
    children?: Snippet
    onclick?: (ev: L.LeafletMouseEvent) => void
  }
</script>

<script lang="ts">
  import { onDestroy } from 'svelte'
  import { setContext } from 'svelte'
  import { browser } from '$app/environment'
  import {
    loadLeaflet,
    useLeafletMap,
    LeafletLayerState,
    LEAFLET_LAYER_KEY,
  } from './leaflet-context.svelte'

  let { geojson, options = undefined, children, onclick }: LeafletGeoJsonProps = $props()

  const mapState = useLeafletMap()
  const layerState = new LeafletLayerState()
  setContext(LEAFLET_LAYER_KEY, layerState)

  let layer: L.GeoJSON | null = null
  let cancelled = false

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
      const gj = mod.geoJSON(geojson as never, options)
      if (onclick) gj.on('click', (ev) => onclick(ev as L.LeafletMouseEvent))
      gj.addTo(map)
      layer = gj
      layerState.layer = gj
    })()
  })

  $effect(() => {
    if (layer && geojson) {
      layer.clearLayers()
      layer.addData(geojson as never)
    }
  })
</script>

<div class="hidden">
  {@render children?.()}
</div>
