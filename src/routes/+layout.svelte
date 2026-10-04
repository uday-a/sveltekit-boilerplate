<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { afterNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import { env as publicEnv } from '$env/dynamic/public'
  // Runtime env so unset PostHog vars don't fail the build.
  const { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY } = publicEnv
  import { initI18n } from '$lib/i18n'
  import { capturePageview, initPostHog, posthog } from '$lib/posthog'
  import { Toaster } from '$lib/components/ui/sonner'

  let { children } = $props()

  // i18n (nuxt `no_prefix` port): SSR renders `en`; the client hydrates the
  // stored locale from the `uipkge-locale` cookie. See $lib/i18n for the
  // tradeoff note. Idempotent — safe under HMR re-evaluation.
  initI18n()

  // Last URL we sent a $pageview for. afterNavigate's initial-load behaviour
  // differs across SvelteKit versions (may or may not fire on hydration), so
  // onMount captures the first view and afterNavigate covers the rest — the
  // dedupe below keeps whichever-fires-first from double-counting. The client
  // check comes first so an early afterNavigate (before the async posthog-js
  // import resolves) doesn't burn the initial URL.
  let lastPageviewUrl: string | null = null

  function trackPageview(url: string): void {
    const client = get(posthog)
    if (!client || url === lastPageviewUrl) return
    lastPageviewUrl = url
    capturePageview(client, url)
  }

  onMount(async () => {
    const client = await initPostHog(PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST)
    if (client) trackPageview(window.location.href)
  })

  afterNavigate((navigation) => {
    trackPageview(navigation.to?.url.href ?? window.location.href)
  })
</script>

<!-- One description tag for every page (svelte:head doesn't dedupe): a page
     sets `description` from its load, otherwise the site default applies. -->
<svelte:head>
  <meta
    name="description"
    content={page.data.description ??
      'SvelteKit 2 SaaS boilerplate — auth, database, billing, email, analytics, and observability baked in.'}
  />
</svelte:head>

{@render children()}
<Toaster />
