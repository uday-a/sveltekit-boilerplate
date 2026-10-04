<script lang="ts">
  import { ArrowLeft, MailCheck } from '@lucide/svelte'
  import { Button, buttonVariants } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { t } from '$lib/i18n'

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

<div data-slot="auth-password-reset" class="bg-background flex min-h-svh items-center justify-center p-4">
  <h1 class="sr-only">{$t('auth.passwordReset.srTitle')}</h1>
  <Card class="w-full max-w-sm">
    {#if stage === 'request'}
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">{$t('auth.passwordReset.request.title')}</CardTitle>
        <CardDescription>{$t('auth.passwordReset.request.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="post" class="space-y-4" onsubmit={submitRequest}>
          <div class="grid gap-2">
            <Label for="reset-email">{$t('auth.passwordReset.request.emailLabel')}</Label>
            <Input
              id="reset-email"
              bind:value={email}
              name="email"
              type="email"
              placeholder={$t('auth.passwordReset.request.emailPlaceholder')}
              autocomplete="email"
              required
            />
          </div>
          <Button type="submit" class="w-full">{$t('auth.passwordReset.request.submit')}</Button>
        </form>
      </CardContent>
      <CardFooter class="justify-center">
        <a
          href={signInHref}
          class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft class="size-4" aria-hidden="true" />{$t('auth.passwordReset.request.back')}
        </a>
      </CardFooter>
    {:else if stage === 'sent'}
      <CardContent class="space-y-4 pt-4 text-center">
        <div class="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <MailCheck class="size-6" aria-hidden="true" />
        </div>
        <div class="space-y-1">
          <h3 class="text-2xl font-semibold tracking-tight">{$t('auth.passwordReset.sent.title')}</h3>
          <p class="text-muted-foreground text-sm">
            {$t('auth.passwordReset.sent.descriptionPrefix')} <span class="text-foreground font-medium">{email}</span>{$t('auth.passwordReset.sent.descriptionSuffix')}
          </p>
        </div>
        <Button variant="outline" class="w-full" onclick={() => (stage = 'reset')}>
          {$t('auth.passwordReset.sent.openDemo')}
        </Button>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          onclick={() => (stage = 'request')}
        >
          {$t('auth.passwordReset.sent.wrongEmail')}
        </button>
      </CardContent>
    {:else if stage === 'reset'}
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">{$t('auth.passwordReset.reset.title')}</CardTitle>
        <CardDescription>{$t('auth.passwordReset.reset.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="post" class="space-y-4" onsubmit={submitReset}>
          <div class="grid gap-2">
            <Label for="reset-pw">{$t('auth.passwordReset.reset.passwordLabel')}</Label>
            <Input id="reset-pw" bind:value={password} type="password" autocomplete="new-password" required />
          </div>
          <div class="grid gap-2">
            <Label for="reset-confirm">{$t('auth.passwordReset.reset.confirmLabel')}</Label>
            <Input
              id="reset-confirm"
              bind:value={confirm}
              type="password"
              autocomplete="new-password"
              aria-invalid={!passwordsMatch}
              required
            />
            {#if !passwordsMatch}
              <p class="text-destructive text-xs">{$t('auth.passwordReset.reset.passwordsMismatch')}</p>
            {/if}
          </div>
          <Button type="submit" class="w-full">{$t('auth.passwordReset.reset.submit')}</Button>
        </form>
      </CardContent>
    {:else}
      <CardContent class="space-y-4 pt-4 text-center">
        <div class="bg-success/10 text-success mx-auto flex size-12 items-center justify-center rounded-full">
          <MailCheck class="size-6" aria-hidden="true" />
        </div>
        <div class="space-y-1">
          <h3 class="text-2xl font-semibold tracking-tight">{$t('auth.passwordReset.done.title')}</h3>
          <p class="text-muted-foreground text-sm">{$t('auth.passwordReset.done.description')}</p>
        </div>
        <a href={signInHref} class={buttonVariants({ class: 'w-full' })}>{$t('auth.passwordReset.done.submit')}</a>
      </CardContent>
    {/if}
  </Card>
</div>
