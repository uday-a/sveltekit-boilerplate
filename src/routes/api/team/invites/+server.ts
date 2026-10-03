import type { RequestHandler } from './$types'
import { desc, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDb } from '$lib/server/db/index'
import { ROLES, type Role } from '$lib/server/db/schema'
import { recordAudit } from '$lib/server/audit'
import { env } from '$lib/server/env'
import { requireAuth, requireRole } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { inviteEmail, sendEmail } from '$lib/server/mailer'
import { generateToken, hashToken } from '$lib/server/tokens'
import { requireRateLimit } from '$lib/server/rate-limit'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

// Team invites collection. Port of nuxt-boilerplate
// server/api/team/invites/index.ts (method-branched there; SvelteKit
// exports one handler per method here — same paths).
//
//   GET  /api/team/invites → pending invites (admin/editor)
//   POST /api/team/invites → create invite + email link (admin/editor)
//
// Token discipline mirrors the magic-link flow: SHA-256 hash persisted,
// raw token only in the emailed /invite/<raw> link, 7-day TTL,
// single-use via acceptedAt.

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Sample pending invites for demo sessions and DB-less boots. Emails
// match the roster domain served by /api/team/members in the same mode.
const DEMO_INVITES = [
  { id: 101, email: 'chloe.morgan@acme.com', role: 'editor', invitedBy: 1, expiresAt: '2026-10-05T10:00:00Z', createdAt: '2026-09-28T10:00:00Z' },
  { id: 102, email: 'ryan.brooks@acme.com', role: 'user', invitedBy: 2, expiresAt: '2026-10-03T15:30:00Z', createdAt: '2026-09-26T15:30:00Z' },
]

const InviteBody = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  role: z.enum(ROLES as unknown as [string, ...string[]]),
})

export const GET: RequestHandler = async (event) => {
  try {
    // Demo sessions have no `users` row, so requireRole's live lookup would
    // reject them once a DB is reachable. Gate on the cookie role instead,
    // serve sample data for GET, and keep writes disabled.
    const authed = await requireAuth(event)
    if (authed.demo === true) {
      if (!['admin', 'editor'].includes(authed.user.role)) {
        throw apiError('FORBIDDEN', `role '${authed.user.role}' is not permitted`)
      }
      return jsonOk({ invites: DEMO_INVITES })
    }

    await requireRole(event, 'admin', 'editor')

    if (!env.DATABASE_URL) return jsonOk({ invites: DEMO_INVITES })
    try {
      const db = useDb()
      const rows = await db
        .select({
          id: schema.invites.id,
          email: schema.invites.email,
          role: schema.invites.role,
          invitedBy: schema.invites.invitedBy,
          expiresAt: schema.invites.expiresAt,
          createdAt: schema.invites.createdAt,
        })
        .from(schema.invites)
        .where(isNull(schema.invites.acceptedAt))
        .orderBy(desc(schema.invites.createdAt))
      return jsonOk({ invites: rows })
    }
    catch (e) {
      logger.error('team.invites.list_failed', { error: (e as Error).message })
      throw apiError('INTERNAL', 'Could not list invites. The invites table may be missing — run `npx drizzle-kit migrate` against DATABASE_URL.')
    }
  }
  catch (err) {
    return jsonError(err)
  }
}

export const POST: RequestHandler = async (event) => {
  try {
    requireRateLimit(event, { key: 'team:invites' })
    const authed = await requireAuth(event)
    if (authed.demo === true) {
      if (!['admin', 'editor'].includes(authed.user.role)) {
        throw apiError('FORBIDDEN', `role '${authed.user.role}' is not permitted`)
      }
      throw apiError('FORBIDDEN', 'Invites are disabled in demo mode.')
    }

    const session = await requireRole(event, 'admin', 'editor')

    const parsed = InviteBody.safeParse(await event.request.json())
    if (!parsed.success) {
      throw apiError('VALIDATION_FAILED', 'Invalid invite payload', {
        issues: parsed.error.issues,
      })
    }

    if (!env.DATABASE_URL) {
      throw apiError('INTERNAL', 'Team invites require a database. Configure DATABASE_URL to send invites.')
    }

    const token = generateToken()
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

    try {
      const db = useDb()

      // SvelteKit divergence: session.user.id IS the DB users.id (see
      // guards.ts contract), so invitedBy attribution needs no email→id
      // lookup — nuxt needed it because its session id was the provider id.
      const invitedBy: number | null = session.user.id

      const [invite] = await db
        .insert(schema.invites)
        .values({
          email: parsed.data.email,
          role: parsed.data.role as Role,
          tokenHash,
          invitedBy,
          expiresAt,
        })
        .returning({
          id: schema.invites.id,
          email: schema.invites.email,
          role: schema.invites.role,
          expiresAt: schema.invites.expiresAt,
          createdAt: schema.invites.createdAt,
        })

      const link = `${env.PUBLIC_SITE_URL}/invite/${token}`
      const inviterLabel = session.user.name ?? session.user.login ?? undefined
      try {
        await sendEmail(inviteEmail({ email: parsed.data.email, link, role: parsed.data.role, inviter: inviterLabel }))
      }
      catch (e) {
        // Invite row already exists — a mailer outage shouldn't roll it
        // back. Surface the invite so the UI can offer a resend.
        logger.error('team.invite.send_failed', { email: parsed.data.email, error: (e as Error).message })
      }

      await recordAudit({
        userId: invitedBy,
        action: 'team.invite',
        entity: 'invite',
        entityId: invite?.id,
        metadata: { email: parsed.data.email, role: parsed.data.role },
      })
      logger.info('team.invite.created', { email: parsed.data.email, role: parsed.data.role })

      return jsonOk({ invite })
    }
    catch (e) {
      if ((e as { code?: string }).code === '23505') {
        throw apiError('VALIDATION_FAILED', 'An invite is already pending for this email', { field: 'email' })
      }
      // apiError instances pass through untouched.
      if ((e as { statusCode?: number }).statusCode) throw e
      logger.error('team.invite.create_failed', { email: parsed.data.email, error: (e as Error).message })
      throw apiError('INTERNAL', 'Could not create invite. The invites table may be missing — run `npx drizzle-kit migrate` against DATABASE_URL.')
    }
  }
  catch (err) {
    return jsonError(err)
  }
}
