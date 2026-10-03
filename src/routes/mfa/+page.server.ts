import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

// MFA is part of the sign-in flow. Once a session exists, the user has
// already cleared the bar — bounce them to the dashboard.
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(302, '/dashboard')
  return {}
}
