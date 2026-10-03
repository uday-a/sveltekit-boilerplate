<script lang="ts">
  import { onMount } from 'svelte'
  import { Loader2 } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '$lib/components/ui/select'
  import { Separator } from '$lib/components/ui/separator'
  import { Switch } from '$lib/components/ui/switch'
  import { FormStatus } from '$lib/components/ui/form'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { apiFetch, type ApiResponse } from '$lib/api'

  interface Profile {
    name: string | null
    bio: string | null
    timezone: string
    locale: string
    notifyEmail: boolean
    notifyInApp: boolean
  }

  // Timezone + locale are user-scoped (live on `users` table) and persist
  // via /api/me/profile. The workspace-level fields below (name, slug,
  // brand color, SSO requirements) need a `workspaces` table; until you
  // add one they're visual-only — kept in this page so the form shows
  // the full settings UX, but Save only ships the user-scoped fields.
  let timezone = $state('UTC')
  let locale = $state('en')

  async function loadProfile() {
    const res: ApiResponse<{ profile: Profile }> = await apiFetch('/api/me/profile')
    if (res.ok) {
      timezone = res.data.profile.timezone
      locale = res.data.profile.locale
    }
  }

  onMount(() => {
    void loadProfile()
  })

  // Workspace-level state. UI shells until you add a workspaces table.
  let workspaceName = $state('Acme Inc')
  let workspaceUrl = $state('acme-inc')
  let supportEmail = $state('support@acme.com')
  let brandColor = $state('#5B6FE6')
  let allowExternalShares = $state(true)
  let requireSso = $state(false)
  let sendWeeklyDigest = $state(true)

  type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved', demo?: boolean } | { kind: 'error', message: string }
  let status = $state<Status>({ kind: 'idle' })

  async function save() {
    status = { kind: 'saving' }
    const res: ApiResponse<{ profile: Profile, demo?: boolean }> = await apiFetch('/api/me/profile', {
      method: 'PUT',
      body: JSON.stringify({ timezone, locale }),
    })
    if (!res.ok) {
      status = { kind: 'error', message: res.error.message }
      return
    }
    status = { kind: 'saved', demo: res.data.demo }
    await loadProfile()
  }
</script>

<svelte:head>
  <title>General · Settings | UIPKGE</title>
</svelte:head>

<Page class="max-w-3xl">
  <PageHeader>
    <PageHeaderHeading title="General" description="Workspace identity, locale, and default behaviour." />
  </PageHeader>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Workspace</CardTitle>
      <CardDescription>Visible to every member.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid gap-2">
        <Label for="ws-name">Workspace name</Label>
        <Input id="ws-name" bind:value={workspaceName} />
      </div>
      <div class="grid gap-2">
        <Label for="ws-url">URL slug</Label>
        <div class="flex">
          <span class="bg-muted text-muted-foreground inline-flex items-center rounded-l-md border border-r-0 px-3 text-sm"
            >app.acme.com/</span
          >
          <Input id="ws-url" bind:value={workspaceUrl} class="rounded-l-none" />
        </div>
        <p class="text-muted-foreground text-xs">Renaming the slug breaks existing share links. Old links 404; we don't redirect.</p>
      </div>
      <div class="grid gap-2">
        <Label for="ws-email">Support email</Label>
        <Input id="ws-email" bind:value={supportEmail} type="email" />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Localization</CardTitle>
      <CardDescription>Affects date/time formatting and AI response defaults.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid gap-2">
        <Label>Timezone</Label>
        <Select bind:value={timezone}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/Los_Angeles">America/Los_Angeles · UTC-8</SelectItem>
            <SelectItem value="America/New_York">America/New_York · UTC-5</SelectItem>
            <SelectItem value="Europe/London">Europe/London · UTC+0</SelectItem>
            <SelectItem value="Europe/Berlin">Europe/Berlin · UTC+1</SelectItem>
            <SelectItem value="Asia/Singapore">Asia/Singapore · UTC+8</SelectItem>
            <SelectItem value="Asia/Tokyo">Asia/Tokyo · UTC+9</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-2">
        <Label>Locale</Label>
        <Select bind:value={locale}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
          </SelectContent>
        </Select>
        <p class="text-muted-foreground text-xs">
          Add more options in <code>i18n/locales/</code> + the <code>i18n</code> module config.
        </p>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Branding</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid gap-2">
        <Label>Primary brand colour</Label>
        <div class="flex items-center gap-3">
          <input bind:value={brandColor} type="color" class="size-10 cursor-pointer rounded-md border" />
          <Input bind:value={brandColor} class="font-mono text-sm w-32" />
        </div>
        <p class="text-muted-foreground text-xs">Used on shared report headers, exported PDFs, and the public-facing share page.</p>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle class="text-base">Defaults</CardTitle>
    </CardHeader>
    <CardContent class="space-y-1">
      <div class="flex items-start justify-between gap-4 py-3">
        <div class="space-y-0.5">
          <Label for="allow-external-shares" class="text-sm font-medium">Allow external shares</Label>
          <p class="text-muted-foreground text-xs">
            Members can generate public read-only share links. Disabled by default at the Enterprise tier.
          </p>
        </div>
        <Switch id="allow-external-shares" bind:checked={allowExternalShares} />
      </div>
      <Separator />
      <div class="flex items-start justify-between gap-4 py-3">
        <div class="space-y-0.5">
          <Label for="require-sso" class="text-sm font-medium">Require SSO</Label>
          <p class="text-muted-foreground text-xs">
            All members must authenticate via your SAML or OIDC provider. Email/password is blocked.
          </p>
        </div>
        <Switch id="require-sso" bind:checked={requireSso} />
      </div>
      <Separator />
      <div class="flex items-start justify-between gap-4 py-3">
        <div class="space-y-0.5">
          <Label for="send-weekly-digest" class="text-sm font-medium">Send weekly digest</Label>
          <p class="text-muted-foreground text-xs">
            Mondays at 9am workspace time. Usage, top prompts, and any rate-limit hits from the prior week.
          </p>
        </div>
        <Switch id="send-weekly-digest" bind:checked={sendWeeklyDigest} />
      </div>
    </CardContent>
  </Card>

  <div class="flex items-center justify-end gap-3">
    {#if status.kind === 'saved'}
      <FormStatus status="success" message={status.demo ? 'Saved (demo — not persisted)' : 'Saved'} />
    {:else if status.kind === 'error'}
      <FormStatus status="error" message={status.message} />
    {/if}
    <Button variant="outline">Cancel</Button>
    <Button disabled={status.kind === 'saving'} onclick={save}>
      {#if status.kind === 'saving'}
        <Loader2 class="size-4 animate-spin" />
      {/if}
      Save changes
    </Button>
  </div>
</Page>
