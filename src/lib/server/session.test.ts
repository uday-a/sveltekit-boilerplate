import { describe, expect, it } from 'vitest'
import {
  SESSION_COOKIE_NAME,
  clearSession,
  getSession,
  sealSession,
  setSession,
  unsealSession,
  type SessionCookies,
  type SessionData,
} from './session'

// Explicit test secret — keeps these tests hermetic (no dependency on the
// real SESSION_PASSWORD, but satisfies iron-session's 32-char minimum).
const TEST_PASSWORD = 'test-seal-secret-min-32-chars-0123456789abcdef'

const fixture: SessionData = {
  user: {
    id: 42,
    login: 'ada',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    avatar: 'https://example.com/avatar.png',
    role: 'admin',
  },
  loggedInAt: 1700000000000,
}

/** In-memory SvelteKit `cookies` stub. */
function mockCookies(initial?: Record<string, string>): SessionCookies & { store: Map<string, string> } {
  const store = new Map(Object.entries(initial ?? {}))
  return {
    store,
    get: (name: string) => store.get(name),
    set: (name: string, value: string) => { store.set(name, value) },
    delete: (name: string) => { store.delete(name) },
  }
}

describe('sealSession / unsealSession roundtrip', () => {
  it('round-trips session data through seal + unseal', async () => {
    const seal = await sealSession(fixture, TEST_PASSWORD)
    expect(typeof seal).toBe('string')
    expect(seal.length).toBeGreaterThan(32)

    const data = await unsealSession(seal, TEST_PASSWORD)
    expect(data).toEqual(fixture)
  })

  it('returns null for a tampered seal (never throws)', async () => {
    const seal = await sealSession(fixture, TEST_PASSWORD)
    const tampered = seal.slice(0, -4) + 'xxxx'
    await expect(unsealSession(tampered, TEST_PASSWORD)).resolves.toBeNull()
  })

  it('returns null for garbage input', async () => {
    await expect(unsealSession('not-a-seal', TEST_PASSWORD)).resolves.toBeNull()
    await expect(unsealSession('', TEST_PASSWORD)).resolves.toBeNull()
  })

  it('returns null when unsealed with the wrong password', async () => {
    const seal = await sealSession(fixture, TEST_PASSWORD)
    await expect(unsealSession(seal, 'wrong-password-min-32-chars-000000000000')).resolves.toBeNull()
  })

  it('preserves the demo flag', async () => {
    const demo: SessionData = {
      user: { ...fixture.user, id: 0, role: 'admin' },
      loggedInAt: Date.now(),
      demo: true,
    }
    const seal = await sealSession(demo, TEST_PASSWORD)
    await expect(unsealSession(seal, TEST_PASSWORD)).resolves.toEqual(demo)
  })
})

describe('getSession / setSession / clearSession', () => {
  it('setSession writes the sk-session cookie; getSession reads it back', async () => {
    const cookies = mockCookies()
    // setSession uses the env password — seal/unseal through the real
    // cookie flow instead of hand-rolling seals.
    await setSession(cookies, fixture)
    expect(cookies.store.has(SESSION_COOKIE_NAME)).toBe(true)

    const data = await getSession(cookies)
    expect(data).toEqual(fixture)
  })

  it('getSession returns null when the cookie is missing', async () => {
    await expect(getSession(mockCookies())).resolves.toBeNull()
  })

  it('getSession returns null for a tampered cookie', async () => {
    const cookies = mockCookies({ [SESSION_COOKIE_NAME]: 'tampered-value' })
    await expect(getSession(cookies)).resolves.toBeNull()
  })

  it('clearSession removes the cookie', async () => {
    const cookies = mockCookies()
    await setSession(cookies, fixture)
    expect(cookies.store.has(SESSION_COOKIE_NAME)).toBe(true)
    clearSession(cookies)
    expect(cookies.store.has(SESSION_COOKIE_NAME)).toBe(false)
    await expect(getSession(cookies)).resolves.toBeNull()
  })
})
