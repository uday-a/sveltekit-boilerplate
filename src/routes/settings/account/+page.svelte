<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { AlertCircle, CheckCircle2, Loader2 } from '@lucide/svelte'
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Separator } from '$lib/components/ui/separator'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { page } from '$app/state'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'
  import { apiFetch, type ApiResponse } from '$lib/api'

  const title = $derived(routeLabel(page.url.pathname, $t))

  let { data }: { data: App.PageData } = $props()
  const user = $derived(data.user ?? null)

  interface Profile {
    name: string | null
    bio: string | null
    timezone: string
    locale: string
    notifyEmail: boolean
    notifyInApp: boolean
  }

  // Initialize from server, keep email read-only (changing it requires the
  // reverification flow which lives in the magic-link branch, not here).
  // Seeded from the session so the avatar initials render on first paint;
  // the profile fetch below replaces it with the stored name.
  let name = $state(untrack(() => data.user?.name ?? ''))
  let bio = $state('')
  // Read-only email comes from the session (root layout data). Derived, not
  // $state+$effect: the field is disabled so it can never be edited and a
  // one-way `value` stays in sync even if session data arrives late.
  const email = $derived(user?.email ?? '')
  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmPassword = $state('')

  async function loadProfile() {
    const res: ApiResponse<{ profile: Profile }> = await apiFetch('/api/me/profile')
    if (res.ok) {
      name = res.data.profile.name ?? ''
      bio = res.data.profile.bio ?? ''
    }
  }

  onMount(() => {
    void loadProfile()
  })

  const initials = $derived(
    (name || 'U')
      .split(' ')
      .map(s => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  )

  type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved', demo?: boolean } | { kind: 'error', message: string }
  let status = $state<Status>({ kind: 'idle' })

  async function save() {
    status = { kind: 'saving' }
    const res: ApiResponse<{ profile: Profile, demo?: boolean }> = await apiFetch('/api/me/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, bio: bio || null }),
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
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description="Your personal profile and credentials." />
  </PageHeader>

  <PageBody class="max-w-3xl space-y-4">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Profile</CardTitle>
        <CardDescription>How you appear in the workspace.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center gap-4">
          <Avatar class="size-16">
            {#if user?.avatar}
              <AvatarImage src={user.avatar} alt={name} />
            {/if}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div class="space-y-1">
            <Button variant="outline" size="sm">Upload photo</Button>
            <p class="text-muted-foreground text-xs">PNG or JPG, up to 2MB.</p>
          </div>
        </div>
        <div class="grid gap-2">
          <Label for="acct-name">Full name</Label>
          <Input id="acct-name" bind:value={name} />
        </div>
        <div class="grid gap-2">
          <Label for="acct-bio">Bio</Label>
          <Textarea id="acct-bio" bind:value={bio} rows={3} placeholder="A short paragraph about yourself." />
          <p class="text-muted-foreground text-xs">500 characters max. Visible to workspace members.</p>
        </div>
        <div class="grid gap-2">
          <Label for="acct-email">Email</Label>
          <Input id="acct-email" value={email} type="email" disabled />
          <p class="text-muted-foreground text-xs">
            Your email comes from your sign-in provider. Change it there to update it here.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Password</CardTitle>
        <CardDescription>Use 12+ characters with a mix of letters, numbers, and symbols.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-2">
          <Label for="pw-current">Current password</Label>
          <Input id="pw-current" bind:value={currentPassword} type="password" />
        </div>
        <div class="grid gap-2">
          <Label for="pw-new">New password</Label>
          <Input id="pw-new" bind:value={newPassword} type="password" />
        </div>
        <div class="grid gap-2">
          <Label for="pw-confirm">Confirm new password</Label>
          <Input id="pw-confirm" bind:value={confirmPassword} type="password" />
        </div>
      </CardContent>
    </Card>

    <div class="flex items-center justify-end gap-2">
      {#if status.kind === 'saved'}
        <div class="text-success flex items-center gap-2 text-sm">
          <CheckCircle2 class="size-4" />
          {status.demo ? 'Saved (demo — not persisted)' : 'Saved'}
        </div>
      {:else if status.kind === 'error'}
        <div class="text-destructive flex items-center gap-2 text-sm">
          <AlertCircle class="size-4" />
          {status.message}
        </div>
      {/if}
      <Button variant="outline">Cancel</Button>
      <Button disabled={status.kind === 'saving' || !name} onclick={save}>
        {#if status.kind === 'saving'}
          <Loader2 class="size-4 animate-spin" />
        {/if}
        Save changes
      </Button>
    </div>

    <Card class="border-destructive/40">
      <CardHeader>
        <CardTitle class="text-base text-destructive">Danger zone</CardTitle>
        <CardDescription>Irreversible account actions.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-0.5">
            <p class="text-sm font-medium">Delete account</p>
            <p class="text-muted-foreground text-xs">
              Permanently remove your account and all personal data. Workspace data is retained per your billing plan.
            </p>
          </div>
          <Button variant="destructive">Delete account</Button>
        </div>
        <Separator />
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-0.5">
            <p class="text-sm font-medium">Export data</p>
            <p class="text-muted-foreground text-xs">Download a JSON archive of your personal data.</p>
          </div>
          <Button variant="outline">Request export</Button>
        </div>
      </CardContent>
    </Card>
  </PageBody>
</Page>
