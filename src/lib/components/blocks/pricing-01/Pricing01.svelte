<script lang="ts" module>
  export type BillingCycle = 'monthly' | 'yearly'

  // Plan keys match `Plan` in $lib/server/polar.ts so the parent page
  // can pass them straight to /api/billing/checkout.
  export type PricingPlan = 'pro' | 'team' | 'enterprise'

  export interface Pricing01Props {
    onSubscribe?: (plan: PricingPlan, cycle: BillingCycle) => void
    onContactSales?: () => void
  }
</script>

<script lang="ts">
  import { Check, Sparkles } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'

  let { onSubscribe, onContactSales }: Pricing01Props = $props()

  let cycle: BillingCycle = $state('monthly')
</script>

{#snippet features(items: string[])}
  <ul class="space-y-3 text-sm">
    {#each items as item (item)}
      <li class="flex items-start gap-2">
        <Check class="text-success mt-0.5 size-4 shrink-0" />
        <span>{item}</span>
      </li>
    {/each}
  </ul>
{/snippet}

<section data-slot="pricing-01" class="bg-background">
  <div class="mx-auto max-w-6xl px-6 py-24">
    <div class="mb-10 text-center">
      <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Pricing</p>
      <h2 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Plans for teams of every size</h2>
      <p class="text-muted-foreground mx-auto mt-3 max-w-xl text-lg">
        No hidden fees. Cancel anytime. Save 20% with annual billing.
      </p>

      <div class="mt-6 inline-flex">
        <ToggleGroup
          type="single"
          value={cycle}
          onValueChange={(v) => typeof v === 'string' && v && (cycle = v as BillingCycle)}
        >
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="yearly">
            Yearly
            <Badge variant="secondary" class="ml-2">−20%</Badge>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle class="text-xl">Starter</CardTitle>
          <CardDescription>For small teams trying things out.</CardDescription>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-4xl font-semibold tracking-tight tabular-nums">${cycle === 'monthly' ? 9 : 7}</span>
            <span class="text-muted-foreground text-sm">/ user / month</span>
          </div>
        </CardHeader>
        <CardContent>
          {@render features(['Up to 10 employees', 'Core HR + directory', 'Time off + holidays', 'Email support'])}
        </CardContent>
        <CardFooter>
          {#if onSubscribe}
            <Button class="w-full" variant="outline" onclick={() => onSubscribe('pro', cycle)}>Start free</Button>
          {:else}
            <Button class="w-full" variant="outline">
              {#snippet child({ props })}<a href="/sign-up" {...props}>Start free</a>{/snippet}
            </Button>
          {/if}
        </CardFooter>
      </Card>

      <div class="relative">
        <Badge class="absolute -top-3 left-1/2 z-10 -translate-x-1/2 gap-1 shadow-sm">
          <Sparkles class="size-3" /> Most popular
        </Badge>
        <!-- WHY: flat system -- shadow-sm only. The highlighted
             plan keeps its ring; elevation doesn't carry the emphasis. -->
        <Card class="border-primary ring-primary/10 shadow-sm ring-1">
          <CardHeader>
            <CardTitle class="text-xl">Team</CardTitle>
            <CardDescription>For growing companies scaling people ops.</CardDescription>
            <div class="mt-4 flex items-baseline gap-1">
              <span class="text-4xl font-semibold tracking-tight tabular-nums">${cycle === 'monthly' ? 29 : 24}</span>
              <span class="text-muted-foreground text-sm">/ user / month</span>
            </div>
          </CardHeader>
          <CardContent>
            {@render features([
              'Unlimited employees',
              'Payroll + tax filing',
              'Onboarding workflows',
              'Performance reviews',
              'Slack + priority support',
            ])}
          </CardContent>
          <CardFooter>
            {#if onSubscribe}
              <Button class="w-full" onclick={() => onSubscribe('team', cycle)}>Start 14-day trial</Button>
            {:else}
              <Button class="w-full">
                {#snippet child({ props })}<a href="/sign-up" {...props}>Start 14-day trial</a>{/snippet}
              </Button>
            {/if}
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="text-xl">Enterprise</CardTitle>
          <CardDescription>Custom controls for regulated industries.</CardDescription>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-3xl font-semibold tracking-tight">Custom</span>
          </div>
        </CardHeader>
        <CardContent>
          {@render features([
            'Everything in Team',
            'SSO + SCIM provisioning',
            'Audit logs + role policies',
            'Dedicated success manager',
            '99.99% SLA',
          ])}
        </CardContent>
        <CardFooter>
          {#if onContactSales}
            <Button class="w-full" variant="outline" onclick={onContactSales}>Talk to sales</Button>
          {:else}
            <Button class="w-full" variant="outline">
              {#snippet child({ props })}<a href="/login" {...props}>Talk to sales</a>{/snippet}
            </Button>
          {/if}
        </CardFooter>
      </Card>
    </div>
  </div>
</section>
