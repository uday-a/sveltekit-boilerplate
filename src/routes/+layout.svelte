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
  import { DEFAULT_DESCRIPTION, PUBLIC_ROUTES, SITE_NAME, siteOrigin } from '$lib/seo'

  let { children } = $props()

  const description = $derived(page.data.description ?? DEFAULT_DESCRIPTION)
  const canonical = $derived(`${siteOrigin(publicEnv.PUBLIC_SITE_URL, page.url.origin)}${page.url.pathname}`)
  const ogTitle = $derived(PUBLIC_ROUTES[page.url.pathname] ? `${PUBLIC_ROUTES[page.url.pathname]} | ${SITE_NAME}` : SITE_NAME)

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

<!-- One set of SEO tags for every page (svelte:head doesn't dedupe): a page
     sets `description` from its load, otherwise the site default applies. -->
<svelte:head>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:title" content={ogTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{@render children()}
<Toaster />
