<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <span class="text-muted-foreground font-mono text-xs">
      curl --request POST https://api.uipkge.dev/v1/workforce
    </span>
    <Badge variant="secondary" class="font-mono text-xs">TypeScript SDK</Badge>
  </div>
  <div
    class="overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-xs leading-relaxed text-foreground"
  >
    <span class="text-muted-foreground">// Initialize client with zero-latency edge caching</span><br />
    <span class="text-chart-1">import</span> {'{'} <span class="text-chart-2">UipkgeClient</span> }
    <span class="text-chart-1">from</span> <span class="text-chart-5">'@uipkge/sdk'</span><br /><br />
    <span class="text-chart-1">const</span> client = <span class="text-chart-1">new</span>
    <span class="text-chart-2">UipkgeClient</span>({'{'} apiKey: process.env.<span class="text-chart-4">UIPKGE_KEY</span>
    })<br /><br />
    <span class="text-chart-1">const</span> {'{'} data } = <span class="text-chart-1">await</span> client.directory.<span
      class="text-chart-4"
      >syncOrgChart</span
    >({'{'})<br />
    &nbsp;&nbsp;autoProvision: <span class="text-chart-3">true</span>,<br />
    &nbsp;&nbsp;enforceMfa: <span class="text-chart-3">true</span>,<br />
    &nbsp;&nbsp;scimSyncInterval: <span class="text-chart-3">300</span>,<br />
    })
  </div>
</div>
