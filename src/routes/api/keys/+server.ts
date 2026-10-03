import type { RequestHandler } from './$types'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDb } from '$lib/server/db/index'
import { recordAudit } from '$lib/server/audit'
import { demoSampleKeys, mintApiKey } from '$lib/server/api-keys'
import { requireRateLimit } from '$lib/server/rate-limit'
import { requireAuth } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

// API keys collection: GET lists the caller's, POST mints one. Port of
// nuxt-boilerplate server/api/keys/index.ts (method-branched there;
// SvelteKit exports one handler per method here — same paths).

const CreateKey = z.object({
  name: z.string().trim().min(1, 'Name is required').max(64, 'Name must be 64 characters or fewer'),
  scopes: z.array(z.enum(['read', 'write'])).min(1).max(4).default(['read']),
  expiresInDays: z.number().int().positive().max(365).optional(),
})

export const GET: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    // Demo has no DB rows — surface clearly-flagged sample rows so the
    // page shows existing data. Real users always read their own rows.
    if (session.demo === true) return jsonOk({ keys: demoSampleKeys() })

    const db = useDb()
    // Explicit column list — keyHash is selected nowhere, so it can
    // never leak into the list response.
    const keys = await db
      .select({
        id: schema.apiKeys.id,
        name: schema.apiKeys.name,
        prefix: schema.apiKeys.prefix,
        scopes: schema.apiKeys.scopes,
        lastUsedAt: schema.apiKeys.lastUsedAt,
        expiresAt: schema.apiKeys.expiresAt,
        revokedAt: schema.apiKeys.revokedAt,
        createdAt: schema.apiKeys.createdAt,
      })
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, session.user.id))
      .orderBy(desc(schema.apiKeys.createdAt))
    return jsonOk({ keys })
  }
  catch (err) {
    return jsonError(err)
  }
}

export const POST: RequestHandler = async (event) => {
  try {
    requireRateLimit(event, { key: 'api:keys' })
    const session = await requireAuth(event)

    const parsed = CreateKey.safeParse(await event.request.json())
    if (!parsed.success) {
      throw apiError('VALIDATION_FAILED', 'Invalid API key payload', {
        issues: parsed.error.issues,
      })
    }

    const minted = mintApiKey()
    const scopes = [...new Set(parsed.data.scopes)].join(' ')
    const expiresAt = parsed.data.expiresInDays ? new Date(Date.now() + parsed.data.expiresInDays * 86400000) : null

    if (session.demo === true) {
      // Demo: echo back without persisting.
      return jsonOk({
        key: {
          id: 0,
          name: parsed.data.name,
          prefix: minted.prefix,
          scopes,
          lastUsedAt: null,
          expiresAt,
          revokedAt: null,
          createdAt: new Date(),
        },
        rawKey: minted.raw,
      })
    }

    const db = useDb()
    const [row] = await db
      .insert(schema.apiKeys)
      .values({
        userId: session.user.id,
        name: parsed.data.name,
        keyHash: minted.hash,
        prefix: minted.prefix,
        scopes,
        expiresAt,
      })
      .returning()
    if (!row) throw apiError('INTERNAL', 'Could not create API key')

    // Never log the raw key — prefix is enough for support lookups.
    logger.info('api_keys.created', { userId: session.user.id, prefix: minted.prefix })
    await recordAudit({
      userId: session.user.id,
      action: 'api_keys.create',
      entity: 'api_key',
      entityId: row.id,
      metadata: { name: row.name, prefix: minted.prefix },
    })

    // Rebuild the row without keyHash rather than destructuring it away
    // (avoids an unused-var lint trip on the omitted field).
    const { id, name, prefix, createdAt, lastUsedAt, revokedAt } = row
    return jsonOk({
      key: { id, name, prefix, scopes: row.scopes, lastUsedAt, expiresAt: row.expiresAt, revokedAt, createdAt },
      rawKey: minted.raw,
    })
  }
  catch (err) {
    return jsonError(err)
  }
}
