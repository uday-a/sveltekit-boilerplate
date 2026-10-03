<script lang="ts" module>
  export type OauthProvider = 'github' | 'google'

  export interface AuthSignUpProps {
    title?: string
    description?: string
    signInHref?: string
    termsHref?: string
    privacyHref?: string
    oauthProviders?: OauthProvider[]
    /** Called with the validated payload when the form submits. Wire your auth call here. */
    onSubmit?: (payload: { name: string; email: string; password: string }) => void
    /** Called with the chosen provider when an OAuth button is clicked. */
    onOauth?: (provider: OauthProvider) => void
  }
</script>

<script lang="ts">
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Button } from '$lib/components/ui/button'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Separator } from '$lib/components/ui/separator'

  let {
    title = 'Create your account',
    description = 'Start your 14-day free trial. No credit card required.',
    signInHref = '/login',
    termsHref = '#',
    privacyHref = '#',
    oauthProviders = ['github', 'google'],
    onSubmit,
    onOauth,
  }: AuthSignUpProps = $props()

  let name = $state('')
  let email = $state('')
  let password = $state('')
  let confirm = $state('')
  let accept = $state(false)

  const passwordsMatch = $derived(!confirm || password === confirm)
  const canSubmit = $derived(Boolean(name && email && password && passwordsMatch && accept))

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({ name, email, password })
  }
</script>

<div data-slot="auth-sign-up" class="bg-background flex min-h-svh items-center justify-center p-6">
  <Card class="w-full max-w-md">
    <CardHeader class="text-center">
      <CardTitle as="h1" class="text-2xl">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" onsubmit={handleSubmit}>
        <div class="grid gap-2">
          <Label for="signup-name">Full name</Label>
          <Input id="signup-name" bind:value={name} autocomplete="name" required />
        </div>
        <div class="grid gap-2">
          <Label for="signup-email">Email</Label>
          <Input
            id="signup-email"
            bind:value={email}
            type="email"
            placeholder="you@company.com"
            autocomplete="email"
            required
          />
        </div>
        <div class="grid gap-2">
          <Label for="signup-password">Password</Label>
          <Input id="signup-password" bind:value={password} type="password" autocomplete="new-password" required />
          <p class="text-muted-foreground text-xs">8+ characters, mix of letters, numbers and symbols.</p>
        </div>
        <div class="grid gap-2">
          <Label for="signup-confirm">Confirm password</Label>
          <Input
            id="signup-confirm"
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
        <div class="flex items-start gap-2">
          <Checkbox id="signup-accept" bind:checked={accept} />
          <Label for="signup-accept" class="font-normal">
            I agree to the
            <a href={termsHref} class="text-foreground underline-offset-4 hover:underline">Terms of Service</a>
            and
            <a href={privacyHref} class="text-foreground underline-offset-4 hover:underline">Privacy Policy</a>.
          </Label>
        </div>
        <Button type="submit" class="w-full" disabled={!canSubmit}>Create account</Button>
      </form>

      {#if oauthProviders.length > 0}
        <div class="my-6 flex items-center gap-3">
          <Separator class="flex-1" />
          <span class="text-muted-foreground text-xs uppercase">or continue with</span>
          <Separator class="flex-1" />
        </div>
        <div class="grid gap-2" class:sm:grid-cols-2={oauthProviders.length > 1}>
          {#if oauthProviders.includes('github')}
            <Button variant="outline" type="button" onclick={() => onOauth?.('github')}>
              <svg class="mr-2 size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0C17 4.7 18 5 18 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
                />
              </svg>GitHub
            </Button>
          {/if}
          {#if oauthProviders.includes('google')}
            <Button variant="outline" type="button" onclick={() => onOauth?.('google')}>
              <svg class="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"
                />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                />
              </svg>Google
            </Button>
          {/if}
        </div>
      {/if}
    </CardContent>
    <CardFooter class="justify-center">
      <p class="text-muted-foreground text-sm">
        Already have an account?
        <a href={signInHref} class="text-foreground font-medium underline-offset-4 hover:underline">Sign in</a>
      </p>
    </CardFooter>
  </Card>
</div>
