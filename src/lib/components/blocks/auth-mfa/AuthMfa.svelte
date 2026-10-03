<script lang="ts" module>
  export interface AuthMfaProps {
    title?: string
    description?: string
    continueHref?: string
    recoveryHref?: string
    /** Value the built-in mock validator accepts. */
    demoCode?: string
    onVerify?: (code: string) => void
    onResend?: () => void
    onContinue?: () => void
  }
</script>

<script lang="ts">
  import { ShieldCheck, RotateCw } from '@lucide/svelte'
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { PinInput, PinInputGroup, PinInputSlot } from '$lib/components/ui/pin-input'

  let {
    title = 'Two-step verification',
    description = 'Enter the 6-digit code from your authenticator app.',
    continueHref = '/',
    recoveryHref = '#',
    demoCode = '123456',
    onVerify,
    onResend,
    onContinue,
  }: AuthMfaProps = $props()

  let code = $state<string[]>([])
  let verifying = $state(false)
  let verified = $state(false)
  let error = $state('')
  let resendIn = $state(0)

  $effect(() => {
    const val = code.join('')
    if (val.length === 6 && !verifying && !verified) {
      error = ''
      verifying = true
      onVerify?.(val)
      setTimeout(() => {
        verifying = false
        if (val === demoCode) verified = true
        else {
          error = `Invalid code. Try ${demoCode} for the demo.`
          code = []
        }
      }, 700)
    }
  })

  function startResendCooldown() {
    resendIn = 30
    onResend?.()
    const t = setInterval(() => {
      resendIn -= 1
      if (resendIn <= 0) clearInterval(t)
    }, 1000)
  }
</script>

<div data-slot="auth-mfa" class="bg-background flex min-h-svh items-center justify-center p-6">
  <Card class="w-full max-w-sm">
    {#if !verified}
      <CardHeader class="text-center">
        <div class="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
          <ShieldCheck class="size-6" />
        </div>
        <CardTitle as="h1" class="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex justify-center">
          <PinInput bind:value={code} otp disabled={verifying}>
            <PinInputGroup>
              {#each Array.from({ length: 6 }, (_, i) => i) as i (i)}
                <PinInputSlot index={i} />
              {/each}
            </PinInputGroup>
          </PinInput>
        </div>
        {#if verifying}
          <p class="text-muted-foreground text-center text-sm">Verifying…</p>
        {/if}
        {#if error}
          <p class="text-destructive text-center text-sm">{error}</p>
        {/if}
        <div class="text-center">
          {#if resendIn === 0}
            <button
              type="button"
              class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
              onclick={startResendCooldown}
            >
              <RotateCw class="size-3" />Resend code
            </button>
          {:else}
            <p class="text-muted-foreground text-xs">Resend available in {resendIn}s</p>
          {/if}
        </div>
      </CardContent>
      <CardFooter class="justify-center">
        <p class="text-muted-foreground text-xs">
          Lost your device?
          <a href={recoveryHref} class="text-foreground underline-offset-4 hover:underline">Use a recovery code</a>
        </p>
      </CardFooter>
    {:else}
      <CardContent class="space-y-4 pt-6 text-center">
        <div class="bg-success/10 text-success mx-auto flex size-12 items-center justify-center rounded-full">
          <ShieldCheck class="size-6" />
        </div>
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">Verified</h3>
          <p class="text-muted-foreground text-sm">You're all set. Continuing to your dashboard…</p>
        </div>
        <a href={continueHref} onclick={() => onContinue?.()}><Button class="w-full">Continue</Button></a>
      </CardContent>
    {/if}
  </Card>
</div>
