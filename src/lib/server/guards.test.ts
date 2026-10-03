import { describe, expect, it } from 'vitest'
import { requireAuth, requireRole, requirePublic, type Session } from './guards'
import { ApiError } from './response'

// NOTE: these tests run WITHOUT a DATABASE_URL, so the live-role lookup
// is unreachable and requireRole exercises its cookie-role fallback path
// (same as db-less dev). Live-DB paths (found / not-found) need an
// integration test against Postgres — out of scope for unit tests.

function authedEvent(role: Session['user']['role'] = 'user', demo?: boolean) {
  const session: Session = {
    user: {
      id: 7,
      login: 'ada',
      name: 'Ada',
      email: 'ada@example.com',
      avatar: null,
      role,
    },
    loggedInAt: Date.now(),
    ...(demo !== undefined ? { demo } : {}),
  }
  return {
    locals: { session, user: session.user, demo: demo === true },
  } as unknown as Parameters<typeof requireAuth>[0]
}

const anonEvent = {
  locals: { session: null, user: null, demo: false },
} as unknown as Parameters<typeof requireAuth>[0]

async function catchError(fn: () => Promise<unknown>): Promise<ApiError> {
  try {
    await fn()
  }
  catch (e) {
    expect(e).toBeInstanceOf(ApiError)
    return e as ApiError
  }
  throw new Error('expected fn to throw')
}

describe('requireAuth', () => {
  it('returns the session for a logged-in user', async () => {
    const session = await requireAuth(authedEvent())
    expect(session.user.login).toBe('ada')
  })

  it('throws 401 UNAUTHORIZED when logged out', async () => {
    const err = await catchError(() => requireAuth(anonEvent))
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.statusCode).toBe(401)
  })
})

describe('requireRole', () => {
  it('passes when the cookie role is allowed (db-unavailable fallback)', async () => {
    const session = await requireRole(authedEvent('admin'), 'admin')
    expect(session.user.role).toBe('admin')
  })

  it('accepts a rest list of roles', async () => {
    const session = await requireRole(authedEvent('editor'), 'admin', 'editor')
    expect(session.user.role).toBe('editor')
  })

  it('accepts an array of roles', async () => {
    const session = await requireRole(authedEvent('admin'), ['admin', 'editor'])
    expect(session.user.role).toBe('admin')
  })

  it('throws 403 FORBIDDEN when the cookie role is not allowed', async () => {
    const err = await catchError(() => requireRole(authedEvent('user'), 'admin'))
    expect(err.code).toBe('FORBIDDEN')
    expect(err.statusCode).toBe(403)
    expect(err.message).toContain("role 'user' is not permitted")
  })

  it('throws 401 UNAUTHORIZED when logged out (auth runs first)', async () => {
    const err = await catchError(() => requireRole(anonEvent, 'admin'))
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.statusCode).toBe(401)
  })
})

describe('requirePublic', () => {
  it('is a no-op that never throws', () => {
    expect(() => requirePublic(anonEvent)).not.toThrow()
    expect(() => requirePublic(authedEvent())).not.toThrow()
  })
})
