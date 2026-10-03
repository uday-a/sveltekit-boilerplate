<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface LeafletPopupProps {
    /** [lng, lat] — standalone popup on the map. Omit inside a layer to bind to it. */
    lngLat?: [number, number]
    maxWidth?: number
    /** Minimum popup width. Defaults to 200 — keeps card-style content from collapsing narrow. */
    minWidth?: number
    offset?: [number, number]
    className?: string
    autoClose?: boolean
    closeOnClick?: boolean
    closeButton?: boolean
    keepInView?: boolean
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
    maxWidth = undefined,
    minWidth = 200,
    offset = undefined,
    className = undefined,
    autoClose = true,
    closeOnClick = true,
    closeButton = true,
    keepInView = false,
    children,
  }: LeafletPopupProps = $props()

  const mapState = useLeafletMap()
  const parentLayer = useParentLeafletLayer()

  let el = $state<HTMLElement | null>(null)
  let popup: L.Popup | null = null
  let boundTo: L.Layer | null = null
  let cancelled = false

  onDestroy(() => {
    cancelled = true
    try {
      boundTo?.unbindPopup()
      popup?.remove()
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
      boundTo?.unbindPopup()
      popup?.remove()
      popup = null
      boundTo = layer
      void (async () => {
        const mod = await loadLeaflet()
        if (cancelled) return
        void mod
        layer.bindPopup(el!, defined({ maxWidth, minWidth, offset, className, autoClose, closeOnClick, closeButton, keepInView } as Record<string, unknown>))
      })()
      return
    }
    if (lngLat && !popup) {
      void (async () => {
        const mod = await loadLeaflet()
        if (cancelled || popup) return
        popup = mod
          .popup(defined({ maxWidth, minWidth, offset, className, autoClose, closeOnClick, closeButton, keepInView } as Record<string, unknown>))
          .setLatLng(toLatLng(lngLat))
          .setContent(el!)
        popup.openOn(map)
      })()
    }
  })
</script>

<div bind:this={el} class="uipkge-leaflet-popup-src">
  {@render children?.()}
</div>
