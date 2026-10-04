<script lang="ts">
  import AuthPasswordReset from '$lib/components/blocks/auth-password-reset/AuthPasswordReset.svelte'
  import type { ApiResponse } from '$lib/server/response'

  let errorMsg = $state('')

  async function onRequest(email: string) {
    errorMsg = ''
    let res: ApiResponse<{ expiresInMin: number }>
    try {
      const r = await fetch('/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      res = (await r.json()) as ApiResponse<{ expiresInMin: number }>
    }
    catch {
      res = { ok: false, error: { code: 'INTERNAL', message: 'Failed to send link' } }
    }

    if (!res.ok) errorMsg = res.error.message
  }

  // The /reset path is unused — magic-link IS the recovery. Keep the
  // component's submit slot inert.
  function onReset(_password: string) {
    // intentional: with magic-link, there is no password to reset.
  }
</script>

<svelte:head>
  <title>Sign-in link | UIPKGE</title>
</svelte:head>

<AuthPasswordReset
  signInHref="/login"
  {onRequest}
  {onReset}
/>
<!-- Errors surface in a toast-style overlay rather than inside the card.
     Keeping the card's existing stage machine intact so any
     AuthPasswordReset registry update lands cleanly. -->
{#if errorMsg}
  <div
    class="border-destructive/30 bg-background/95 text-destructive fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-md rounded-full border px-4 py-2 text-sm shadow-lg backdrop-blur"
  >
    {errorMsg}
  </div>
{/if}
