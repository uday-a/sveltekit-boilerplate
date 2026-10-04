<script lang="ts">
  import { LeafletMap, LeafletMarker, LeafletPopup } from '$lib/components/ui/leaflet-map'

  const offices: { city: string, lngLat: [number, number] }[] = [
    { city: 'New York', lngLat: [-74.006, 40.7128] },
    { city: 'London', lngLat: [-0.1276, 51.5072] },
    { city: 'Berlin', lngLat: [13.405, 52.52] },
  ]
</script>

<LeafletMap
  variant="muted"
  center={[-30, 45]}
  zoom={1.6}
  minZoom={1.4}
  scrollWheelZoom={false}
  navigation={false}
  class="h-56 w-full overflow-hidden rounded-lg border"
>
  {#each offices as office (office.city)}
    <LeafletMarker lngLat={office.lngLat} anchor="center">
      <span class="bg-primary ring-primary/20 block size-3.5 rounded-full ring-4"></span>
      <LeafletPopup offset={[0, -10]}>
        <p class="text-foreground text-sm font-semibold">{office.city}</p>
      </LeafletPopup>
    </LeafletMarker>
  {/each}
</LeafletMap>
