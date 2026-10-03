import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { isDemoMode } from '$lib/server/env'

// Already signed in? Skip the form — mirrors nuxt's `if (loggedIn) navigateTo('/dashboard')`.
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(302, '/dashboard')
  // Demo-mode availability (nuxt: runtimeConfig.public.demoMode). NOTE this
  // is NOT the session `demo` flag from the root layout (true only when
  // already signed in as the demo user, which redirects away above) — it
  // answers "may an anonymous visitor mint a demo session?".
  return { demoMode: isDemoMode() }
}
