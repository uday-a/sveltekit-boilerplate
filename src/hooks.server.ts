import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import * as Sentry from '@sentry/sveltekit'
import { PUBLIC_SENTRY_DSN } from '$env/static/public'
import { LOCALE_COOKIE_NAME, normalizeLocale } from '$lib/i18n'
import { getSession } from '$lib/server/session'

// Sentry server init — port of nuxt-boilerplate sentry.server.config.ts.
// Gated on PUBLIC_SENTRY_DSN: unset → never initialized, handleError
// degrades to console.error and `handle` skips the sentry wrapper below.
// DSN changes need a rebuild ($env/static is inlined at build time).
if (PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: PUBLIC_SENTRY_DSN,

    // 10% performance sampling — high enough to catch trends, low enough
    // that costs don't surprise you. Bump to 1.0 for the first week after
    // launch if you want to baseline.
    tracesSampleRate: 0.1,

    // v11's replacement for nuxt's removed `enableLogs: true` — mirrors
    // console.* to Sentry's Logs product (separate from issue events).
    integrations: [Sentry.consoleLoggingIntegration()],

    environment: process.env.NODE_ENV ?? 'development',
  })
}

// AXIOM FLUSH — why there is no logger.flush() call here: SvelteKit (and
// adapter-node) has no server shutdown/close hook — unlike Nitro, where a
// plugin can hook `close`. The Axiom SDK batches in-memory and flushes on
// its own interval, so steady-state logs ship without us. logger.flush()
// exists for manual use only: custom server.js wrappers (SIGTERM handlers)
// and tests. Do NOT flush per-request — it would defeat batching.

// Route protection (replaces nuxt `app/middleware/auth.ts` + `role.ts`).
//
// Why hooks instead of a (protected) route group: page workers create
// src/routes/dashboard/*, settings/*, etc. as top-level routes (matching
// nuxt's app/pages/* 1:1); a group would force every page file into a
// nested directory for zero benefit. The prefix list below is the single
// source of truth — one place to audit, impossible to forget on a page.
//
// Protected prefixes mirror the nuxt pages that declared
// `middleware: 'auth'`: dashboard/*, settings/*, projects/*,
// feedback/*, support/*, onboarding/*. Anonymous visitors bounce to
// /login?next=<path> (the login page validates `next` with
// safeRedirectPath before using it).
//
// Role meta: SvelteKit has no page-meta registry, so admin-only PATHS
// are listed in ADMIN_PATH_PREFIXES. Wrong-role visitors bounce to
// /dashboard?error=forbidden (same as nuxt's role middleware). This is
// UX-only polish — real enforcement is server-side requireRole().
// /admin/users and /admin/roles use this; API routes enforce via requireRole().

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/settings',
  '/projects',
  '/feedback',
  '/support',
  '/onboarding',
]

const ADMIN_PATH_PREFIXES = [
  '/admin',
]

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

// Sentry wraps this via `sequence(sentryHandle(), appHandle)` below (no-op
// when PUBLIC_SENTRY_DSN is unset) — append middleware to the sequence,
// don't replace appHandle.
const appHandle: Handle = async ({ event, resolve }) => {
  const session = await getSession(event.cookies)
  event.locals.session = session
  event.locals.user = session?.user ?? null
  event.locals.demo = session?.demo === true

  const pathname = event.url.pathname

  if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !event.locals.user) {
    const next = `${pathname}${event.url.search}`
    redirect(302, `/login?next=${encodeURIComponent(next)}`)
  }

  if (matchesPrefix(pathname, ADMIN_PATH_PREFIXES)) {
    const role = event.locals.user?.role
    if (!event.locals.user) {
      redirect(302, `/login?next=${encodeURIComponent(`${pathname}${event.url.search}`)}`)
    }
    if (role !== 'admin') {
      redirect(302, '/dashboard?error=forbidden')
    }
  }

  // Stamp <html lang> from the locale cookie (nuxt `no_prefix` port — the
  // URL carries no locale, the cookie does). transformPageChunk only runs
  // for HTML pages; API routes are untouched. SSR *strings* stay `en` (see
  // the tradeoff note in $lib/i18n) — this only fixes the lang attribute,
  // which is race-free unlike the message dictionary.
  const locale = normalizeLocale(event.cookies.get(LOCALE_COOKIE_NAME))
  return resolve(event, {
    transformPageChunk: ({ html }) =>
      locale === 'en' ? html : html.replace('<html lang="en">', `<html lang="${locale}">`),
  })
}

export const handle: Handle = PUBLIC_SENTRY_DSN
  ? sequence(Sentry.sentryHandle(), appHandle)
  : appHandle

const serverErrorHandler: HandleServerError = async ({ error, event }) => {
  console.error(`[server-error] ${event.url.pathname}`, error)
}

export const handleError = PUBLIC_SENTRY_DSN
  ? Sentry.handleErrorWithSentry(serverErrorHandler)
  : serverErrorHandler
