import { GitHub } from 'arctic'
import { env, hasGithubOAuth } from './env'

// GitHub OAuth via arctic (replaces nuxt-auth-utils'
// defineOAuthGitHubEventHandler). Two endpoints share this module:
//   GET /auth/github          → create state, redirect to GitHub
//   GET /auth/github/callback → validate state, exchange code, sign in
//
// The callback URL must match the GitHub OAuth App settings exactly:
//   <PUBLIC_SITE_URL>/auth/github/callback
// (see .env.example "Authorization callback URL").

export const GITHUB_OAUTH_SCOPES = ['user:email']

// Round-trip cookies for the OAuth flow (initiate → GitHub → callback).
// `next` survives the round-trip via OAUTH_NEXT_COOKIE so the login page's
// deep-link still lands after OAuth completes. Short-lived by design.
// (Lives here — NOT in a +server.ts — because SvelteKit rejects non-route
// exports from route modules at build time.)
export const OAUTH_STATE_COOKIE = 'github_oauth_state'
export const OAUTH_NEXT_COOKIE = 'github_oauth_next'
export const OAUTH_COOKIE_MAX_AGE = 60 * 10 // 10 minutes

export function getGitHubRedirectUri(): string {
  return `${env.PUBLIC_SITE_URL}/auth/github/callback`
}

/** Arctic GitHub client, or null when OAuth isn't configured. */
export function getGitHub(): GitHub | null {
  if (!hasGithubOAuth) return null
  return new GitHub(env.GITHUB_CLIENT_ID!, env.GITHUB_CLIENT_SECRET!, getGitHubRedirectUri())
}

export interface GitHubProfile {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string | null
}

interface GitHubEmailRow {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

/** GET /user — the authenticated profile for an OAuth access token. */
export async function fetchGitHubProfile(accessToken: string): Promise<GitHubProfile> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'sveltekit-boilerplate',
    },
  })
  if (!res.ok) throw new Error(`GitHub /user failed: ${res.status}`)
  return res.json() as Promise<GitHubProfile>
}

/**
 * GET /user/emails — the verified primary email. Nuxt set
 * `emailRequired: true` on its handler; the arctic equivalent is
 * requesting the `user:email` scope and reading this endpoint.
 * Returns null when the user has no verified email (private-email
 * accounts) — callers fall back to `<login>@users.noreply.github.com`
 * for the DB row and keep the session email null.
 */
export async function fetchGitHubPrimaryEmail(accessToken: string): Promise<string | null> {
  const res = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'sveltekit-boilerplate',
    },
  })
  if (!res.ok) return null
  const rows = await res.json() as GitHubEmailRow[]
  const primary = rows.find(r => r.primary && r.verified) ?? rows.find(r => r.verified)
  return primary?.email ?? null
}
