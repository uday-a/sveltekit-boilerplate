<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import type { LeafletMapVariant, LeafletMapVariants } from './leaflet-map.variants'
  import type { LeafletPosition } from './leaflet-context.svelte'
  import type * as L from 'leaflet'

  export interface LeafletMapProps extends HTMLAttributes<HTMLDivElement> {
    /** Named raster basemap preset. `muted` = theme-aware Esri canvas + desaturated tile pane. */
    variant?: LeafletMapVariant
    /** Height preset. Omit to size via `class`. */
    size?: LeafletMapVariants['size']
    /** Custom raster tile URL template — overrides `variant`. */
    tileUrl?: string
    /** Attribution HTML for a custom `tile-url`. */
    tileAttribution?: string
    /** Tile subdomains for a custom `tile-url`. */
    tileSubdomains?: string | string[]
    /** Initial [lng, lat] — Mapbox order. */
    center?: [number, number]
    zoom?: number
    minZoom?: number
    /** Caps the map's max zoom. Defaults to the tile provider's own maxZoom. */
    maxZoom?: number
    /** Show the zoom control. */
    navigation?: boolean
    /** Placement of the zoom control. */
    navigationPosition?: LeafletPosition
    /** Show the HTML5 fullscreen toggle button. */
    fullscreen?: boolean
    /** Placement of the fullscreen button. */
    fullscreenPosition?: LeafletPosition
    /** Show tile credits behind a ⓘ button. Keep on — OSM/Esri tiles require attribution. */
    attribution?: boolean
    /** Wheel zoom. Set false for maps embedded in scrollable pages. */
    scrollWheelZoom?: boolean
    /** Desaturate the tile pane to a quiet canvas (markers stay coloured). */
    muted?: boolean
    children?: Snippet
    oncreated?: (map: L.Map) => void
  }

  export interface LeafletMapRef {
    getMap: () => L.Map | null
    flyTo: (options?: { center?: [number, number], zoom?: number, duration?: number }) => void
    setView: (options?: { center?: [number, number], zoom?: number }) => void
    jumpTo: (options?: { center?: [number, number], zoom?: number }) => void
    fitBounds: (bounds: [[number, number], [number, number]] | L.LatLngBoundsExpression, options?: L.FitBoundsOptions) => void
    panTo: (center: [number, number]) => void
    zoomIn: () => void
    zoomOut: () => void
    resize: () => void
  }
</script>

