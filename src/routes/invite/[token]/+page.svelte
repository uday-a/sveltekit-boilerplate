<script lang="ts">
  import { untrack } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { AlertCircle, Loader2, Mail, Users } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { t } from '$lib/i18n'
  import type { PageData } from './$types'

  // Invite verify/accept page. Port of Nuxt `invite/[token].vue` against the
  // merged GET/POST /api/team/invites/[param] endpoint (token branch is
  // public — the token IS the auth for verification, like the magic link).
  let { data }: { data: PageData } = $props()

  const token = $derived(String(page.params.token ?? ''))

  interface InvitePreview {
    email: string
    role: string
    valid: boolean
  }

  let invite = $state<InvitePreview | null>(null)
  let verifying = $state(true)
  let verifyFailed = $state(false)
  let verifyCode = $state<string | null>(null)

  async function verify() {
    if (!token) {
      verifying = false
      verifyFailed = true
      return
    }
    verifying = true
    verifyFailed = false
    const res: ApiResponse<InvitePreview> = await apiFetch(`/api/team/invites/${token}`)
    if (res.ok) {
      invite = res.data
    }
    else {
      invite = null
      verifyFailed = true
      verifyCode = res.error.code
    }
    verifying = false
  }

  $effect(() => {
    untrack(() => void verify())
  })

  // A 401 means the link may be fine but the recipient isn't signed in —
  // send them to sign in rather than calling a valid invite "invalid".
  const needsSignin = $derived(
    verifyCode === 'UNAUTHORIZED' || verifyCode === 'SESSION_INVALID',
  )
  const signinHref = $derived(`/login?next=${encodeURIComponent(`/invite/${token}`)}`)

  const emailMismatch = $derived(
    Boolean(invite && data.user && (data.user.email ?? '').toLowerCase() !== invite.email.toLowerCase()),
  )

  let accepting = $state(false)
  let acceptError = $state<string | null>(null)

  async function accept() {
    if (!data.user) {
      await goto(signinHref)
      return
    }
    accepting = true
    acceptError = null
    const res: ApiResponse<{ accepted: boolean }> = await apiFetch(`/api/team/invites/${token}`, {
      method: 'POST',
    })

    if (!res.ok) {
      acceptError = res.error.message
      accepting = false
      return
    }
    await goto('/dashboard')
  }

  function decline() {
    void goto('/')
  }
</script>

<svelte:head>
  <title>{$t('invite.joinTitle')} | UIPKGE</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
  <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-4">
    {#if verifying}
      <div class="text-muted-foreground flex items-center justify-center gap-2 text-sm">
        <Loader2 class="size-4 animate-spin" aria-hidden="true" />
        {$t('invite.loading')}
      </div>
    {:else if invite && !verifyFailed}
      <Card>
        <CardHeader class="items-center text-center">
          <CardTitle as="h1" class="pt-3 text-2xl">{$t('invite.joinTitle')}</CardTitle>
          <CardDescription>{$t('invite.description', { role: invite.role })}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Mail class="size-4" aria-hidden="true" />
            <span>{$t('invite.invitedEmail')}: <span class="text-foreground">{invite.email}</span></span>
          </div>
          <div class="text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Users class="size-4" aria-hidden="true" />
            <span>{$t('invite.roleLabel')}: <span class="text-foreground">{invite.role}</span></span>
          </div>
          {#if emailMismatch}
            <div class="text-muted-foreground text-center text-xs">
              {$t('invite.needSignin', { email: invite.email })}
            </div>
          {/if}
          {#if acceptError}
            <div class="text-destructive flex items-center gap-2 text-sm">
              <AlertCircle class="size-4" aria-hidden="true" />
              {acceptError}
            </div>
          {/if}
          <div class="flex flex-col gap-2 pt-2">
            <Button
              class="w-full"
              disabled={accepting}
              onclick={accept}
            >
              {#if accepting}
                <Loader2 class="size-4 animate-spin" />
              {/if}
              {accepting ? $t('invite.accepting') : data.user && !emailMismatch ? $t('invite.accept') : $t('invite.signinCta')}
            </Button>
            <Button variant="ghost" class="w-full" onclick={decline}>
              {$t('invite.decline')}
            </Button>
          </div>
        </CardContent>
      </Card>
    {:else if needsSignin}
      <Card>
        <CardHeader class="items-center text-center">
          <CardTitle as="h1" class="pt-3 text-2xl">{$t('invite.signinTitle')}</CardTitle>
          <CardDescription>{$t('invite.signinDescription')}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-2">
          <Button class="w-full">
            {#snippet child({ props })}
              <a href={signinHref} {...props}>{$t('invite.signinCta')}</a>
            {/snippet}
          </Button>
          <Button variant="ghost" class="w-full" onclick={decline}>
            {$t('invite.backHome')}
          </Button>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardHeader class="items-center text-center">
          <CardTitle as="h1" class="pt-3 text-2xl">{$t('invite.invalidTitle')}</CardTitle>
          <CardDescription>{$t('invite.invalidDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" class="w-full" onclick={decline}>
            {$t('invite.backHome')}
          </Button>
        </CardContent>
      </Card>
    {/if}
  </main>
</div>
