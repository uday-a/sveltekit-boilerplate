import { randomBytes, createHash } from 'node:crypto'

// Tokens for magic-link sign-in (and any future short-lived one-time
// secret — invite acceptance, email verification, etc.).
//
// The raw token goes in the URL we email to the user. We persist only
// its SHA-256 hash, so a DB snapshot can't be used to forge sign-ins.
// Hash is hex-encoded (64 chars) — matches the `varchar(64)` column
// width in $lib/server/db/schema.ts → magicLinkTokens.tokenHash.

/** Cryptographically-random URL-safe token. 32 bytes ≈ 256 bits. */
export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url')
}

/** SHA-256 hex digest. Used to store/lookup tokens without keeping the raw. */
export function sha256hex(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Nuxt-parity alias for sha256hex. */
export const hashToken = sha256hex
