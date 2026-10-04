<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/state'
  import { AlertCircle, Mail, Sparkles } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import AuthSignIn, {
    type OAuthProvider,
    type SignInPayload,
  } from '$lib/components/blocks/auth-sign-in/AuthSignIn.svelte'
  import { safeRedirectPath } from '$lib/utils'
  import type { ApiResponse } from '$lib/server/response'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const next = $derived(safeRedirectPath(page.url.searchParams.get('next')))

  // Show an explanatory error banner when the magic-link verify endpoint
  // bounces a bad/expired/used token. Map the short ?error= code from the
  // /auth/magic-link redirect to user-facing copy (same map as nuxt).
  const errorBanner = $derived.by(() => {
    switch (page.url.searchParams.get('error')) {
      case 'magic-link-expired': return 'That sign-in link expired. Request a fresh one below.'
      case 'magic-link-used': return 'That sign-in link was already used. Request a fresh one below.'
      case 'magic-link-invalid': return 'That sign-in link is invalid. Request a fresh one below.'
      case 'magic-link-missing-token': return 'Sign-in link was missing a token. Request a fresh one below.'
      case 'magic-link-db-required': return 'Magic-link sign-in needs a DATABASE_URL configured. Use GitHub instead.'
      case 'magic-link-failed': return 'Sign-in failed. Try again or use GitHub.'
      case 'oauth': return 'GitHub sign-in failed. Try again.'
      default: return null
    }
  })

  let demoLoading = $state(false)

  async function signInAsDemo() {
    demoLoading = true
    try {
      const res = await fetch('/auth/demo', { method: 'POST' })
      if (!res.ok) throw new Error(`Demo sign-in failed (${res.status})`)
      await invalidateAll()
      await goto(next)
    }
    catch (err) {
      console.error('DEMO_SIGNIN_ERROR', err)
    }
    finally {
      demoLoading = false
    }
  }

  // Magic-link request triggered by the AuthSignIn form's submit.
  // We hijack the email field and ignore the password — magic-link IS the
  // auth, no password needed. The block's password field becomes vestigial
  // when GitHub OAuth + magic-link are the only configured paths.
  type LinkState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent', email: string } | { kind: 'error', message: string }
  let linkState = $state<LinkState>({ kind: 'idle' })

  async function onSubmit(payload: SignInPayload) {
    linkState = { kind: 'sending' }
    let res: ApiResponse<{ expiresInMin: number }>
    try {
      const r = await fetch('/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email }),
      })
      res = (await r.json()) as ApiResponse<{ expiresInMin: number }>
    }
    catch {
      res = { ok: false, error: { code: 'INTERNAL', message: 'Failed to send link' } }
    }

    if (!res.ok) {
      linkState = { kind: 'error', message: res.error.message }
      return
    }
    linkState = { kind: 'sent', email: payload.email }
  }

  function onOAuth(provider: OAuthProvider) {
    if (provider !== 'github') {
      alert('Only GitHub OAuth is wired right now.')
      return
    }
    // Hard navigation so the browser follows the OAuth redirect to GitHub.
    window.location.href = `/auth/github?next=${encodeURIComponent(next)}`
  }
</script>

<svelte:head>
  <title>Sign in | UIPKGE</title>
</svelte:head>

<div class="bg-background relative flex min-h-svh items-center justify-center p-4 md:p-4">
  <div class="w-full max-w-sm">
    <AuthSignIn
      forgotPasswordHref="/forgot-password"
      signUpHref="/sign-up"
      oauthProviders={['github']}
      {onSubmit}
      {onOAuth}
    />

    <!-- Top toast overlays — error banner on bad magic link, confirmation on send -->
    {#if errorBanner}
      <div class="fixed top-6 right-6 z-50 max-w-sm">
        <div class="bg-popover text-destructive border-destructive/30 flex items-center gap-2 rounded-lg border p-4 text-sm shadow-lg">
          <AlertCircle class="size-4 shrink-0" aria-hidden="true" />
          <span>{errorBanner}</span>
        </div>
      </div>
    {/if}

    {#if linkState.kind === 'sent'}
      <div class="fixed top-6 right-6 z-50 max-w-sm">
        <div class="bg-popover text-popover-foreground flex items-center gap-2 rounded-lg border p-4 text-sm shadow-lg">
          <Mail class="size-4 shrink-0" aria-hidden="true" />
          <span>Sign-in link sent to <strong class="font-semibold">{linkState.email}</strong>. Check your inbox.</span>
        </div>
      </div>
    {/if}

    {#if linkState.kind === 'error'}
      <div class="fixed top-6 right-6 z-50 max-w-sm">
        <div class="bg-popover text-destructive border-destructive/30 flex items-center gap-2 rounded-lg border p-4 text-sm shadow-lg">
          <AlertCircle class="size-4 shrink-0" aria-hidden="true" />
          <span>{linkState.message}</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Floating demo affordance — only shown when demo mode is on.
       Positioned outside the auth card so it doesn't fight with the
       form's layout, and explicit about being a demo (not a real path). -->
  {#if data.demoMode}
    <div class="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div class="bg-background/95 flex items-center gap-3 rounded-full border px-4 py-2 shadow-lg backdrop-blur">
        <Sparkles class="text-primary size-4" aria-hidden="true" />
        <span class="text-muted-foreground text-sm">
          Just looking around? Try the demo workspace.
        </span>
        <Button
          size="sm"
          disabled={demoLoading}
          onclick={signInAsDemo}
        >
          {demoLoading ? 'Signing in…' : 'Continue as demo user'}
        </Button>
      </div>
    </div>
  {/if}
</div>
