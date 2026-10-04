<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import { SectionCard } from '$lib/components/ui/section-card'
</script>

<SectionCard title="Account details" description="Your workspace identity">
  <div class="flex items-center justify-between text-sm">
    <span class="text-muted-foreground">Plan</span>
    <Badge>Pro</Badge>
  </div>
</SectionCard>
