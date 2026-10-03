import { redirect, type RequestEvent } from '@sveltejs/kit'
import { generateState } from 'arctic'
import {
  getGitHub,
  GITHUB_OAUTH_SCOPES,
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
} from '$lib/server/oauth'
import { safeRedirectPath } from '$lib/utils'

// GitHub OAuth initiation (arctic replaces nuxt-auth-utils'
// defineOAuthGitHubEventHandler, which multiplexed initiate+callback on
// one URL — arctic needs a dedicated callback, so the flow is split):
//
//   GET /auth/github?next=/settings  → 302 to github.com (state cookie)
//   GET /auth/github/callback?...   → exchange, upsert, session, 302 next
//
// `next` survives the round-trip via a short-lived cookie so the login
// page's deep-link still lands after OAuth completes.

export async function GET(event: RequestEvent): Promise<never> {
  const github = getGitHub()
  if (!github) {
    // OAuth not configured — bounce to login (which surfaces demo mode
    // when that's on) rather than 500ing.
    redirect(302, '/login?error=oauth')
  }

  const state = generateState()
  const url = github.createAuthorizationURL(state, GITHUB_OAUTH_SCOPES)

  const next = safeRedirectPath(event.url.searchParams.get('next'))
  const secure = event.url.protocol === 'https:'
  event.cookies.set(OAUTH_STATE_COOKIE, state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  })
  event.cookies.set(OAUTH_NEXT_COOKIE, next, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  })

  redirect(302, url.toString())
}
