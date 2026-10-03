<script lang="ts">
  import { Key, Laptop, Smartphone, Trash2 } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Label } from '$lib/components/ui/label'
  import { Separator } from '$lib/components/ui/separator'
  import { Switch } from '$lib/components/ui/switch'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'

  let mfaEnabled = $state(false)

  const sessions = [
    { id: '1', device: 'MacBook Pro', browser: 'Chrome 130 · macOS 15', location: 'New York, US', current: true, lastActive: 'Active now' },
    { id: '2', device: 'iPhone 15', browser: 'Safari · iOS 18', location: 'New York, US', current: false, lastActive: '2 hours ago' },
  ]

  const tokens = [
    { id: 't1', name: 'CLI · uday-laptop', scopes: ['read', 'write'], created: '2026-03-12', lastUsed: '2026-05-16' },
  ]
</script>

<svelte:head>
  <title>Security · Settings | UIPKGE</title>
</svelte:head>

<Page class="max-w-3xl">
  <PageHeader>
    <PageHeaderHeading title="Security" description="Sessions, two-factor auth, and API tokens." />
  </PageHeader>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Two-factor authentication</CardTitle>
      <CardDescription>Require a code from your authenticator app on every sign-in.</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-0.5">
          <Label for="mfa-toggle" class="text-sm font-medium">Authenticator app (TOTP)</Label>
          <p class="text-muted-foreground text-xs">Compatible with 1Password, Authy, Google Authenticator.</p>
        </div>
        <Switch id="mfa-toggle" bind:checked={mfaEnabled} />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Active sessions</CardTitle>
      <CardDescription>Devices currently signed in to your account.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      {#each sessions as s, i (s.id)}
        {@const DeviceIcon = s.device.includes('iPhone') ? Smartphone : Laptop}
        <div>
          <div class="flex items-start justify-between gap-4 py-2">
            <div class="flex items-start gap-3">
              <DeviceIcon class="text-muted-foreground size-4 mt-0.5" />
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium">{s.device}</p>
                  {#if s.current}
                    <Badge variant="secondary">This device</Badge>
                  {/if}
                </div>
                <p class="text-muted-foreground text-xs">{s.browser} · {s.location}</p>
                <p class="text-muted-foreground text-xs">{s.lastActive}</p>
              </div>
            </div>
            {#if !s.current}
              <Button variant="ghost" size="sm">Revoke</Button>
            {/if}
          </div>
          {#if i < sessions.length - 1}
            <Separator />
          {/if}
        </div>
      {/each}
      <div class="pt-2">
        <Button variant="outline" size="sm">Sign out all other sessions</Button>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">API tokens</CardTitle>
      <CardDescription>Personal access tokens for CLI and API use.</CardDescription>
      <CardAction>
        <Button size="sm">
          <Key class="size-4" />
          Create token
        </Button>
      </CardAction>
    </CardHeader>
    <CardContent class="space-y-3">
      {#if !tokens.length}
        <div class="text-muted-foreground text-sm">No tokens yet.</div>
      {/if}
      {#each tokens as t (t.id)}
        <div class="flex items-start justify-between gap-4 py-2">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium">{t.name}</p>
              {#each t.scopes as scope (scope)}
                <Badge variant="secondary">{scope}</Badge>
              {/each}
            </div>
            <p class="text-muted-foreground text-xs">Created {t.created} · last used {t.lastUsed}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Revoke token">
            <Trash2 class="text-destructive size-4" />
          </Button>
        </div>
      {/each}
    </CardContent>
  </Card>
</Page>
