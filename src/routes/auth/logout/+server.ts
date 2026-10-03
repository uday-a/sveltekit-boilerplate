import { redirect, type RequestEvent } from '@sveltejs/kit'
import { clearSession } from '$lib/server/session'

// Logout speaks redirects on both methods (mirrors nuxt
// server/routes/auth/logout.{get,post}.ts). GET exists so a plain
// <a href="/auth/logout"> works; POST is the form/JS path.
async function logout(event: RequestEvent): Promise<never> {
  clearSession(event.cookies)
  redirect(302, '/login')
}

export const GET = logout
export const POST = logout
