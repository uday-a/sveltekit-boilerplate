import type { RequestHandler } from './$types'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDb } from '$lib/server/db/index'
import { requireAuth } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

// Current-user profile: GET returns it, PUT updates it. Port of
// nuxt-boilerplate server/api/me/profile.ts (method-branched there;
// SvelteKit exports one handler per method here — same paths).

const UpdateProfile = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  // IANA tz name. We don't enforce the full list — Postgres `varchar(64)`
  // is the storage bound; clients should pick from a curated dropdown.
  timezone: z.string().trim().min(1).max(64).optional(),
  // BCP-47-ish. Same reasoning: enforce shape, let UI pick valid values.
  locale: z.string().trim().min(2).max(8).optional(),
  notifyEmail: z.boolean().optional(),
  notifyInApp: z.boolean().optional(),
})

const profileShape = {
  name: schema.users.name,
  bio: schema.users.bio,
  timezone: schema.users.timezone,
  locale: schema.users.locale,
  notifyEmail: schema.users.notifyEmail,
  notifyInApp: schema.users.notifyInApp,
} as const

export const GET: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    if (session.demo === true) {
      return jsonOk({
        profile: {
          name: session.user.name,
          bio: 'Demo account — changes here aren’t persisted.',
          timezone: 'UTC',
          locale: 'en',
          notifyEmail: true,
          notifyInApp: true,
        },
      })
    }

    const db = useDb()
    const [row] = await db
      .select(profileShape)
      .from(schema.users)
      .where(eq(schema.users.id, session.user.id))
      .limit(1)
    if (!row) throw apiError('SESSION_INVALID', 'Account no longer exists')
    return jsonOk({ profile: row })
  }
  catch (err) {
    return jsonError(err)
  }
}

export const PUT: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    const parsed = UpdateProfile.safeParse(await event.request.json())
    if (!parsed.success) {
      throw apiError('VALIDATION_FAILED', 'Invalid profile payload', {
        issues: parsed.error.issues,
      })
    }

    if (session.demo === true) {
      // Demo: return success but don't persist; let the UI surface it.
      return jsonOk({ profile: parsed.data, demo: true })
    }

    const db = useDb()
    const [updated] = await db
      .update(schema.users)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.users.id, session.user.id))
      .returning(profileShape)
    if (!updated) throw apiError('SESSION_INVALID', 'Account no longer exists')
    logger.info('me.profile.updated', { userId: session.user.id, fields: Object.keys(parsed.data) })
    return jsonOk({ profile: updated })
  }
  catch (err) {
    return jsonError(err)
  }
}
