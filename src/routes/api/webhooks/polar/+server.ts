import type { RequestHandler } from './$types'
import { schema, useDb } from '$lib/server/db/index'
import { hasPolar } from '$lib/server/env'
import { logger } from '$lib/server/logger'
import { isPolarSignatureError, validatePolarEvent } from '$lib/server/polar'

// Polar webhook receiver. Hosts the source of truth for subscription
// state — we never write to subscriptions table from anywhere else.
// Port of nuxt-boilerplate server/api/webhooks/polar.post.ts.
//
// Key decisions:
//
// 1. Raw body. Signature verification hashes the exact bytes Polar
//    sent. `await event.request.arrayBuffer()` returns the untouched
//    bytes — it MUST run before any .json() parsing (which would
//    re-serialize and break the HMAC).
//
// 2. No envelope. Webhooks aren't called by our client — they're
//    called by Polar. Polar wants HTTP 2xx on success, 4xx on signature
//    failure, 5xx on anything else (it'll retry). Returning the
//    `{ ok, data }` envelope would be wasted bytes; bare status codes
//    are the contract.
//
// 3. Idempotent. Polar retries on 5xx. Every event we handle uses
//    upsert / onConflictDoUpdate so re-delivery is safe.
//
// 4. We resolve user-from-event via `external_customer_id` set at
//    checkout time. New event types added later need to match that
//    same convention (or fall back to looking up by customer.email).
//
// SDK v1 note: payload fields are snake_case (customer_id, product_id,
// current_period_end, cancel_at_period_end, canceled_at,
// customer.external_id). The mapping below reads snake_case first with
// camelCase fallbacks so older queued deliveries still upsert.

export const POST: RequestHandler = async (event) => {
  if (!hasPolar) {
    // No secret configured = no way to verify; refuse rather than
    // accept unsigned traffic.
    return new Response('Polar webhook secret not configured', { status: 503 })
  }

  // Raw bytes BEFORE any parsing — see decision 1 above.
  const rawBody = Buffer.from(await event.request.arrayBuffer())
  if (rawBody.length === 0) {
    return new Response('Missing body', { status: 400 })
  }

  let polarEvent: { type: string, data: any }
  try {
    polarEvent = await validatePolarEvent(rawBody, Object.fromEntries(event.request.headers.entries()))
  }
  catch (e) {
    if (await isPolarSignatureError(e)) {
      logger.warn('billing.webhook.invalid_signature')
      return new Response('Invalid signature', { status: 403 })
    }
    throw e
  }

  // Resolve our user from the event. Polar attaches our externalCustomerId
  // (set at checkout) to the customer record; it's the same on every event
  // for the customer's lifetime.
  const data = polarEvent.data
  const externalCustomerId = data?.customer?.external_id
    ?? data?.customer?.externalId
    ?? data?.external_customer_id
    ?? data?.customerExternalId
    ?? null
  const userId = externalCustomerId ? Number.parseInt(String(externalCustomerId), 10) : null

  // Subscription events: upsert our row.
  if (polarEvent.type.startsWith('subscription.')) {
    if (!userId || Number.isNaN(userId)) {
      // No mapping → log + 202 (we accept the event but can't act).
      // Returning a 5xx would make Polar retry forever.
      logger.warn('billing.webhook.no_external_customer_id', { type: polarEvent.type })
      return new Response('', { status: 202 })
    }

    const currentPeriodEnd = data.current_period_end ?? data.currentPeriodEnd ?? null
    const canceledAt = data.canceled_at ?? data.canceledAt ?? null
    try {
      const db = useDb()
      await db
        .insert(schema.subscriptions)
        .values({
          userId,
          polarCustomerId: data.customer_id ?? data.customerId,
          polarSubscriptionId: data.id,
          productId: data.product_id ?? data.productId,
          status: data.status,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
          cancelAtPeriodEnd: Boolean(data.cancel_at_period_end ?? data.cancelAtPeriodEnd),
          canceledAt: canceledAt ? new Date(canceledAt) : null,
        })
        .onConflictDoUpdate({
          target: schema.subscriptions.userId,
          set: {
            polarCustomerId: data.customer_id ?? data.customerId,
            polarSubscriptionId: data.id,
            productId: data.product_id ?? data.productId,
            status: data.status,
            currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
            cancelAtPeriodEnd: Boolean(data.cancel_at_period_end ?? data.cancelAtPeriodEnd),
            canceledAt: canceledAt ? new Date(canceledAt) : null,
            updatedAt: new Date(),
          },
        })

      logger.info('billing.webhook.subscription_upserted', {
        type: polarEvent.type,
        userId,
        status: data.status,
        productId: data.product_id ?? data.productId,
      })
    }
    catch (e) {
      // 5xx → Polar retries with exponential backoff. Most retry storms
      // come from a missing migrations table; the operator sees the
      // error and runs `npx drizzle-kit migrate`.
      logger.error('billing.webhook.db_upsert_failed', {
        type: polarEvent.type,
        userId,
        error: (e as Error).message,
      })
      return new Response('DB error', { status: 500 })
    }
  }
  else {
    // Other event types (order.*, customer.*, etc.) — log but don't act.
    // Add a case here when you need to react to one of them.
    logger.info('billing.webhook.ignored', { type: polarEvent.type })
  }

  return new Response('', { status: 202 })
}