<script lang="ts">
  import { onMount, setContext, tick } from 'svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import { browser } from '$app/environment'
  import { cn } from '$lib/utils'
  import {
    defined,
    fixDefaultLeafletIcon,
    loadLeaflet,
    toLatLng,
    toLatLngBounds,
    LEAFLET_MAP_KEY,
    LeafletMapState,
    type LeafletModule,
  } from './leaflet-context.svelte'
  import {
    leafletMapVariants,
    LEAFLET_TILES,
    LEAFLET_THEME_TILES,
    type LeafletTilePreset,
  } from './leaflet-map.variants'

  let {
    class: className,
    variant = 'default',
    size = undefined,
    tileUrl = undefined,
    tileAttribution = undefined,
    tileSubdomains = undefined,
    center = [0, 20],
    zoom = 2,
    minZoom = undefined,
    maxZoom = undefined,
    navigation = true,
    navigationPosition = 'bottom-right',
    fullscreen = false,
    fullscreenPosition = 'top-right',
    attribution = true,
    scrollWheelZoom = true,
    muted = false,
    children,
    oncreated,
    ...restProps
  }: LeafletMapProps = $props()

  const mapState = new LeafletMapState()
  // Published to LeafletMarker / LeafletPopup / … children.
  setContext(LEAFLET_MAP_KEY, mapState)

  const isMuted = $derived(muted || variant === 'muted')
  let htmlDark = $state(false)

  const resolvedTiles = $derived.by((): LeafletTilePreset => {
    if (tileUrl) {
      return {
        url: tileUrl,
        attribution:
          tileAttribution
          ?? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: tileSubdomains,
        maxZoom,
      }
    }
    if (variant && variant !== 'default' && variant !== 'muted' && LEAFLET_TILES[variant as keyof typeof LEAFLET_TILES]) {
      return LEAFLET_TILES[variant as keyof typeof LEAFLET_TILES]
    }
    return htmlDark ? LEAFLET_THEME_TILES.dark : LEAFLET_THEME_TILES.light
  })

  // Client-only: Leaflet needs the DOM, so SSR renders just the shell.
  let inView = $state(false)
  let containerRef = $state<HTMLDivElement | null>(null)
  let mapEl = $state<HTMLDivElement | null>(null)
  let Lmod: LeafletModule | null = null
  let baseLayer: L.TileLayer | null = null
  let overlayLayer: L.TileLayer | null = null
  let resizeObserver: ResizeObserver | null = null
  let intersectionObserver: IntersectionObserver | null = null
  let themeObserver: MutationObserver | null = null

  let attributions = $state<string[]>([])
  let showAttribution = $state(false)
  let isFullscreen = $state(false)
  let canZoomIn = $state(true)
  let canZoomOut = $state(true)

  function applyTiles(tiles: LeafletTilePreset) {
    const m = mapState.map
    const mod = Lmod
    if (!m || !mod) return
    baseLayer?.remove()
    baseLayer = null
    overlayLayer?.remove()
    overlayLayer = null
    baseLayer = mod.tileLayer(tiles.url, {
      attribution: tiles.attribution,
      ...(tiles.subdomains ? { subdomains: tiles.subdomains } : {}),
      maxZoom: tiles.maxZoom ?? 19,
    })
    baseLayer.addTo(m)
    if (tiles.overlayUrl) {
      overlayLayer = mod.tileLayer(tiles.overlayUrl, { maxZoom: tiles.maxZoom ?? 19 })
      overlayLayer.addTo(m)
    }
  }

  function collectAttributions() {
    const m = mapState.map
    if (!m) return
    const seen = new SvelteSet<string>()
    m.eachLayer((layer) => {
      const a = (layer as L.TileLayer).options?.attribution
      if (typeof a === 'string' && a) seen.add(a)
    })
    attributions = [...seen]
  }

  function syncZoomBounds() {
    const m = mapState.map
    if (!m) return
    canZoomIn = m.getZoom() < m.getMaxZoom()
    canZoomOut = m.getZoom() > m.getMinZoom()
  }

  function createMap() {
    const el = mapEl
    const mod = Lmod
    if (!el || !mod || mapState.map) return
    fixDefaultLeafletIcon(mod)
    const tiles = resolvedTiles
    const m = mod.map(
      el,
      defined({
        center: toLatLng(center ?? [0, 20]),
        zoom,
        minZoom,
        maxZoom: maxZoom ?? tiles.maxZoom,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom,
      }),
    )
    mapState.map = m
    applyTiles(tiles)
    m.on('zoomend', syncZoomBounds)
    syncZoomBounds()
    m.on('layeradd layerremove', collectAttributions)
    collectAttributions()
    oncreated?.(m)
  }

  async function ensureLeaflet() {
    if (!browser || mapState.map || !Lmod) {
      if (!browser || mapState.map) return
    }
    Lmod = await loadLeaflet()
    // The map div mounts under {#if inView} — flush first, otherwise
    // createMap sees mapEl === null and silently gives up forever.
    await tick()
    createMap()
  }

  onMount(() => {
    const root = document.documentElement
    const syncTheme = () => {
      htmlDark = root.classList.contains('dark')
    }
    syncTheme()
    themeObserver = new MutationObserver(syncTheme)
    themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] })

    const el = containerRef
    if (!el || typeof IntersectionObserver === 'undefined') {
      inView = true
      void ensureLeaflet()
    } else {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          const visible = entry?.isIntersecting ?? true
          inView = visible
          if (visible) void ensureLeaflet()
        },
        { rootMargin: '160px', threshold: 0.01 },
      )
      intersectionObserver.observe(el)
    }
    if (typeof ResizeObserver !== 'undefined' && el) {
      resizeObserver = new ResizeObserver(() => {
        mapState.map?.invalidateSize()
      })
      resizeObserver.observe(el)
    }

    const onFullscreenChange = () => {
      isFullscreen = Boolean(document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)

    return () => {
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      themeObserver?.disconnect()
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      mapState.map?.remove()
      mapState.map = null
    }
  })

  // Retile on variant / theme / custom-tile changes.
  $effect(() => {
    const tiles = resolvedTiles
    if (browser && mapState.map) applyTiles(tiles)
  })

  $effect(() => {
    if (!browser || !mapState.map || !center) return
    void zoom
    mapState.map.setView(toLatLng(center), zoom)
  })

  $effect(() => {
    if (!browser || !mapState.map) return
    if (scrollWheelZoom) mapState.map.scrollWheelZoom.enable()
    else mapState.map.scrollWheelZoom.disable()
  })

  $effect(() => {
    if (!attribution) showAttribution = false
  })

  function toggleFullscreen() {
    if (!browser) return
    const el = containerRef
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
  }

  /** Mapbox-style camera shim — accepts { center: [lng, lat], zoom, duration(ms) }. */
  export function flyTo(options: { center?: [number, number], zoom?: number, duration?: number } = {}) {
    const m = mapState.map
    if (!m) return
    const target = options.center ? toLatLng(options.center) : m.getCenter()
    m.flyTo(target, options.zoom ?? m.getZoom(), { duration: (options.duration ?? 800) / 1000 })
  }

  export function setView(options: { center?: [number, number], zoom?: number } = {}) {
    const m = mapState.map
    if (!m) return
    m.setView(options.center ? toLatLng(options.center) : m.getCenter(), options.zoom ?? m.getZoom())
  }

  export function jumpTo(options: { center?: [number, number], zoom?: number } = {}) {
    const m = mapState.map
    if (!m) return
    m.setView(options.center ? toLatLng(options.center) : m.getCenter(), options.zoom ?? m.getZoom(), { animate: false })
  }

  export function getMap(): L.Map | null {
    return mapState.map
  }
  export function fitBounds(
    bounds: [[number, number], [number, number]] | L.LatLngBoundsExpression,
    options?: L.FitBoundsOptions,
  ) {
    mapState.map?.fitBounds(toLatLngBounds(bounds as [[number, number], [number, number]]), options)
  }

  export function panTo(c: [number, number]) {
    mapState.map?.panTo(toLatLng(c))
  }

  export function zoomIn() {
    mapState.map?.zoomIn()
  }

  export function zoomOut() {
    mapState.map?.zoomOut()
  }

  export function resize() {
    mapState.map?.invalidateSize()
  }

  const cornerOrder: Array<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]

  const cornerClass = $derived.by((): Record<string, string> => ({
    'top-left': 'left-3 top-3',
    'top-right': 'right-3 top-3',
    'bottom-left': attribution && attributions.length ? 'bottom-9 left-3' : 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  }))
