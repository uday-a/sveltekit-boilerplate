import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

// Centralized, zod-validated server-side env access. Import `env` from here
// instead of reading `process.env` directly so we get:
//   1. a single source of truth for which vars exist
//   2. fail-fast on boot if a required var is missing or malformed
//   3. typed access (no `string | undefined` noise at call sites)
//
// Optional vars stay optional — we still want the boilerplate to boot in
// "preview mode" without OAuth or a real database.
//
// Name mapping vs nuxt-boilerplate (NUXT_* → plain, NUXT_PUBLIC_* → PUBLIC_*):
//   NUXT_SESSION_PASSWORD → SESSION_PASSWORD
//   NUXT_OAUTH_GITHUB_*   → GITHUB_*
//   NUXT_PUBLIC_SITE_URL  → PUBLIC_SITE_URL
//   NUXT_INITIAL_ADMIN_LOGINS → INITIAL_ADMIN_LOGINS
//   NUXT_DEMO_MODE        → DEMO_MODE
//   NUXT_PUBLIC_SENTRY_DSN → PUBLIC_SENTRY_DSN
//   NUXT_PUBLIC_POSTHOG_* → PUBLIC_POSTHOG_*
//
// NOTE: we read `process.env` (not $env/static/private) deliberately —
// adapter-node populates process.env at runtime, and vitest can't resolve
// $env/* imports without the SvelteKit plugin. Server-only module: never
// import from client code.
//
// Vite does NOT populate process.env from `.env` files on its own (it only
// inlines them into $env/static/* and import.meta.env), so without the
// dotenv load below every server route fail-fasts in dev with
// "SESSION_PASSWORD ... received undefined" unless the var happens to be
// exported in the shell. dotenv never overrides real env vars and silently
// no-ops when no `.env` file exists (production hosts).
loadDotenv()

const Env = z.object({
  // Required: sealed-cookie session crypto. We surface a friendly message
  // at boot rather than letting iron-session fail cryptically later.
  SESSION_PASSWORD: z
    .string()
    .min(32, 'SESSION_PASSWORD must be at least 32 characters (e.g. `openssl rand -base64 32`)'),

  // GitHub OAuth — both keys must be set together, or neither.
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),

  // Postgres — optional. Without it the OAuth handler skips the user
  // upsert and the DB singleton stays uninitialized.
  DATABASE_URL: z.string().url().optional(),

  // Public site URL — used by emails and OAuth redirects.
  PUBLIC_SITE_URL: z.string().url().default('http://localhost:5173'),

  // Comma-separated GitHub logins bootstrapped as admins on first sign-in.
  INITIAL_ADMIN_LOGINS: z.string().optional(),

  // Axiom — optional structured log shipping. Without a token, the logger
  // util prints to console only and ships nothing.
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),
  AXIOM_ORG_ID: z.string().optional(),

  // Sentry — optional error monitoring. When DSN is unset, @sentry/sveltekit
  // is never initialized (see hooks.client.ts / hooks.server.ts). The auth
  // token is only required at build time for sourcemap upload — runtime
  // works without it.
  PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // PostHog — optional product analytics. Both env values are public by
  // design (PostHog's client SDK reads them in the browser). When the
  // key is unset, tracking no-ops and posthog-js is never initialized.
  PUBLIC_POSTHOG_KEY: z.string().optional(),
  PUBLIC_POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),

  // Resend — transactional email. Without a key the mailer no-ops:
  // it console-prints the rendered email so dev flows still work, but
  // nothing is sent. The from-address must be a verified domain on
  // Resend; for local dev `onboarding@resend.dev` is allowed.
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  EMAIL_FROM: z.string().email().default('onboarding@resend.dev'),
  // Where outbound app emails (feedback, ops alerts) should land.
  // Defaults to EMAIL_FROM so unconfigured prod doesn't ping randoms.
  EMAIL_OPS: z.string().email().optional(),

  // Polar — billing / checkout / subscriptions.
  // Without a token the SDK is never imported and all /api/billing/*
  // endpoints return INTERNAL with an instructive message.
  // Webhook secret pairs with the access token; we validate every
  // /api/webhooks/polar request with it. Boot fails if only one is set.
  // The product IDs are slot env vars — one per plan tier. Add more
  // (e.g. POLAR_ENTERPRISE_PRODUCT_ID) as your plans grow.
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  POLAR_SERVER: z.enum(['sandbox', 'production']).default('production'),
  POLAR_PRO_PRODUCT_ID: z.string().optional(),
  POLAR_TEAM_PRODUCT_ID: z.string().optional(),
  POLAR_ENTERPRISE_PRODUCT_ID: z.string().optional(),

  // Demo mode: lets the /login page mint a session for a fake user so a
  // fresh fork is fully clickable without a GitHub OAuth app or DB.
  //   - 'true'  → always on (even in prod — useful for public previews)
  //   - 'false' → always off (recommended for real production)
  //   - unset   → auto: on only when NODE_ENV is explicitly 'development'.
  //               See `isDemoMode`.
  DEMO_MODE: z.enum(['true', 'false']).optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Treat empty strings as unset: dotenv parses `FOO=` as `""`, and editors
