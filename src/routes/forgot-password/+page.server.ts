import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

// Already signed in? Skip the form — they don't need to reset.
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(302, '/dashboard')
  return {}
}
