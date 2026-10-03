<script lang="ts">
  import { ArrowLeft, MailCheck } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'

  interface Props {
    signInHref?: string
    /** Fired with the email when the reset link is requested. Wire your mail call here. */
    onRequest?: (email: string) => void
    /** Fired with the new password when it is set. Wire your db call here. */
    onReset?: (password: string) => void
  }

  let { signInHref = '/login', onRequest, onReset }: Props = $props()

  type Stage = 'request' | 'sent' | 'reset' | 'done'
  let stage: Stage = $state('request')

  let email = $state('')
  let password = $state('')
  let confirm = $state('')
  const passwordsMatch = $derived(!confirm || password === confirm)

  function submitRequest(e: SubmitEvent) {
    e.preventDefault()
    if (!email) return
    onRequest?.(email)
    stage = 'sent'
  }

  function submitReset(e: SubmitEvent) {
    e.preventDefault()
    if (!password || !passwordsMatch) return
    onReset?.(password)
    stage = 'done'
  }
</script>

<div data-slot="auth-password-reset" class="bg-background flex min-h-svh items-center justify-center p-6">
  <Card class="w-full max-w-sm">
    {#if stage === 'request'}
      <CardHeader class="text-center">
        <CardTitle as="h1" class="text-2xl">Forgot password?</CardTitle>
        <CardDescription>Enter your email and we'll send you a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" onsubmit={submitRequest}>
          <div class="grid gap-2">
            <Label for="reset-email">Email</Label>
            <Input id="reset-email" bind:value={email} type="email" placeholder="you@company.com" required />
          </div>
          <Button type="submit" class="w-full">Send reset link</Button>
        </form>
      </CardContent>
      <CardFooter class="justify-center">
        <a
          href={signInHref}
          class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft class="size-3" />Back to sign in
        </a>
      </CardFooter>
    {:else if stage === 'sent'}
      <CardContent class="space-y-4 pt-6 text-center">
        <div class="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <MailCheck class="size-6" />
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">Check your inbox</h3>
          <p class="text-muted-foreground text-sm">
            We've sent a reset link to <span class="text-foreground font-medium">{email}</span>.
          </p>
        </div>
        <Button variant="outline" class="w-full" onclick={() => (stage = 'reset')}>Open reset form (demo)</Button>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          onclick={() => (stage = 'request')}
        >
          Wrong email?
        </button>
      </CardContent>
    {:else if stage === 'reset'}
      <CardHeader class="text-center">
        <CardTitle as="h1" class="text-2xl">Set new password</CardTitle>
        <CardDescription>Pick a strong password you haven't used before.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" onsubmit={submitReset}>
          <div class="grid gap-2">
            <Label for="reset-pw">New password</Label>
            <Input id="reset-pw" bind:value={password} type="password" autocomplete="new-password" required />
          </div>
          <div class="grid gap-2">
            <Label for="reset-confirm">Confirm password</Label>
            <Input
              id="reset-confirm"
              bind:value={confirm}
              type="password"
              autocomplete="new-password"
              aria-invalid={!passwordsMatch}
              required
            />
            {#if !passwordsMatch}
              <p class="text-destructive text-xs">Passwords don't match.</p>
            {/if}
          </div>
          <Button type="submit" class="w-full">Reset password</Button>
        </form>
      </CardContent>
    {:else}
      <CardContent class="space-y-4 pt-6 text-center">
        <div class="bg-success/10 text-success mx-auto flex size-12 items-center justify-center rounded-full">
          <MailCheck class="size-6" />
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">All set</h3>
          <p class="text-muted-foreground text-sm">
            Your password has been updated. You can now sign in with the new password.
          </p>
        </div>
        <a href={signInHref}><Button class="w-full">Continue to sign in</Button></a>
      </CardContent>
    {/if}
  </Card>
</div>
