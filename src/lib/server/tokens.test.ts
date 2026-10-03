import { describe, expect, it } from 'vitest'
import { generateToken, sha256hex, hashToken } from './tokens'

describe('generateToken', () => {
  it('returns a 43-char base64url string for the default 32 bytes', () => {
    const token = generateToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('respects a custom byte length', () => {
    expect(generateToken(16)).toMatch(/^[A-Za-z0-9_-]{22}$/)
  })

  it('generates unique tokens', () => {
    const seen = new Set(Array.from({ length: 100 }, () => generateToken()))
    expect(seen.size).toBe(100)
  })
})

describe('sha256hex', () => {
  it('matches the known SHA-256 vector', () => {
    expect(sha256hex('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })

  it('returns 64 lowercase hex chars (fits the varchar(64) column)', () => {
    expect(sha256hex(generateToken())).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic', () => {
    expect(sha256hex('abc')).toBe(sha256hex('abc'))
  })
})

describe('hashToken', () => {
  it('is an alias of sha256hex (nuxt parity)', () => {
    expect(hashToken('parity-check')).toBe(sha256hex('parity-check'))
  })
})
