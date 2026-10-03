import type { RequestEvent } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { useDb, schema } from './db/index'
import { ROLES, type Role } from './db/schema'
import { logger } from './logger'
import { apiError } from './response'

// Session shape — single source of truth (session.ts re-exports these).
// Mirrors nuxt-boilerplate shared/types/auth.d.ts (User) + the
// { loggedInAt, demo } wrapper set by setUserSession() in
// server/routes/auth/*. The auth worker issues this from the iron-session
// cookie in hooks.server.ts and stores it on event.locals.session.
//
// CONTRACT: session.user.id is the DB users.id primary key (not the GitHub
// numeric id). The auth worker upserts first, then stores the row id. This
// intentionally differs from nuxt's guards.ts, which looked up by githubId
// while the profile/projects/subscription routes scoped by users.id —
// inconsistent for magic-link users (githubId NULL). One id, everywhere.
export interface SessionUser {
  id: number
  login: string
  name: string
  // GitHub allows private-email accounts; OAuth then returns null.
  // Don't pretend this is always a string — callers must handle null.
  email: string | null
  avatar: string | null
  role: Role
}

export interface Session {
  user: SessionUser
  loggedInAt: number
  demo?: boolean
}

/**
 * Require an authenticated session (set by hooks.server.ts on
 * event.locals.session).
 *
 * Throws 401 UNAUTHORIZED — jsonError() normalises it into the envelope.
 */
export async function requireAuth(event: RequestEvent): Promise<Session> {
  const session = event.locals.session
  if (!session) throw apiError('UNAUTHORIZED', 'Sign in required')
  return session
}

/**
 * Require an authenticated session whose user has one of the allowed
 * roles.
 *
 * Re-reads the role from the database on every call instead of trusting
 * the session cookie. Why: the session cookie has a multi-day TTL, so a
 * cached role would mean demoting an admin doesn't actually take effect
 * until they log out. One indexed lookup on users.id is cheap; trade the
 * round-trip for correctness.
 *
 * Three possible outcomes from the DB:
 *   - row found, role in allow-list  -> pass, session.user.role updated
 *   - row found, role not allowed    -> 403 FORBIDDEN
 *   - row missing entirely           -> 401 SESSION_INVALID (the cookie
 *                                       refers to a user that no longer
 *                                       exists; hard deny, never fall back
 *                                       to the cookie role)
 *   - DB unreachable                 -> fall back to cookie role with a
 *                                       logger.warn so adopters notice
 *                                       the staleness risk
 *
 * Accepts a single role, a rest list, or an array:
 *   requireRole(event, 'admin')
 *   requireRole(event, 'admin', 'editor')
 *   requireRole(event, ['admin', 'editor'])
 */
export async function requireRole(
  event: RequestEvent,
  ...allowedInput: (Role | Role[])[]
): Promise<Session> {
  const allowed = allowedInput.flat()
  const session = await requireAuth(event)

  const lookup = await readLiveRole(session.user.id)
  let role: Role
  if (lookup.state === 'found') {
    role = lookup.role
  }
  else if (lookup.state === 'not-found') {
    // User row was deleted while a session cookie was still valid.
    // Never trust the cookie role in this case — they shouldn't exist.
    throw apiError('SESSION_INVALID', 'Account no longer exists')
  }
  else {
    // DB unreachable — controlled fallback.
    role = session.user.role
  }

  if (!allowed.includes(role)) {
    throw apiError('FORBIDDEN', `role '${role}' is not permitted`)
  }
  // Patch the in-memory session so downstream handlers see the fresh role.
  // We don't rewrite the cookie — that would extend its TTL on every
  // request.
  if (lookup.state === 'found' && lookup.role !== session.user.role) {
    session.user.role = lookup.role
  }
  return session
}

/**
 * Explicit no-op guard for public routes.
 * Use it at the top of a handler to signal "this endpoint is intentionally public".
 */
export function requirePublic(_event: RequestEvent): void {
  // no-op
}

type RoleLookup
  = | { state: 'found', role: Role }
    | { state: 'not-found' }
    | { state: 'db-unavailable' }

async function readLiveRole(userId: number): Promise<RoleLookup> {
  try {
    const db = useDb()
    const row = await db
      .select({ role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)
    const r = row[0]?.role
    if (!r) return { state: 'not-found' }
    if ((ROLES as readonly string[]).includes(r)) {
      return { state: 'found', role: r as Role }
    }
    // DB has a role string that isn't in the TS Role union — treat as
    // missing rather than trusting an unknown value.
    return { state: 'not-found' }
  }
  catch (e) {
    logger.warn('guards.live_role_lookup_failed', {
      error: (e as Error).message,
    })
    return { state: 'db-unavailable' }
  }
}
