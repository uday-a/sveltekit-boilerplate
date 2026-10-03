import { sealData, unsealData } from 'iron-session'
import type { Cookies } from '@sveltejs/kit'
import type { Session } from './guards'
import { env, isDevelopment } from './env'

// Sealed-cookie sessions via iron-session (the framework-agnostic core of
// what nuxt-auth-utils uses under the hood). SESSION_PASSWORD is the seal
// secret — 32+ chars, enforced by env.ts at boot.
//
// Session shape (mirrors nuxt shared/types/auth.d.ts + demo flag):
//   { user: { id, login, name, email, avatar, role }, loggedInAt, demo? }
//
// The Session/SessionUser interfaces live in guards.ts (single source of
// truth — guards, hooks, and routes all import from there); this module
// re-exports them plus a SessionData alias so session call sites don't
// need a second import.

export type { Session, SessionUser } from './guards'
export type SessionData = Session

export const SESSION_COOKIE_NAME = 'sk-session'

// 7 days in seconds — matches nuxt-auth-utils' default session maxAge.
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

// One deliberate divergence from nuxt: session.user.id is ALWAYS our DB
// users.id (magic-link and GitHub paths both resolve it via upsert). Nuxt
// stored the raw GitHub id for OAuth sessions and keyed its live-role
// lookup by githubId; we key by users.id (see guards.ts), so the session
// must carry the DB id for the lookup to hit. Db-less dev falls back to
// the provider id — guards then fall back to the cookie role, same deal.

// Minimal cookie surface we need — SvelteKit's `Cookies`, narrowed to
// the three methods we touch so unit tests can pass a plain in-memory
// stub.
export type SessionCookies = Pick<Cookies, 'get' | 'set' | 'delete'>

function baseCookieOptions(): Parameters<Cookies['set']>[2] {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    // Secure unless explicitly in development (unset NODE_ENV = prod).
    secure: !isDevelopment,
  }
}

/** Seal session data into an opaque string. Pure — takes an explicit secret for testability. */
export function sealSession(data: SessionData, password: string = env.SESSION_PASSWORD): Promise<string> {
  return sealData(data, { password, ttl: SESSION_TTL_SECONDS })
}

/** Unseal, returning null on missing/tampered/expired seals (never throws). */
export async function unsealSession(seal: string, password: string = env.SESSION_PASSWORD): Promise<SessionData | null> {
  try {
    const data = await unsealData<SessionData>(seal, { password, ttl: SESSION_TTL_SECONDS })
    if (!data || typeof data !== 'object' || !('user' in data)) return null
    return data as SessionData
  }
  catch {
    return null
  }
}

/** Read the current session from the request cookies. Null when logged out. */
export async function getSession(cookies: SessionCookies): Promise<SessionData | null> {
  const seal = cookies.get(SESSION_COOKIE_NAME)
  if (!seal) return null
  return unsealSession(seal)
}

/** Persist session data into a sealed cookie. */
export async function setSession(cookies: SessionCookies, data: SessionData): Promise<void> {
  const seal = await sealSession(data)
  cookies.set(SESSION_COOKIE_NAME, seal, {
    ...baseCookieOptions(),
    maxAge: SESSION_TTL_SECONDS,
  })
}

/** Clear the session cookie (logout). */
export function clearSession(cookies: SessionCookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' })
}
