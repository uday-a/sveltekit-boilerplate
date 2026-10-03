import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

// Auth guard mirroring hooks.server.ts: anonymous visitors bounce to
// /login?next=<path>. The hook already enforces this for /settings/*;
// the load is the page-level mirror (and the place to add data later).
export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    redirect(302, `/login?next=${encodeURIComponent(url.pathname + url.search)}`)
  }
  return {}
}
