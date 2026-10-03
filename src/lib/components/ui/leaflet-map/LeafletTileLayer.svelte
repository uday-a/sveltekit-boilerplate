<script lang="ts" module>
  export interface LeafletTileLayerProps {
    /** Raster tile URL template ({z}/{x}/{y}, optional {s} subdomains + {r} retina). */
    url: string
    attribution?: string
    subdomains?: string | string[]
    minZoom?: number
    maxZoom?: number
    opacity?: number
    zIndex?: number
    tms?: boolean
  }
</script>

<script lang="ts">
  import { onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import type * as L from 'leaflet'
  import { defined, loadLeaflet, useLeafletMap } from './leaflet-context.svelte'

  let {
    url,
    attribution = undefined,
    subdomains = undefined,
    minZoom = undefined,
    maxZoom = undefined,
    opacity = undefined,
    zIndex = undefined,
    tms = undefined,
  }: LeafletTileLayerProps = $props()

  const mapState = useLeafletMap()
  let layer: L.TileLayer | null = null
  let cancelled = false

  onDestroy(() => {
    cancelled = true
    try {
      layer?.remove()
    } catch {
      /* map already destroyed */
    }
    layer = null
  })

  $effect(() => {
    const map = mapState.map
    if (!browser || !map || layer) return
    void (async () => {
      const mod = await loadLeaflet()
      if (cancelled || layer) return
      layer = mod.tileLayer(
        url,
        defined({ attribution, subdomains, minZoom, maxZoom, opacity, zIndex, tms }),
      )
      layer.addTo(map)
    })()
  })

  $effect(() => {
    if (layer && url) layer.setUrl(url)
  })
  $effect(() => {
    if (layer && opacity !== undefined) layer.setOpacity(opacity)
  })
  $effect(() => {
    if (layer && zIndex !== undefined) layer.setZIndex(zIndex)
  })
</script>

<div class="hidden"></div>
