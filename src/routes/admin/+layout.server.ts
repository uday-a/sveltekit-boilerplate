import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

// Role guard mirroring hooks.server.ts: anonymous visitors bounce to
// /login?next=<path>; signed-in non-admins bounce to /dashboard. The hook
// already enforces this for /admin/*; the load is the route-level mirror.
// Real enforcement is server-side requireRole() on /api/admin/*.
export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    redirect(302, `/login?next=${encodeURIComponent(`${url.pathname}${url.search}`)}`)
  }
  if (locals.user.role !== 'admin') {
    redirect(302, '/dashboard?error=forbidden')
  }
  return {}
}
