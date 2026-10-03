import type { RequestHandler } from './$types'
import { eq } from 'drizzle-orm'
import { schema, useDb } from '$lib/server/db/index'
import { recordAudit } from '$lib/server/audit'
import { env } from '$lib/server/env'
import { requireAuth, requireRole } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { hashToken } from '$lib/server/tokens'
import { setSession } from '$lib/server/session'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

// /api/team/invites/:param — one route slot, two resources. Port of
// nuxt-boilerplate server/api/team/invites/[param].ts (SvelteKit exports
// one handler per method here; the param-shape branch is the same).
//
//   numeric            → admin invite by id   (DELETE revoke; auth + role)
//   base64url token    → public invite token  (GET verify / POST accept)
//   anything else      → 404
//
// Invite tokens come from generateToken() (32 random bytes, base64url →
// 43 chars). Accept 32–128 URL-safe chars so a future byteLength change
// keeps working; an all-digit param is always treated as an id.
const ID_RE = /^\d+$/
const TOKEN_RE = /^[\w-]{32,128}$/

type InviteRow = typeof schema.invites.$inferSelect

async function lookupInviteByToken(rawToken: string): Promise<InviteRow> {
  if (!env.DATABASE_URL) {
    throw apiError('NOT_FOUND', 'Invite not found')
  }

  const tokenHash = hashToken(rawToken)

  let invite: InviteRow | undefined
  try {
    const db = useDb()
    const rows = await db
      .select()
      .from(schema.invites)
      .where(eq(schema.invites.tokenHash, tokenHash))
      .limit(1)
    invite = rows[0]
  }
  catch (e) {
    logger.error('team.invite.lookup_failed', { error: (e as Error).message })
    throw apiError('INTERNAL', 'Could not verify invite. The invites table may be missing — run `npx drizzle-kit migrate` against DATABASE_URL.')
  }

  if (!invite) {
    throw apiError('NOT_FOUND', 'Invite not found')
  }
  if (invite.acceptedAt) {
    throw apiError('VALIDATION_FAILED', 'This invite has already been accepted')
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    throw apiError('VALIDATION_FAILED', 'This invite has expired — ask your admin for a new one')
  }
  return invite
}

// ─── GET verify ────────────────────────────────────────────────────
// Public invite verification. The token IS the auth here (same posture
// as the magic-link verify) — no session required to READ the invite,
// only to ACCEPT it. Numeric ids 404 on GET (a GET must never mutate).
export const GET: RequestHandler = async (event) => {
  try {
    const rawParam = event.params.param ?? ''

    if (ID_RE.test(rawParam)) {
      throw apiError('NOT_FOUND', 'Method GET not supported on /api/team/invites/:id')
    }
    if (TOKEN_RE.test(rawParam)) {
      const invite = await lookupInviteByToken(rawParam)
      return jsonOk({ email: invite.email, role: invite.role, valid: true })
    }

    throw apiError('NOT_FOUND', 'Invite not found')
  }
  catch (err) {
    return jsonError(err)
  }
}