// love leaving placeholder lines behind. Without this every empty optional
// var (GITHUB_CLIENT_ID=, DEMO_MODE=, ...) fails its zod validator and the
// server fail-fasts on a config that should mean "unconfigured".
function cleanEnv(input: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== '') out[key] = value
  }
  return out
}

const parsed = Env.safeParse(cleanEnv(process.env))
if (!parsed.success) {
  // Stderr + throw — SvelteKit logs the throw on startup and exits.
  console.error('\n❌ Invalid environment variables:\n')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  }
  console.error()
  throw new Error('Invalid environment. Fix the values above (see .env.example) and restart.')
}

export const env = parsed.data

// Convenience flag: paired OAuth credentials present?
export const hasGithubOAuth = Boolean(
  env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET,
)

// Convenience flag: Axiom shipping requires both a token AND a dataset.
// Either alone is a misconfiguration we'd rather fail loudly on.
export const hasAxiom = Boolean(env.AXIOM_TOKEN && env.AXIOM_DATASET)
if (env.AXIOM_TOKEN && !env.AXIOM_DATASET) {
  throw new Error('AXIOM_TOKEN is set but AXIOM_DATASET is not. Set both, or unset both.')
}
if (env.AXIOM_DATASET && !env.AXIOM_TOKEN) {
  throw new Error('AXIOM_DATASET is set but AXIOM_TOKEN is not. Set both, or unset both.')
}

// Convenience flag: Sentry is on when a DSN is set. Auth token is only
// consulted at build time for sourcemap upload — runtime sends events
// just fine without it.
export const hasSentry = Boolean(env.PUBLIC_SENTRY_DSN)

// Convenience flag: PostHog is on when a project key is set.
export const hasPostHog = Boolean(env.PUBLIC_POSTHOG_KEY)

// Convenience flag: Resend is on when an API key is set. The mailer
// otherwise console-prints emails instead of sending them.
export const hasResend = Boolean(env.RESEND_API_KEY)

// Convenience flag: Polar billing requires BOTH the API token AND the
// webhook secret (the webhook is the source of truth for subscription
// state — without it, we can't reliably know a payment succeeded). Boot
// fails if only one is set so misconfiguration surfaces immediately.
export const hasPolar = Boolean(env.POLAR_ACCESS_TOKEN && env.POLAR_WEBHOOK_SECRET)
if (env.POLAR_ACCESS_TOKEN && !env.POLAR_WEBHOOK_SECRET) {
  throw new Error('POLAR_ACCESS_TOKEN is set but POLAR_WEBHOOK_SECRET is not. Set both, or unset both.')
}
if (env.POLAR_WEBHOOK_SECRET && !env.POLAR_ACCESS_TOKEN) {
  throw new Error('POLAR_WEBHOOK_SECRET is set but POLAR_ACCESS_TOKEN is not. Set both, or unset both.')
}

// True only when NODE_ENV is EXPLICITLY 'development' (`vite dev` sets it).
// Reads the raw process.env value: the schema defaults NODE_ENV to
// 'development', but an unset NODE_ENV (a bare `node build` start) must be
// treated as production.
export const isDevelopment = process.env.NODE_ENV === 'development'

// Pure resolver so the rule is unit-testable without re-importing env.
//   flag 'true' → on, 'false' → off, unset → on only in development.
export function resolveDemoMode(flag: string | undefined, nodeEnv: string | undefined): boolean {
  return flag === 'true' || (flag !== 'false' && nodeEnv === 'development')
}

// Demo mode is ON only in explicit development and OFF otherwise (including
// unset NODE_ENV); set DEMO_MODE explicitly to override either way. A fresh
// `git clone` + `npm run dev` is fully clickable with no GitHub OAuth app or
// DB, while a production deploy stays locked down by default.
//
// SECURITY: while on, anyone who POSTs /auth/demo gets a logged-in session —
// a deliberate auth bypass. It is off outside development unless you set
// DEMO_MODE=true; only do that for throwaway public previews.
export function isDemoMode(): boolean {
  return resolveDemoMode(env.DEMO_MODE, process.env.NODE_ENV)
}
