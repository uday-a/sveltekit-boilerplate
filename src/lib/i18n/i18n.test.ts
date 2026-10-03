import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import en from './en.json'
import es from './es.json'
import { initI18n, locale, normalizeLocale, setLocale, t } from './index'

// Dot-paths of every leaf value, e.g. ['auth.signIn.title', ...].
function leafKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => leafKeys(v, prefix ? `${prefix}.${k}` : k))
}

describe('locale dictionaries', () => {
  it('en and es expose the exact same key set', () => {
    expect(leafKeys(es).sort()).toEqual(leafKeys(en).sort())
  })

  it('covers the auth.* + nav.* contract ported from nuxt', () => {
    const keys = leafKeys(en)
    expect(keys.length).toBeGreaterThan(50)
    for (const key of [
      'auth.signIn.title',
      'auth.signUp.submit',
      'auth.passwordReset.request.submit',
      'auth.passwordReset.done.title',
      'auth.mfa.title',
      'nav.groups.platform',
      'nav.actions.more',
      'nav.user.logout',
      'nav.items.dashboard',
    ]) {
      expect(keys).toContain(key)
    }
  })
})

describe('normalizeLocale', () => {
  it.each([
    ['en', 'en'],
    ['es', 'es'],
    ['en-US', 'en'],
    ['es-MX', 'es'],
    ['ES', 'es'],
    ['EN_gb', 'en'],
    ['  es  ', 'es'],
    ['fr', 'en'],
    ['', 'en'],
  ])('normalizeLocale(%j) → %j', (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected)
  })

  it('falls back to en for non-strings', () => {
    expect(normalizeLocale(undefined)).toBe('en')
    expect(normalizeLocale(null)).toBe('en')
    expect(normalizeLocale(42)).toBe('en')
  })
})

describe('t / locale / setLocale', () => {
  beforeEach(() => {
    initI18n({ locale: 'en' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    setLocale('en')
  })

  it('translates in the default locale', () => {
    expect(t('auth.signIn.title')).toBe('Welcome back')
    expect(t('nav.items.dashboard')).toBe('Dashboard')
  })

  it('switches dictionaries on setLocale', () => {
    setLocale('es')
    expect(get(locale)).toBe('es')
    expect(t('auth.signIn.title')).toBe('Bienvenido de nuevo')
    expect(t('nav.items.dashboard')).toBe('Panel')
  })

  it('interpolates {vars} with nuxt-style flat values', () => {
    expect(t('auth.mfa.invalidCode', { code: '123456' })).toContain('123456')
    setLocale('es')
    expect(t('auth.mfa.invalidCode', { code: '123456' })).toContain('123456')
    expect(t('auth.mfa.resendCooldown', { seconds: 30 })).toContain('30')
  })

  it('also accepts svelte-i18n { values } wrappers', () => {
    expect(t('auth.mfa.invalidCode', { values: { code: '999999' } })).toContain('999999')
  })

  it('is callable AND subscribable (store-function hybrid)', () => {
    expect(typeof t).toBe('function')
    expect(typeof t.subscribe).toBe('function')
    // What `$t('key')` compiles to in templates:
    expect(typeof get(t)).toBe('function')
    expect(get(t)('nav.items.dashboard')).toBe('Dashboard')
  })

  it('falls back to en + warns on unknown locales', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setLocale('fr')
    expect(get(locale)).toBe('en')
    expect(t('auth.signIn.title')).toBe('Welcome back')
    expect(warn).toHaveBeenCalledOnce()
  })

  it('accepts regional variants without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    setLocale('es-MX')
    expect(get(locale)).toBe('es')
    expect(t('nav.items.dashboard')).toBe('Panel')
    expect(warn).not.toHaveBeenCalled()
  })
})