// ─── POST accept ───────────────────────────────────────────────────
// Applies the invited role to the signed-in user. Requires a session
// whose email matches the invite (case-insensitive).
export const POST: RequestHandler = async (event) => {
  try {
    const rawParam = event.params.param ?? ''

    if (ID_RE.test(rawParam)) {
      throw apiError('NOT_FOUND', 'Method POST not supported on /api/team/invites/:id')
    }
    if (!TOKEN_RE.test(rawParam)) {
      throw apiError('NOT_FOUND', 'Invite not found')
    }

    const invite = await lookupInviteByToken(rawParam)

    let session
    try {
      session = await requireAuth(event)
    }
    catch {
      throw apiError('VALIDATION_FAILED', 'signin required — sign in to accept this invite')
    }

    const sessionEmail = (session.user.email ?? '').toLowerCase()
    if (!sessionEmail || sessionEmail !== invite.email.toLowerCase()) {
      throw apiError('VALIDATION_FAILED', `signin required — sign in as ${invite.email} to accept this invite`)
    }

    try {
      const db = useDb()

      // Apply the invited role to the matching user row.
      const updated = await db
        .update(schema.users)
        .set({ role: invite.role, updatedAt: new Date() })
        .where(eq(schema.users.email, invite.email))
        .returning({ id: schema.users.id })

      // Mark single-use BEFORE returning, so a crash mid-flow can't
      // leave the token reusable.
      await db
        .update(schema.invites)
        .set({ acceptedAt: new Date() })
        .where(eq(schema.invites.id, invite.id))

      await recordAudit({
        userId: updated[0]?.id ?? null,
        action: 'team.accept',
        entity: 'invite',
        entityId: invite.id,
        metadata: { email: invite.email, role: invite.role },
      })

      // Patch the sealed session so the UI reflects the new role without
      // forcing a re-login. Cookie rewrite is intentional here (unlike
      // requireRole) — the role genuinely changed.
      try {
        await setSession(event.cookies, {
          ...session,
          user: { ...session.user, role: invite.role },
        })
      }
      catch (e) {
        logger.warn('team.accept.session_patch_failed', { error: (e as Error).message })
      }

      logger.info('team.invite.accepted', { email: invite.email, role: invite.role })
      return jsonOk({ accepted: true, email: invite.email, role: invite.role })
    }
    catch (e) {
      // apiError instances pass through untouched.
      if ((e as { statusCode?: number }).statusCode) throw e
      logger.error('team.invite.accept_failed', { email: invite.email, error: (e as Error).message })
      throw apiError('INTERNAL', 'Could not accept invite. Please try again.')
    }
  }
  catch (err) {
    return jsonError(err)
  }
}

// ─── DELETE revoke ─────────────────────────────────────────────────
// Revokes a pending invite by numeric id (admin/editor). Only pending
// rows (acceptedAt IS NULL) can be revoked; accepted rows are history
// and must stay for the audit trail.
export const DELETE: RequestHandler = async (event) => {
  try {
    const rawParam = event.params.param ?? ''

    if (TOKEN_RE.test(rawParam) && !ID_RE.test(rawParam)) {
      throw apiError('NOT_FOUND', 'Method DELETE not supported on /api/team/invites/:token')
    }
    if (!ID_RE.test(rawParam)) {
      throw apiError('NOT_FOUND', 'Invite not found')
    }

    // Check demo before requireRole: demo sessions have no `users` row, so
    // the live role lookup would answer SESSION_INVALID instead.
    const authed = await requireAuth(event)
    if (authed.demo === true) {
      throw apiError('FORBIDDEN', 'Invites are disabled in demo mode.')
    }

    await requireRole(event, 'admin', 'editor')

    if (!env.DATABASE_URL) {
      throw apiError('INTERNAL', 'Team invites require a database. Configure DATABASE_URL to manage invites.')
    }

    const id = Number(rawParam)
    if (!Number.isInteger(id) || id <= 0) {
      throw apiError('VALIDATION_FAILED', 'Invalid invite id', { field: 'id' })
    }

    try {
      const db = useDb()
      const rows = await db
        .select()
        .from(schema.invites)
        .where(eq(schema.invites.id, id))
        .limit(1)
      const invite = rows[0]
      if (!invite) {
        throw apiError('NOT_FOUND', `Invite ${id} not found`)
      }
      if (invite.acceptedAt) {
        throw apiError('VALIDATION_FAILED', 'Invite was already accepted and cannot be revoked')
      }

      await db.delete(schema.invites).where(eq(schema.invites.id, id))

      await recordAudit({
        action: 'team.revoke',
        entity: 'invite',
        entityId: id,
        metadata: { email: invite.email },
      })
      logger.info('team.invite.revoked', { id, email: invite.email })

      return jsonOk({ revoked: id })
    }
    catch (e) {
      // apiError instances pass through untouched.
      if ((e as { statusCode?: number }).statusCode) throw e
      logger.error('team.invite.revoke_failed', { id, error: (e as Error).message })
      throw apiError('INTERNAL', 'Could not revoke invite. The invites table may be missing — run `npx drizzle-kit migrate` against DATABASE_URL.')
    }
  }
  catch (err) {
    return jsonError(err)
  }
}
