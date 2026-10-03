import { eq } from 'drizzle-orm'
import { redirect, type RequestEvent } from '@sveltejs/kit'
import { OAuth2RequestError } from 'arctic'
import { useDb, schema } from '$lib/server/db'
import { ROLES, type Role } from '$lib/server/db/schema'
import { env } from '$lib/server/env'
import { logger } from '$lib/server/logger'
import { sendEmail, welcomeEmail } from '$lib/server/mailer'
import { getGitHub, fetchGitHubProfile, fetchGitHubPrimaryEmail, OAUTH_STATE_COOKIE, OAUTH_NEXT_COOKIE, type GitHubProfile } from '$lib/server/oauth'
import { setSession } from '$lib/server/session'
import { safeRedirectPath } from '$lib/utils'

// GitHub OAuth callback (arctic). Validates state, exchanges the code,
// upserts the user, sets the session, and 302s to `next` (default
// /dashboard). Any failure 302s to /login?error=oauth — browsers
// landing here from GitHub don't want JSON.
//
// Session id contract: unlike nuxt (which stored the raw GitHub id),
// we store the DB users.id so guards.ts can key its live-role lookup
// by users.id. Db-less dev falls back to the GitHub id — guards then
// fall back to the cookie role, same deal.

export async function GET(event: RequestEvent): Promise<never> {
  const next = safeRedirectPath(event.cookies.get(OAUTH_NEXT_COOKIE))

  const github = getGitHub()
  if (!github) redirect(302, '/login?error=oauth')

  const code = event.url.searchParams.get('code')
  const state = event.url.searchParams.get('state')
  const storedState = event.cookies.get(OAUTH_STATE_COOKIE)
  // Single-use: clear both round-trip cookies immediately.
  event.cookies.delete(OAUTH_STATE_COOKIE, { path: '/' })
  event.cookies.delete(OAUTH_NEXT_COOKIE, { path: '/' })

  if (!code || !state || !storedState || state !== storedState) {
    logger.warn('auth.github.bad_state')
    redirect(302, '/login?error=oauth')
  }

  let accessToken: string
  try {
    const tokens = await github.validateAuthorizationCode(code)
    accessToken = tokens.accessToken()
  }
  catch (e) {
    // OAuth2RequestError = GitHub rejected the code (expired, reused,
    // bad client secret). Anything else is transport-level.
    logger.error('auth.github.code_exchange_failed', {
      oauthError: e instanceof OAuth2RequestError ? e.code : undefined,
      error: (e as Error).message,
    })
    redirect(302, '/login?error=oauth')
  }

  let profile: GitHubProfile
  let primaryEmail: string | null
  try {
    profile = await fetchGitHubProfile(accessToken)
    primaryEmail = profile.email ?? await fetchGitHubPrimaryEmail(accessToken)
  }
  catch (e) {
    logger.error('auth.github.profile_failed', { error: (e as Error).message })
    redirect(302, '/login?error=oauth')
  }

  // Upsert the GitHub user into our local users table. Skips silently if
  // DATABASE_URL isn't configured yet so the OAuth flow still works in
  // a db-less dev setup.
  let role: Role = 'user'
  let sessionId: number = profile.id

  // Bootstrap admins: comma-separated list of GitHub logins that should
  // be created as 'admin' on FIRST sign-in. We deliberately do not touch
  // role on conflict — once the row exists the DB is the source of truth
  // (lets you demote without editing env, and prevents env drift across
  // environments from clobbering production roles).
  const bootstrapAdmins = (env.INITIAL_ADMIN_LOGINS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const initialRole: Role = bootstrapAdmins.includes(profile.login) ? 'admin' : 'user'

  // Track whether this signin is the user's first time so we can send
  // a welcome email exactly once (heuristic below — see nuxt source).
  let isFirstSignin = false

  // Email is NOT NULL on the users table (it's the unique identity).
  // A user without a public/verified email still slips through;
  // synthesize a stable fallback rather than failing the signin.
  // `<login>@users.noreply.github.com` is GitHub's own documented
  // no-reply address pattern.
  const userEmail = primaryEmail ?? `${profile.login}@users.noreply.github.com`

  try {
    const db = useDb()
    const returned = await db
      .insert(schema.users)
      .values({
        githubId: profile.id,
        login: profile.login,
        name: profile.name ?? profile.login,
        email: userEmail,
        avatarUrl: profile.avatar_url,
        role: initialRole,
      })
      .onConflictDoUpdate({
        target: schema.users.githubId,
        set: {
          login: profile.login,
          name: profile.name ?? profile.login,
          email: userEmail,
          avatarUrl: profile.avatar_url,
          updatedAt: new Date(),
          // role intentionally omitted — see bootstrap comment above.
        },
      })
      .returning({ createdAt: schema.users.createdAt, updatedAt: schema.users.updatedAt })

    // Heuristic: createdAt within 5s of now AND equal to updatedAt
    // means we just INSERTed (not UPDATEd via onConflict). Approximate
    // but cheap and avoids a separate query or raw `xmax` access.
    const row = returned[0]
    if (row) {
      const now = Date.now()
      const created = row.createdAt.getTime()
      const updated = row.updatedAt.getTime()
      isFirstSignin = (now - created) < 5000 && Math.abs(created - updated) < 1000
    }

    // Fetch the DB id + role so the session reflects any DB-side state.
    const dbUser = await db
      .select({ id: schema.users.id, role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.githubId, profile.id))
      .limit(1)
    if (dbUser[0]) sessionId = dbUser[0].id
    // Defensive: the DB enum and the TS Role union can drift if the
    // app code is redeployed before the migration that adds a new role.
    // Fall back to 'user' rather than trusting an unknown string.
    const dbRole = dbUser[0]?.role
    if (dbRole && (ROLES as readonly string[]).includes(dbRole)) {
      role = dbRole as Role
    }
  }
  catch (e) {
    logger.warn('auth.github.db_upsert_skipped', {
      login: profile.login,
      error: (e as Error).message,
    })
  }

  // Welcome email — fire-and-forget so a mailer failure doesn't fail
  // the OAuth flow. The DB doesn't have to be available; if `isFirstSignin`
  // never flipped true (db-less mode), we skip the email entirely so users
  // don't get welcomed on every signin in that mode.
  if (isFirstSignin && primaryEmail) {
    sendEmail(welcomeEmail({
      name: profile.name ?? profile.login,
      email: primaryEmail,
      siteUrl: env.PUBLIC_SITE_URL,
    })).catch((err) => {
      logger.warn('auth.github.welcome_send_failed', {
        login: profile.login,
        error: (err as Error).message,
      })
    })
  }

  await setSession(event.cookies, {
    user: {
      id: sessionId,
      login: profile.login,
      name: profile.name ?? profile.login,
      email: primaryEmail,
      avatar: profile.avatar_url,
      role,
    },
    loggedInAt: Date.now(),
  })
  logger.info('auth.github.signin', { login: profile.login, role })
  redirect(302, next)
}
