// Sentry browser init — port of nuxt-boilerplate sentry.client.config.ts.
//
// Gated on PUBLIC_SENTRY_DSN: unset → Sentry.init() never runs, no events
// leave the browser, and handleError degrades to console.error. (The
// @sentry/sveltekit import is static, so the SDK still ships in the client
// bundle when unconfigured — same tradeoff as nuxt's conditional module
// minus the build-time module exclusion. DSN changes need a rebuild:
// $env/static is inlined at build time.)

import * as Sentry from '@sentry/sveltekit'
import type { HandleClientError } from '@sveltejs/kit'
import { PUBLIC_SENTRY_DSN } from '$env/static/public'

if (PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: PUBLIC_SENTRY_DSN,

    // No `sendDefaultPii` in v11 — the SDK now collects request headers/IP
    // by default (see `dataCollection`, all-defaults-true). Nuxt's
    // `sendDefaultPii: true` is therefore already the behaviour; to lock
    // down for GDPR-tight launches, set `dataCollection` explicitly:
    // https://docs.sentry.io/platforms/javascript/configuration/options/#datacollection

    // 10% performance sampling; matches the server hook.
    tracesSampleRate: 0.1,

    // Session Replay: 10% of all sessions + 100% of sessions with an error.
    // Cheap insurance for reproducing bugs from real user reports.
    // consoleLoggingIntegration is v11's replacement for the removed
    // `enableLogs` flag (nuxt: "mirror console logs to Sentry's Logs
    // product"). Flip it off if you already pay for Axiom — avoids
    // double-billing the same lines.
    integrations: [Sentry.replayIntegration(), Sentry.consoleLoggingIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

const clientErrorHandler: HandleClientError = async ({ error }) => {
  console.error('[client-error]', error)
}

export const handleError = PUBLIC_SENTRY_DSN
  ? Sentry.handleErrorWithSentry(clientErrorHandler)
  : clientErrorHandler
