import { describe, expect, it } from 'vitest'
import { fallbackSessionPassword, resolveDemoMode } from './env'

// Demo mode hands out admin sessions to anyone, so a prod start that
// forgets NODE_ENV (bare `node build`) must NOT turn it on.
describe('resolveDemoMode', () => {
  it('is off when NODE_ENV is unset', () => {
    expect(resolveDemoMode(undefined, undefined)).toBe(false)
  })
  it('is off in production and test', () => {
    expect(resolveDemoMode(undefined, 'production')).toBe(false)
    expect(resolveDemoMode(undefined, 'test')).toBe(false)
  })
  it('is on in development (vite dev)', () => {
    expect(resolveDemoMode(undefined, 'development')).toBe(true)
  })
  it('DEMO_MODE=true forces it on, even in production', () => {
    expect(resolveDemoMode('true', undefined)).toBe(true)
    expect(resolveDemoMode('true', 'production')).toBe(true)
  })
  it('DEMO_MODE=false forces it off, even in development', () => {
    expect(resolveDemoMode('false', 'development')).toBe(false)
  })
})

// A stable (deterministic) session secret is only safe when a forged cookie
// can't reach anything real: demo mode on and no DB / OAuth / email / billing.
// Every other case must fall back to an unguessable per-instance secret.
describe('fallbackSessionPassword', () => {
  const demo = { DEMO_MODE: 'true', VERCEL_PROJECT_ID: 'prj_123' }
  it('is stable for a pure demo, so sessions survive across instances', () => {
    const a = fallbackSessionPassword(demo)
    expect(a.stable).toBe(true)
    expect(a.value).toBe(fallbackSessionPassword(demo).value)
    expect(a.value.length).toBeGreaterThanOrEqual(32)
  })
  it.each(['DATABASE_URL', 'GITHUB_CLIENT_ID', 'RESEND_API_KEY', 'POLAR_ACCESS_TOKEN'])(
    'is random once %s is configured',
    (key) => {
      const r = fallbackSessionPassword({ ...demo, [key]: 'configured' })
      expect(r.stable).toBe(false)
      expect(r.value).not.toBe(fallbackSessionPassword({ ...demo, [key]: 'configured' }).value)
    },
  )
  it('is random when demo mode is off', () => {
    expect(fallbackSessionPassword({ DEMO_MODE: 'false' }).stable).toBe(false)
  })
})
