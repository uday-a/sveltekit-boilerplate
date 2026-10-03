import { env, hasPolar } from './env'

// Polar SDK client. Lazy-imported per the boilerplate's gating
// convention: the @polar-sh/sdk module never enters V8 unless
// POLAR_ACCESS_TOKEN is set.
//
// Use via `await getPolar()` from any server route. Returns `null`
// when Polar isn't configured — callers should surface a friendly
// "billing not configured" message rather than crashing.
//
// SDK v1 notes (nuxt runs 0.49; this repo runs ^1.0.0 — verified against
// the installed SDK's migration guide + generated types):
//   - Versioned import: '@polar-sh/sdk/2026-10' (canonical per SDK README).
//     `createPolar()` factory replaces the `new Polar()` class.
//   - Client option `server:` → `environment:` ('sandbox' | 'production').
//   - Request/response fields are snake_case now (no auto-conversion):
//     external_customer_id, customer_email, success_url,
//     customer_portal_url. Service names stay camelCase
//     (checkouts, customerSessions).
//   - Webhooks moved to the versioned `webhooks` namespace and
//     validateEvent() is ASYNC — always await it. Verification errors
//     are `webhooks.PolarWebhookVerificationError`.
//   - Webhook payload data is snake_case too (customer_id, product_id,
//     current_period_end, cancel_at_period_end, canceled_at,
//     customer.external_id). The receiver normalises both casings.

export { hasPolar }

type PolarClient = {
  checkouts: {
    create(input: {
      products: string[]
      success_url?: string | null
      external_customer_id?: string | null
      customer_email?: string | null
      metadata?: Record<string, string | number | boolean>
    }): Promise<{ id: string, url: string }>
  }
  customerSessions: {
    create(input: { external_customer_id: string }): Promise<{ customer_portal_url: string }>
  }
}

let polarPromise: Promise<PolarClient | null> | null = null

export function getPolar(): Promise<PolarClient | null> {
  if (!hasPolar) return Promise.resolve(null)
  if (!polarPromise) {
    polarPromise = import('@polar-sh/sdk/2026-10').then(({ createPolar }) =>
      createPolar({
        accessToken: env.POLAR_ACCESS_TOKEN!,
        environment: env.POLAR_SERVER,
      }) as unknown as PolarClient,
    )
  }
  return polarPromise
}

// Map our internal plan keys to Polar product IDs. Edit this when
// adding plans — slot env vars then `productIdForPlan('foo')` lights
// it up everywhere (checkout, webhook routing, UI).
export type Plan = 'pro' | 'team' | 'enterprise'

export function productIdForPlan(plan: Plan): string | null {
  switch (plan) {
    case 'pro': return env.POLAR_PRO_PRODUCT_ID ?? null
    case 'team': return env.POLAR_TEAM_PRODUCT_ID ?? null
    case 'enterprise': return env.POLAR_ENTERPRISE_PRODUCT_ID ?? null
  }
}

// Inverse: given a product ID from a webhook, figure out which plan
// it represents. Returns null for unknown products (e.g. one-off line
// items that aren't on the subscription tier ladder).
export function planForProductId(productId: string): Plan | null {
  if (productId === env.POLAR_PRO_PRODUCT_ID) return 'pro'
  if (productId === env.POLAR_TEAM_PRODUCT_ID) return 'team'
  if (productId === env.POLAR_ENTERPRISE_PRODUCT_ID) return 'enterprise'
  return null
}

// ---------------------------------------------------------------------
// Webhooks. Single SDK boundary for the receiver at
// src/routes/api/webhooks/polar/+server.ts so the route never imports
// the SDK directly.
// ---------------------------------------------------------------------

export interface PolarWebhookEvent {
  type: string
  data: any
}

// Verify the raw request body against the webhook secret and return the
// typed payload. Throws webhooks.PolarWebhookVerificationError on a bad
// signature — the route maps that to 403 via isPolarSignatureError().
// Pure HMAC check, no network involved.
export async function validatePolarEvent(
  body: string | Uint8Array,
  headers: Record<string, string>,
): Promise<PolarWebhookEvent> {
  if (!env.POLAR_WEBHOOK_SECRET) {
    throw new Error('POLAR_WEBHOOK_SECRET is not configured')
  }
  const { webhooks } = await import('@polar-sh/sdk/2026-10')
  return await webhooks.validateEvent(body, headers, env.POLAR_WEBHOOK_SECRET) as unknown as PolarWebhookEvent
}

// instanceof check against the SDK's verification error class. Async only
// because the SDK module loads lazily — same cached import as above.
export async function isPolarSignatureError(e: unknown): Promise<boolean> {
  const { webhooks } = await import('@polar-sh/sdk/2026-10')
  return e instanceof webhooks.PolarWebhookVerificationError
}
