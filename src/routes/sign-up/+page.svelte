<script lang="ts">
  import AuthSignUp, { type OauthProvider } from '$lib/components/blocks/auth-sign-up/AuthSignUp.svelte'

  function onSubmit(_payload: { name: string, email: string, password: string }) {
    alert('Email signup is not wired. Use the GitHub button to continue.')
  }

  function onOauth(provider: OauthProvider) {
    if (provider !== 'github') {
      alert('Only GitHub OAuth is wired right now.')
      return
    }
    window.location.href = '/auth/github'
  }
</script>

<svelte:head>
  <title>Create an account | UIPKGE</title>
</svelte:head>

<AuthSignUp
  signInHref="/login"
  oauthProviders={['github']}
  {onSubmit}
  {onOauth}
/>