</script>

<div
  bind:this={containerRef}
  data-uipkge
  data-slot="leaflet-map"
  data-variant={variant}
  data-muted={isMuted}
  class={cn(leafletMapVariants({ variant, ...(size ? { size } : {}) }), className)}
  {...restProps}
>
  {#if inView}
    <div bind:this={mapEl} class="size-full"></div>
  {/if}
  {#each cornerOrder as corner (corner)}
    {#if mapState.map && ((navigation && navigationPosition === corner) || (fullscreen && fullscreenPosition === corner))}
      <div class="absolute z-[1000] flex flex-col gap-2.5 {cornerClass[corner]}">
        {#if navigation && navigationPosition === corner}
          <div class="border-border bg-card divide-border flex flex-col divide-y overflow-hidden rounded-lg border shadow-sm">
            <button
              type="button"
              class="text-muted-foreground hover:bg-muted flex size-8 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-40"
              aria-label="Zoom in"
              disabled={!canZoomIn}
              onclick={() => mapState.map?.zoomIn()}
            >
              <svg class="size-full" viewBox="0 0 29 29" fill="currentColor" aria-hidden="true">
                <path
                  d="M14.5 8.5c-.75 0-1.5.75-1.5 1.5v3h-3c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h3v3c0 .75.75 1.5 1.5 1.5S16 19.75 16 19v-3h3c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-3v-3c0-.75-.75-1.5-1.5-1.5z"
                />
              </svg>
            </button>
            <button
              type="button"
              class="text-muted-foreground hover:bg-muted flex size-8 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-40"
              aria-label="Zoom out"
              disabled={!canZoomOut}
              onclick={() => mapState.map?.zoomOut()}
            >
              <svg class="size-full" viewBox="0 0 29 29" fill="currentColor" aria-hidden="true">
                <path d="M10 13c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h9c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-9z" />
              </svg>
            </button>
          </div>
        {/if}
        {#if fullscreen && fullscreenPosition === corner}
          <button
            type="button"
            class="border-border bg-card text-muted-foreground hover:bg-muted flex size-8 items-center justify-center rounded-lg border shadow-sm transition-colors"
            aria-label="Toggle fullscreen"
            onclick={toggleFullscreen}
          >
            <svg class="size-full" viewBox="0 0 29 29" fill="currentColor" aria-hidden="true">
              {#if isFullscreen}
                <path
                  d="M18.5 16c-1.75 0-2.5.75-2.5 2.5V24h1l1.5-3 5.5 4 1-1-4-5.5 3-1.5v-1h-5.5zM13 18.5c0-1.75-.75-2.5-2.5-2.5H5v1l3 1.5L4 24l1 1 5.5-4 1.5 3h1v-5.5zm3-8c0 1.75.75 2.5 2.5 2.5H24v-1l-3-1.5L25 5l-1-1-5.5 4L17 5h-1v5.5zM10.5 13c1.75 0 2.5-.75 2.5-2.5V5h-1l-1.5 3L5 4 4 5l4 5.5L5 12v1h5.5z"
                />
              {:else}
                <path
                  d="M24 16v5.5c0 1.75-.75 2.5-2.5 2.5H16v-1l3-1.5-4-5.5 1-1 5.5 4 1.5-3h1zM6 16l1.5 3 5.5-4 1 1-4 5.5 3 1.5v1H7.5C5.75 24 5 23.25 5 21.5V16h1zm7-11v1l-3 1.5 4 5.5-1 1-5.5-4L6 13H5V7.5C5 5.75 5.75 5 7.5 5H13zm11 2.5c0-1.75-.75-2.5-2.5-2.5H16v1l3 1.5-4 5.5 1 1 5.5-4 1.5 3h1V7.5z"
                />
              {/if}
            </svg>
          </button>
        {/if}
      </div>
    {/if}
  {/each}
  <!-- Tile credits behind a Mapbox-style ⓘ button: hover reveals on desktop,
       tap toggles on touch. Keep visible — OSM/Esri tiles require credit. -->
  {#if mapState.map && attribution && attributions.length}
    <div class="group absolute bottom-3 left-3 z-[1000] flex flex-col items-start gap-1.5">
      <div
        class="border-border bg-popover text-popover-foreground max-w-64 rounded-md border px-2.5 py-1.5 text-xs leading-relaxed shadow-md transition-opacity [&_a]:underline {showAttribution
          ? 'visible opacity-100'
          : 'invisible opacity-0 group-hover:visible group-hover:opacity-100'}"
        role="note"
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html attributions.join(' | ')}
      </div>
      <button
        type="button"
        class="border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground flex size-4 items-center justify-center rounded-full border shadow-xs transition-colors"
        aria-label="Map data attribution"
        aria-expanded={showAttribution}
        onclick={() => (showAttribution = !showAttribution)}
      >
        <svg
          class="size-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
    </div>
  {/if}
  {@render children?.()}
</div>
