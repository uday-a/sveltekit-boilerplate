import { getContext, onDestroy, setContext } from 'svelte'
import { browser } from '$app/environment'
import type * as L from 'leaflet'

export const LEAFLET_MAP_KEY = 'uipkge-leaflet-map'
export const LEAFLET_LAYER_KEY = 'uipkge-leaflet-layer'

export type LeafletModule = typeof import('leaflet')
export type LeafletPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

let leafletPromise: Promise<LeafletModule> | null = null

/**
 * Lazily loads Leaflet's ESM build. Leaflet touches `window`/`document` at
 * import time, so a static top-level import would crash SSR renders — every
 * consumer resolves the module only on the client, via `onMount` /
 * `$effect` (which never run during SSR). Call only when `browser` is true.
 */
export function loadLeaflet(): Promise<LeafletModule> {
  if (!leafletPromise) leafletPromise = import('leaflet')
  return leafletPromise
}

/** [lng, lat] (Mapbox order) -> Leaflet [lat, lng]. */
export function toLatLng(c: [number, number]): L.LatLngExpression {
  return [c[1], c[0]]
}

/** Converts a [lng, lat][] path to Leaflet [lat, lng][]. */
export function toLatLngs(
  path: [number, number][] | [number, number][][],
): L.LatLngExpression[] | L.LatLngExpression[][] {
  if (!path.length) return []
  const first = (path as unknown[])[0] as unknown
  return Array.isArray(first)
    ? (path as [number, number][][]).map((ring) => ring.map(toLatLng))
    : (path as [number, number][]).map(toLatLng)
}

/** [[west,south],[east,north]] in [lng, lat] -> a bounds literal Leaflet accepts. */
export function toLatLngBounds(bounds: [[number, number], [number, number]]): L.LatLngBoundsExpression {
  return [toLatLng(bounds[0]), toLatLng(bounds[1])] as L.LatLngBoundsExpression
}

/**
 * Leaflet merges layer options by assignment, so passing `undefined` would
 * clobber its defaults (e.g. `subdomains: 'abc'` -> crash). Strip undefined
 * keys before handing options to Leaflet.
 */
export function defined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
}

/** Reactive map holder published by the enclosing `<LeafletMap>`. */
export class LeafletMapState {
  map = $state<L.Map | null>(null)
}

/** Reactive layer holder published by marker/shape parents for popup/tooltip binding. */
export class LeafletLayerState {
  layer = $state<L.Layer | null>(null)
}

/** Injects the map state published by the enclosing `<LeafletMap>`. */
export function useLeafletMap(): LeafletMapState {
  const state = getContext<LeafletMapState>(LEAFLET_MAP_KEY)
  if (!state) throw new Error('uipkge: Leaflet* components must be rendered inside <LeafletMap>.')
  return state
}

/** The nearest ancestor layer (marker, polyline, …) a popup/tooltip binds to. */
export function useParentLeafletLayer(): LeafletLayerState | null {
  return getContext<LeafletLayerState | null>(LEAFLET_LAYER_KEY) ?? null
}

/**
 * Waits for the enclosing `<LeafletMap>` instance, builds the layer once,
 * adds it to the map, and removes it on unmount. The layer is also provided
 * so nested `<LeafletPopup>` / `<LeafletTooltip>` children can bind to it.
 *
 * Must be called during component initialization. Returns the per-component
 * `layerState` (provided via context) plus a `track()` helper the component
 * calls inside its own `$effect` (which reads `mapState.map`, so the effect
 * re-runs when the map becomes ready).
 */
export function useLeafletLayer<T extends L.Layer>(
  build: (map: L.Map, mod: LeafletModule) => T,
  opts: { addToMap?: boolean } = {},
): { get layer(): T | null } {
  const mapState = useLeafletMap()
  const layerState = new LeafletLayerState()
  // Re-provided per layer component so nested `<LeafletPopup>` /
  // `<LeafletTooltip>` children bind to this layer. Runs during the caller's
  // component initialization, where setContext is legal.
  setContext(LEAFLET_LAYER_KEY, layerState)
  let layer: T | null = null
  let cancelled = false

  async function ensure(map: L.Map) {
    if (!browser || cancelled || layer) return
    const mod = await loadLeaflet()
    if (cancelled || layer) return
    const instance = build(map, mod)
    layer = instance
    layerState.layer = instance
    if (opts.addToMap !== false) instance.addTo(map)
  }

  // Tracked by the caller's $effect (reads mapState.map).
  function track() {
    const map = mapState.map
    if (map) void ensure(map)
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

  return {
    get layer() {
      return layer
    },
    track,
    layerState,
  } as unknown as { get layer(): T | null }
}

const LEAFLET_ICON_BASE = 'https://unpkg.com/leaflet@1.9.4/dist/images'
let defaultIconFixed = false

/**
 * Leaflet's default pin references image paths relative to the CSS file, which
 * bundlers can't resolve — point them at the versioned unpkg assets instead.
 * Only matters for markers without custom slot content.
 */
export function fixDefaultLeafletIcon(mod: LeafletModule) {
  if (defaultIconFixed) return
  defaultIconFixed = true
  mod.Icon.Default.mergeOptions({
    iconRetinaUrl: `${LEAFLET_ICON_BASE}/marker-icon-2x.png`,
    iconUrl: `${LEAFLET_ICON_BASE}/marker-icon.png`,
    shadowUrl: `${LEAFLET_ICON_BASE}/marker-shadow.png`,
  })
}
