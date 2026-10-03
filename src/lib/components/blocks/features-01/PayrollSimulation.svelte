<script lang="ts">
  import { Globe } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'

  let grossAmount = $state(184000)
  let payrollTaxRate = $state(18.5)
  let simulatedEmployeesCount = $state(42)
  const estimatedDeductions = $derived(grossAmount * (payrollTaxRate / 100))
  const netPayout = $derived(grossAmount - estimatedDeductions)
</script>

<div class="space-y-5">
  <div class="grid grid-cols-3 gap-3">
    <div class="border-border bg-muted/20 rounded-lg border p-3">
      <p class="text-muted-foreground font-mono text-xs">Gross Run</p>
      <p class="text-foreground mt-1 text-lg font-semibold">${grossAmount.toLocaleString()}</p>
    </div>
    <div class="border-border bg-muted/20 rounded-lg border p-3">
      <p class="text-muted-foreground font-mono text-xs">Statutory Taxes</p>
      <p class="text-destructive mt-1 text-lg font-semibold">-${Math.round(estimatedDeductions).toLocaleString()}</p>
    </div>
    <div class="border-border border-success/20 bg-success/10 rounded-lg border p-3">
      <p class="text-success font-mono text-xs">Net Settlement</p>
      <p class="text-success mt-1 text-lg font-semibold">${Math.round(netPayout).toLocaleString()}</p>
    </div>
  </div>

  <div class="space-y-2">
    <div class="flex justify-between text-xs">
      <span class="text-muted-foreground">Adjust Headcount (Employees: {simulatedEmployeesCount})</span>
      <span class="text-foreground font-mono">${(grossAmount / simulatedEmployeesCount).toFixed(0)}/mo avg</span>
    </div>
    <input
      bind:value={simulatedEmployeesCount}
      type="range"
      min="10"
      max="150"
      class="bg-muted accent-primary h-1.5 w-full cursor-pointer appearance-none rounded-lg"
    />
  </div>

  <div class="border-border bg-background flex items-center justify-between rounded-lg border p-3 text-xs">
    <div class="flex items-center gap-2">
      <Globe class="text-primary size-4" />
      <span>Cross-border SEPA & FedNow Instant Payout Batch: Ready</span>
    </div>
    <Badge variant="secondary" class="font-mono text-xs">Zero-FX Spread</Badge>
  </div>
</div>
