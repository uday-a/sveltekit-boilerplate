import { error, json, type RequestEvent } from '@sveltejs/kit'
import { isDemoMode } from '$lib/server/env'
import { logger } from '$lib/server/logger'
import { requireRateLimit } from '$lib/server/rate-limit'
import { setSession } from '$lib/server/session'

// Demo sign-in: mints a session for a deterministic fake user so a fresh
// fork is fully clickable without configuring GitHub OAuth or a DB. The
// route 404s when demo mode is off (see $lib/server/env.ts → isDemoMode).
//
// Production note: leaving this enabled in prod is intentional only when
// you want a public preview. Set DEMO_MODE=false to hard-disable.
export async function POST(event: RequestEvent) {
  try {
    requireRateLimit(event, { key: 'auth:demo' })
  }
  catch {
    return json(
      { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' } },
      { status: 429 },
    )
  }
  if (!isDemoMode()) {
    throw error(404, 'Not Found')
  }

  await setSession(event.cookies, {
    user: {
      id: 0,
      login: 'john.doe',
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: null,
      role: 'admin',
    },
    loggedInAt: Date.now(),
    demo: true,
  })

  logger.info('auth.demo.signin', { ip: event.getClientAddress() })
  return json({ ok: true })
}
