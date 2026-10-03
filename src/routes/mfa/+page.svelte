<script lang="ts">
  import { goto } from '$app/navigation'
  import AuthMfa from '$lib/components/blocks/auth-mfa/AuthMfa.svelte'

  function onVerify(code: string) {
    console.warn('MFA verify (mock-only):', code)
  }

  function onContinue() {
    goto('/dashboard')
  }
</script>

<svelte:head>
  <title>Two-step verification | UIPKGE</title>
</svelte:head>

<AuthMfa
  continueHref="/dashboard"
  recoveryHref="#"
  {onVerify}
  {onContinue}
/>
