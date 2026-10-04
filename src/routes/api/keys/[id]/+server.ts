import type { RequestHandler } from './$types'
import { eq } from 'drizzle-orm'
import { schema, useDb } from '$lib/server/db/index'
import { recordAudit } from '$lib/server/audit'
import { requireAuth } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

// DELETE /api/keys/:id — revoke a key (sets revokedAt; the row stays for
// audit history). No body needed. Port of nuxt-boilerplate
// server/api/keys/[id].ts.
//
// Ownership is checked before existence is revealed: a key owned by
// someone else 404s exactly like a missing key, so ids can't be probed.
export const DELETE: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    const rawId = event.params.id
    const id = Number(rawId)
    if (!rawId || !Number.isInteger(id) || id === 0) {
      throw apiError('VALIDATION_FAILED', 'Invalid API key id', { field: 'id' })
    }

    // Demo sessions own no keys, so every id is a 404 by construction.
    if (session.demo === true) {
      throw apiError('NOT_FOUND', `API key ${id} not found`)
    }

    const db = useDb()
    const rows = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.id, id)).limit(1)
    const row = rows[0]
    if (!row || row.userId !== session.user.id) {
      throw apiError('NOT_FOUND', `API key ${id} not found`)
    }

    await db.update(schema.apiKeys).set({ revokedAt: new Date() }).where(eq(schema.apiKeys.id, id))

    await recordAudit({
      userId: session.user.id,
      action: 'api_keys.revoke',
      entity: 'api_key',
      entityId: id,
      metadata: { name: row.name, prefix: row.prefix },
    })
    logger.info('api_keys.revoked', { id, prefix: row.prefix })

    return jsonOk({ revoked: id })
  }
  catch (err) {
    return jsonError(err)
  }
}
