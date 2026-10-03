<script lang="ts">
  import { CheckCircle2 } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'

  const controls = [
    { name: 'TLS 1.3 Strict Transport Security', framework: 'SOC 2 / ISO 27001', passed: true, score: '100%' },
    { name: 'Continuous Automated Evidence Sync', framework: 'HIPAA Security Rule', passed: true, score: '99.8%' },
    { name: 'Hardware Security Keys MFA Enforced', framework: 'Zero Trust Baseline', passed: true, score: '100%' },
    { name: 'Automated Ephemeral DB Credential TTL', framework: 'SOC 2 CC6.1', passed: true, score: '99.4%' },
  ]
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between text-xs">
    <span class="text-foreground font-semibold">Continuous Automated Compliance Check (142 Controls)</span>
    <Badge variant="outline" class="border-success/20 bg-success/10 text-success font-mono text-xs">
      Audit Grade A+
    </Badge>
  </div>

  <div class="space-y-2.5">
    {#each controls as ctrl (ctrl.name)}
      <div class="border-border bg-background flex items-center justify-between rounded-lg border p-3 text-xs">
        <div class="flex items-center gap-2.5">
          <CheckCircle2 class="text-success size-4 shrink-0" />
          <div>
            <p class="text-foreground font-medium">{ctrl.name}</p>
            <p class="text-muted-foreground font-mono text-xs">{ctrl.framework}</p>
          </div>
        </div>
        <span class="text-success font-mono text-xs font-semibold">{ctrl.score}</span>
      </div>
    {/each}
  </div>
</div>
