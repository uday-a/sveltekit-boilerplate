import type { RequestHandler } from './$types'
import { z } from 'zod'
import { env } from '$lib/server/env'
import { requireAuth } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { getPolar, productIdForPlan, type Plan } from '$lib/server/polar'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

// Create a Polar checkout session for the signed-in user.
// Returns the hosted-checkout URL — the client should redirect to it.
//
// Demo session is rejected; demo users shouldn't be reaching the
// real billing system. DEMO_MODE=false in any environment where
// you charge money.

const Body = z.object({
  plan: z.enum(['pro', 'team', 'enterprise']),
})

export const POST: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    if (session.demo === true) {
      throw apiError('FORBIDDEN', 'Demo sessions can\'t initiate checkout. Sign in with a real account.')
    }

    const parsed = Body.safeParse(await event.request.json())
    if (!parsed.success) {
      throw apiError('VALIDATION_FAILED', 'Invalid checkout payload', {
        issues: parsed.error.issues,
      })
    }

    const plan: Plan = parsed.data.plan
    const productId = productIdForPlan(plan)
    if (!productId) {
      throw apiError('VALIDATION_FAILED', `Plan '${plan}' has no POLAR_${plan.toUpperCase()}_PRODUCT_ID configured`)
    }

    const polar = await getPolar()
    if (!polar) {
      throw apiError('INTERNAL', 'Billing is not configured. Set POLAR_ACCESS_TOKEN + POLAR_WEBHOOK_SECRET.')
    }

    try {
      const checkout = await polar.checkouts.create({
        products: [productId],
        // After payment, Polar bounces the user here. We don't need any
        // post-checkout DB write — the webhook handles persistence. The
        // landing page reads /api/me/subscription to show the new plan.
        success_url: `${env.PUBLIC_SITE_URL}/settings/billing?status=success`,
        // Link the Polar customer to our user via external_customer_id.
        // Webhook events for this subscription will include this value
        // so we can resolve back to our row without a separate lookup.
        external_customer_id: String(session.user.id),
        customer_email: session.user.email ?? undefined,
        metadata: {
          userId: session.user.id,
          plan,
        },
      })

      logger.info('billing.checkout.created', { userId: session.user.id, plan, checkoutId: checkout.id })
      return jsonOk({ url: checkout.url })
    }
    catch (e) {
      logger.error('billing.checkout.failed', {
        userId: session.user.id,
        plan,
        error: (e as Error).message,
      })
      throw apiError('INTERNAL', 'Could not create checkout session. Try again, or contact support.')
    }
  }
  catch (err) {
    return jsonError(err)
  }
}
