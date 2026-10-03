import type { RequestHandler } from './$types'
import { and, desc, eq, ilike } from 'drizzle-orm'
import { schema, useDb } from '$lib/server/db/index'
import { env } from '$lib/server/env'
import { requireAuth } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { jsonError, jsonOk } from '$lib/server/response'

// GET /api/activity — the caller's own audit trail, newest first. Port of
// nuxt-boilerplate server/api/activity/index.ts.
//
// Scope note: this returns caller-only rows. An admin-wide view (all rows,
// or rows per workspace member) is a deliberate future step — it needs a
// membership model to scope correctly, so we don't guess at one here.
//
// SvelteKit divergence: session.user.id IS the DB users.id (see
// guards.ts contract), so no email→id lookup is needed — nuxt needed it
// because its session id was the OAuth provider id.
//
// Without a DB (or for demo sessions, which have no rows to attribute)
// this returns an empty list — the client renders its mock fallback and a
// note that live events appear once a database is connected.
export const GET: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    if (session.demo === true) return jsonOk({ items: [], total: 0 })
    if (!env.DATABASE_URL) return jsonOk({ items: [], total: 0 })

    const rawAction = event.url.searchParams.get('action')
    const actionFilter = rawAction && rawAction.trim()
      ? rawAction.trim().replace(/[%_\\]/g, '').slice(0, 64)
      : null

    try {
      const db = useDb()
      const scope = actionFilter
        ? and(eq(schema.auditLogs.userId, session.user.id), ilike(schema.auditLogs.action, `%${actionFilter}%`))
        : eq(schema.auditLogs.userId, session.user.id)

      const items = await db
        .select({
          id: schema.auditLogs.id,
          userId: schema.auditLogs.userId,
          action: schema.auditLogs.action,
          entity: schema.auditLogs.entity,
          entityId: schema.auditLogs.entityId,
          metadata: schema.auditLogs.metadata,
          createdAt: schema.auditLogs.createdAt,
          actorEmail: schema.users.email,
        })
        .from(schema.auditLogs)
        .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
        .where(scope)
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(50)

      return jsonOk({ items, total: items.length })
    }
    catch (e) {
      // Table missing or DB unreachable — surface empty rather than 500 so
      // the activity surfaces degrade to their mock fallback.
      logger.warn('activity.list_failed', { error: (e as Error).message })
      return jsonOk({ items: [], total: 0 })
    }
  }
  catch (err) {
    return jsonError(err)
  }
}
