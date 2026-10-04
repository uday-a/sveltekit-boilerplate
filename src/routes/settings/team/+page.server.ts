import { redirect } from '@sveltejs/kit'
import { loadApi } from '$lib/server/load-api'
import type { PageServerLoad } from './$types'

// Auth guard mirroring hooks.server.ts, plus the first members/invites fetch
// so SSR renders the lists (no "0 members" flash) — Nuxt's awaited useFetch.
// event.fetch calls the API handlers in-process with the user's cookies.
export const load: PageServerLoad = async ({ locals, url, fetch }) => {
  if (!locals.user) {
    redirect(302, `/login?next=${encodeURIComponent(url.pathname + url.search)}`)
  }
  const [membersRes, invitesRes] = await Promise.all([
    loadApi<{ members: unknown[] }>(fetch, '/api/team/members'),
    loadApi<{ invites: unknown[] }>(fetch, '/api/team/invites'),
  ])
  return { membersRes, invitesRes }
}
