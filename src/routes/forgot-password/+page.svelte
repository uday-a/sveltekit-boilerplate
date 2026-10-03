<script lang="ts">
  import { toast } from 'svelte-sonner'
  import AuthPasswordReset from '$lib/components/blocks/auth-password-reset/AuthPasswordReset.svelte'
  import type { ApiResponse } from '$lib/server/response'

  async function onRequest(email: string) {
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

    // Errors surface as a toast rather than inside the card. Keeping the
    // card's existing stage machine intact so any AuthPasswordReset
    // registry update lands cleanly.
    if (!res.ok) toast.error(res.error.message)
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
