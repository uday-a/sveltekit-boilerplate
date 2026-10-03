import type { RequestHandler } from './$types'
import { eq } from 'drizzle-orm'
import { schema, useDb } from '$lib/server/db/index'
import { requireAuth } from '$lib/server/guards'
import { planForProductId } from '$lib/server/polar'
import { jsonError, jsonOk } from '$lib/server/response'

// Current user's subscription summary, used by /settings/billing and
// the pricing page to show which plan they're on.
//
// Returns `{ subscription: null }` for users who haven't subscribed
// — the caller renders the upgrade CTA in that case. Demo users always
// see `null` since they can't reach the real billing system.
export const GET: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    if (session.demo === true) {
      return jsonOk({ subscription: null })
    }

    const db = useDb()
    const [row] = await db
      .select({
        status: schema.subscriptions.status,
        productId: schema.subscriptions.productId,
        currentPeriodEnd: schema.subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: schema.subscriptions.cancelAtPeriodEnd,
        canceledAt: schema.subscriptions.canceledAt,
      })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, session.user.id))
      .limit(1)

    if (!row) return jsonOk({ subscription: null })

    return jsonOk({
      subscription: {
        ...row,
        // Resolve productId → plan key so the UI doesn't have to know
        // about Polar product IDs.
        plan: planForProductId(row.productId),
      },
    })
  }
  catch (err) {
    return jsonError(err)
  }
}
