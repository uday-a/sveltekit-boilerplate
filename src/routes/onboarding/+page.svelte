<script lang="ts">
  import { goto } from '$app/navigation'
  import { Check, ArrowRight } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'

  // Auth is enforced by hooks.server.ts (PROTECTED_PREFIXES includes
  // '/onboarding') — anonymous visitors bounce to /login?next=/onboarding.

  const steps = ['Profile', 'Workspace', 'Invite'] as const
  let step = $state<0 | 1 | 2>(0)

  let fullName = $state('')
  let role = $state('')
  let workspaceName = $state('')
  let workspaceSize = $state('1-5')
  let invites = $state('')

  function next() {
    if (step < 2) step = (step + 1) as 0 | 1 | 2
    else goto('/dashboard')
  }
  function back() {
    if (step > 0) step = (step - 1) as 0 | 1 | 2
  }
  function skip() {
    goto('/dashboard')
  }
</script>

<svelte:head>
  <title>Welcome | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <main class="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-4">
    <ol class="mb-4 flex items-center gap-3 text-xs">
      {#each steps as label, i (label)}
        <li class="flex items-center gap-2">
          <span
            class={'flex size-6 items-center justify-center rounded-full border text-xs font-medium tabular-nums ' +
              (i < step
                ? 'bg-primary text-primary-foreground border-primary'
                : i === step
                  ? 'border-foreground text-foreground'
                  : 'text-muted-foreground')}
          >
            {#if i < step}
              <Check class="size-3.5" aria-hidden="true" />
            {:else}
              {i + 1}
            {/if}
          </span>
          <span class={i === step ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
          {#if i < steps.length - 1}
            <ArrowRight class="text-muted-foreground size-3.5" aria-hidden="true" />
          {/if}
        </li>
      {/each}
    </ol>

    <Card>
      <CardHeader>
        <CardTitle as="h1" class="text-2xl">
          {#if step === 0}
            Tell us about you
          {:else if step === 1}
            Create your workspace
          {:else}
            Invite your team
          {/if}
        </CardTitle>
        <CardDescription>
          {#if step === 0}
            Helps us tailor the dashboard to your role.
          {:else if step === 1}
            Where all your work will live. You can rename it later.
          {:else}
            Optional. You can invite more people anytime from Settings → Team.
          {/if}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if step === 0}
          <div class="grid gap-2">
            <Label for="onb-name">Full name</Label>
            <Input
              id="onb-name"
              bind:value={fullName}
              placeholder="Ada Lovelace"
            />
          </div>
          <div class="grid gap-2">
            <Label>Your role</Label>
            <Select bind:value={role}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="engineer">
                  Engineering
                </SelectItem>
                <SelectItem value="design">
                  Design
                </SelectItem>
                <SelectItem value="pm">
                  Product
                </SelectItem>
                <SelectItem value="ops">
                  Operations
                </SelectItem>
                <SelectItem value="other">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        {:else if step === 1}
          <div class="grid gap-2">
            <Label for="onb-ws">Workspace name</Label>
            <Input
              id="onb-ws"
              bind:value={workspaceName}
              placeholder="Acme Inc"
            />
          </div>
          <div class="grid gap-2">
            <Label>Team size</Label>
            <Select bind:value={workspaceSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">
                  1–5
                </SelectItem>
                <SelectItem value="6-20">
                  6–20
                </SelectItem>
                <SelectItem value="21-100">
                  21–100
                </SelectItem>
                <SelectItem value="100+">
                  100+
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        {:else}
          <div class="grid gap-2">
            <Label for="onb-invites">Emails (comma-separated)</Label>
            <Input
              id="onb-invites"
              bind:value={invites}
              placeholder="alice@acme.com, bob@acme.com"
            />
            <p class="text-muted-foreground text-xs">
              We’ll send each one an invite link.
            </p>
          </div>
        {/if}
      </CardContent>
    </Card>

    <div class="mt-4 flex items-center justify-between">
      {#if step > 0}
        <Button
          variant="ghost"
          onclick={back}
        >
          Back
        </Button>
      {:else}
        <Button
          variant="ghost"
          onclick={skip}
        >
          Skip setup
        </Button>
      {/if}
      <Button onclick={next}>
        {step === 2 ? 'Finish' : 'Continue'}
      </Button>
    </div>
  </main>
</div>
