# SvelteKit SaaS Boilerplate — Svelte 5, TypeScript, Tailwind CSS 4

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
![SvelteKit 2](https://img.shields.io/badge/SvelteKit-2-ff3e00?logo=svelte&logoColor=white)
![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)

A production-grade **SvelteKit SaaS boilerplate / starter kit** built with **SvelteKit 2, Svelte 5 (runes), TypeScript and Tailwind CSS 4**, on the shadcn-svelte-compatible [**`@uipkge`**](https://uipkge.dev/svelte/components) UI registry. It ships GitHub OAuth + magic-link authentication, Polar billing, a Drizzle ORM + Postgres schema, an admin area with role-based access control (RBAC), team invites, API keys, an audit log, i18n with svelte-i18n, Sentry / PostHog / Axiom wiring, and a full dashboard (charts, kanban, data table, calendar, map). **Every external integration is gated on env**, so a fresh clone runs in demo mode with no database, OAuth app or API keys.

**Live demo: coming soon** · **[Vue/Nuxt sibling: nuxt-boilerplate](https://github.com/uday-a/nuxt-boilerplate)** · **[React/Next.js sibling: next-boilerplate](https://github.com/uday-a/next-boilerplate)** · **[UI registry: uipkge.dev](https://uipkge.dev)**

- **Auth:** GitHub OAuth, passwordless magic links, demo sign-in, sealed `iron-session` cookies, team invites by token
- **Billing:** Polar checkout, customer portal and signature-verified subscription webhooks
- **Database:** Drizzle ORM + Postgres — users, projects, subscriptions, magic-link tokens, API keys, audit log, invites
- **Admin & RBAC:** `admin` / `editor` / `user` roles enforced server-side with a live DB role check, admin user list, permission-matrix UI
- **Dashboard:** KPIs, ECharts charts, Leaflet map, kanban, data table, calendar, messages, activity heatmap, first-run product tour
- **i18n:** svelte-i18n (English + Spanish), cookie-based locale, no locale-prefixed URLs
- **DX:** zod-validated env, typed `{ ok, data | error }` API envelope, structured logging, Vitest + Playwright, `svelte-check`

> ### Powered by [UIPKGE](https://uipkge.dev)
>
> Every UI element, block and chart in this repo comes from the **`@uipkge`** Svelte registry — a shadcn-svelte-compatible distribution built on [Bits UI](https://bits-ui.com) that covers the whole shape of a SaaS app:
>
> - **Auth UI** — sign-in, sign-up, password reset (magic link), MFA code entry
> - **Marketing UI** — header, hero, logos, features, bento grid, testimonials, pricing, FAQ, CTA, contact, footer
> - **Dashboard UI** — collapsible sidebar, breadcrumbs, command palette, notifications popover, theme customizer, locale switcher, product tour, kanban, stat tiles, usage bars
> - **Charts** — area, bar, line, funnel, gauge, treemap, calendar heatmap, sparkline, raw ECharts (themed for light + dark)
> - **Forms** — TanStack Svelte Form + zod field components
> - **Rich text** — Tiptap editor with links, placeholders, task lists, text-align, underline
> - **Elements** — button, dialog, sheet, command, popover, tooltip, context menu, date/range calendar, pin input, file upload, slider, Leaflet map, …
>
> Same design tokens, same theming, same Tailwind CSS 4 setup as the Vue and React registries. One CLI command:
>
> ```bash
> npx shadcn-svelte@latest add https://uipkge.dev/r/svelte/<name>.json
> ```
>
> The source is copied into your project — fully owned, fully editable, no runtime dependency. [Browse the Svelte catalog →](https://uipkge.dev/svelte/components) · [Jump to the UIPKGE section ↓](#uipkge-ui-registry)

---

## Quick start

```bash
git clone https://github.com/uday-a/sveltekit-boilerplate my-app
cd my-app
npm install
cp .env.example .env
# SESSION_PASSWORD is the only required var (32+ chars) — paste the output of:
openssl rand -base64 32
npm run dev
# → http://localhost:5173
# → http://localhost:5173/login  (Continue as demo user)
```

Demo mode is **auto-on only in local development** (`NODE_ENV=development`, which `npm run dev` sets), so `/login` shows **Continue as demo user** with no further config. Everywhere else it is off unless you set `DEMO_MODE=true` explicitly (public demos only — see [Deployment](#deployment)); `DEMO_MODE=false` turns it off even in dev.

### Routes

| Area | Path | Notes |
|------|------|-------|
| Landing | `/` | Marketing blocks (header, hero, logos, features, bento, testimonials, pricing, FAQ, CTA, contact, footer) |
| Pricing | `/pricing` | Plan cards → Polar checkout (sends anonymous visitors to `/login?next=/pricing`) |
| Terms / Privacy | `/terms`, `/privacy` | Legal page shells |
| Sign in | `/login` | GitHub OAuth, magic-link form, demo sign-in |
| Sign up | `/sign-up` | GitHub OAuth only — the email/password form shows a "not wired" notice |
| Forgot password | `/forgot-password` | Sends a magic link (there is no password auth) |
| MFA | `/mfa` | 6-digit code UI — **mock only**, the code is not verified |
| Invite | `/invite/[token]` | Preview + accept a team invite |
| Onboarding | `/onboarding` | Multi-step stepper — **UI only**, nothing is persisted |
| Dashboard | `/dashboard` | KPIs, charts, Leaflet map, date-range filter, 8-step first-run tour |
| Messages | `/dashboard/messages` | Inbox / thread UI (sample data) |
| Kanban | `/dashboard/kanban` | Registry kanban board (sample data, client-side) |
| Customers | `/dashboard/data-table` | Data table with sort, filters, row selection, pagination (sample data) |
| Calendar | `/dashboard/calendar` | Month grid, context menus, event dialog (sample data) |
| Activity | `/dashboard/activity` | Activity heatmap + month grid (deterministic mock data) |
| Locations | `/dashboard/locations` | Office directory on a Leaflet map with filters (sample data) |
| UI kit | `/dashboard/ui-kit` | Installed primitives on one page, incl. the Tiptap editor |
| Forms | `/dashboard/forms`, `/dashboard/form-example` | Form controls + TanStack Svelte Form / zod reference |
| Projects | `/projects`, `/projects/[slug]` | CRUD backed by `/api/projects` (DB, or sample projects in demo mode) |
| Feedback / Support | `/feedback`, `/support` | Feedback form (emails ops via `/api/feedback`) + static help center |
| Settings | `/settings` + `/settings/*` | Hub page plus general, account, security, notifications, billing, team, api-keys, activity, integrations, limits |
| Admin | `/admin/users`, `/admin/roles` | Admin-only user list, RBAC permission matrix |

`/dashboard`, `/settings`, `/projects`, `/feedback`, `/support` and `/onboarding` (and everything under them) are protected in `src/hooks.server.ts`, which redirects anonymous visitors to `/login?next=…`. `/admin/*` additionally requires `role = admin` and bounces everyone else to `/dashboard?error=forbidden`.

Settings pages that talk to the backend: **general** and **account** (`/api/me/profile`), **team** (`/api/team/*`), **api-keys** (`/api/keys`), **activity** (`/api/activity`) and **billing** (`/api/me/subscription`, `/api/billing/portal`). **security, notifications, integrations and limits are UI only.**

---

## Features

### Developer experience

- **SvelteKit 2** + **Svelte 5** runes (`$state`, `$derived`, `.svelte.ts` stores) + **TypeScript**
- **Vite** dev server, `adapter-vercel` on Vercel / `adapter-node` elsewhere
- **zod-validated env** at boot (`src/lib/server/env.ts`) — empty values count as unset; invalid or half-configured integrations (Polar token without webhook secret, Axiom token without dataset) fail loud
- **`components.json`** pre-wired for the `@uipkge` Svelte registry
- **ESLint 9** (`eslint-plugin-svelte`, `@stylistic`), **`svelte-check`** typecheck, **Vitest** unit tests, **Playwright** end-to-end tests

### Frontend

- **Tailwind CSS 4** with UIPKGE OKLCH design tokens (`src/app.css`)
- **Dark mode** — light / dark / system, stored in the `uipkge-theme` cookie and applied by an inline script in `src/app.html` before first paint (no flash)
- **Theme customizer** — 13 accent color themes (`src/lib/color-themes.ts`)
- **Command palette** — ⌘K / Ctrl K in the dashboard shell
- **Onboarding tour** — 8-step first-run tour on `/dashboard`, shown once per browser (`localStorage` flag), replayable
- **Notifications popover**, breadcrumbs, collapsible sidebar, team switcher, demo-data banners
- **Bits UI** primitives, **@lucide/svelte** icons, **svelte-sonner** toasts
- **TanStack Svelte Form** + zod, **ECharts**, **Tiptap**, **Leaflet**

### Backend (`+server.ts` handlers)

- **Typed API envelope** — routes return `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }` (`src/lib/server/response.ts`, client helper `src/lib/api.ts`)
- **Structured error codes** — `UNAUTHORIZED`, `SESSION_INVALID`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `INTERNAL`
- **`requireAuth()` / `requireRole()` / `requirePublic()`** guards (`src/lib/server/guards.ts`)
- **Rate limiting** — in-memory sliding window per IP (30 req/min default) on demo sign-in, magic link, team invites and API-key creation (`src/lib/server/rate-limit.ts`)
- **Audit log** — append-only `audit_logs` table written by `recordAudit()` for `api_keys.create`, `api_keys.revoke`, `team.invite`, `team.accept` and `team.revoke`; surfaced at `/settings/activity`
- **API keys** — create / list / revoke at `/settings/api-keys`; SHA-256 hashed, shown once, prefixed `uipkge_`, scoped. A `verifyApiKey()` helper is included but **not yet wired into any route**
- **Structured logger** — dot-namespaced events (`auth.demo.signin`, `billing.webhook.ignored`, …) via consola, optional Axiom shipping (`src/lib/server/logger.ts`)
- **Open-redirect-safe** `?next=` handling after sign-in (`safeRedirectPath` in `src/lib/utils.ts`)

#### API routes

| Route | Methods | Guard |
|---|---|---|
| `/api/ping` | GET | public |
| `/api/me`, `/api/me/profile` | GET, GET/PUT | signed in |
| `/api/me/subscription` | GET | signed in |
| `/api/projects`, `/api/projects/[slug]` | GET/POST, GET/PUT/DELETE | signed in |
| `/api/keys`, `/api/keys/[id]` | GET/POST, DELETE | signed in |
| `/api/team/members` | GET | signed in |
| `/api/team/invites` | GET/POST | admin or editor |
| `/api/team/invites/[param]` | GET (token preview), POST (accept), DELETE (revoke by id) | public / signed in / admin or editor |
| `/api/activity` | GET | signed in |
| `/api/feedback` | POST | signed in |
| `/api/billing/checkout`, `/api/billing/portal` | POST | signed in (demo sessions rejected) |
| `/api/admin/users` | GET | admin |
| `/api/protected/stats` | GET | admin or editor (example route, static numbers) |
| `/api/webhooks/polar` | POST | Polar signature |

## Authentication

- **GitHub OAuth** — `GET /auth/github` → `/auth/github/callback` via [arctic](https://arcticjs.dev) (GitHub is the only wired OAuth provider). The callback upserts the user when `DATABASE_URL` is set and sends a welcome email on first sign-in
- **Magic link** — `POST /auth/magic-link` emails a single-use, SHA-256-hashed token with a 15-minute TTL; `GET /auth/magic-link?token=…` verifies it. **Requires `DATABASE_URL`** (Resend optional — without it the email, link included, is printed to the server log)
- **Demo sign-in** — `POST /auth/demo` mints a session for a fake **admin** user (John Doe); returns 404 when demo mode is off
- **Sessions** — `iron-session` sealed cookie `sk-session` (httpOnly, `SameSite=Lax`, `Secure` in production), 7-day TTL, sealed with `SESSION_PASSWORD`
- **Sign out** — `GET` or `POST /auth/logout`
- **Route protection** — prefix list in `src/hooks.server.ts` (single source of truth) → `/login?next=…`
- **Team invites** — admins/editors invite by email + role; hashed token, 7-day TTL, single-use, accepted at `/invite/[token]`
- **Admin bootstrap** — `INITIAL_ADMIN_LOGINS` lists GitHub usernames created as `role='admin'` on their **first** sign-in; after that the DB is the source of truth

> **Security:** demo mode is a deliberate auth bypass — anyone can `POST /auth/demo` and get an admin session. It is auto-on only when `NODE_ENV=development` and off everywhere else (production, preview, test, or `NODE_ENV` unset); only set `DEMO_MODE=true` on a deployment that is meant to be a public demo.
>
> The Nuxt sibling wires 44 OAuth providers; this repo wires GitHub only. MFA, the sign-up email form and the onboarding stepper are UI screens, not enforced flows.

## Admin & RBAC

- `user_role` Postgres enum: `user`, `admin`, `editor`
- **`requireRole()` re-reads the role from the database on every call**, so a demotion takes effect immediately instead of waiting for the 7-day cookie to expire. A deleted user gets `401 SESSION_INVALID`; if the DB is unreachable it falls back to the cookie role and logs a warning
- Server-side enforcement — `/api/admin/users` (admin only), team invites (admin or editor), `/api/protected/stats` (admin or editor example)
- `/admin/*` page gate in `hooks.server.ts` + `src/routes/admin/+layout.server.ts` (UX redirect; the API guards are the real enforcement)
- `/admin/users` — admin user list (DB rows, or a sample list for demo sessions / no DB)
- `/admin/roles` — permission-matrix UI (owner / admin / editor / viewer / billing) backed by **mock data** in `src/lib/rbac.ts`, session-only — not connected to the `user_role` enum

## Database

- **Drizzle ORM** + **`postgres`** driver, lazy singleton (`src/lib/server/db/index.ts`)
- Works with Neon, Supabase (pooler — `prepare: false` is set), Railway, RDS or local Postgres
- Schema (`src/lib/server/db/schema.ts`): `users`, `projects`, `subscriptions`, `magic_link_tokens`, `api_keys`, `audit_logs`, `invites`
- Migrations in `./drizzle` (`drizzle.config.ts`):

  ```bash
  # Set DATABASE_URL in .env first, then:
  npx drizzle-kit generate   # after editing schema.ts
  npx drizzle-kit migrate    # apply against DATABASE_URL
  ```

- Without `DATABASE_URL`: demo sessions and GitHub sign-in still work (no user upsert); demo sessions get sample projects, API keys and team members instead of DB rows; magic links, invites and persistence are unavailable

## Billing

Polar.sh (`@polar-sh/sdk`, `src/lib/server/polar.ts` — the SDK is only imported when configured):

- **Checkout** — `POST /api/billing/checkout` with plan `pro` / `team` / `enterprise` → `POLAR_*_PRODUCT_ID`
- **Customer portal** — `POST /api/billing/portal`
- **Subscription status** — `GET /api/me/subscription`, shown at `/settings/billing`
- **Webhook** — `POST /api/webhooks/polar`, signature-verified with `POLAR_WEBHOOK_SECRET`, upserts `subscription.*` events into `subscriptions`
- `POLAR_SERVER=sandbox` for test checkouts (the code defaults to `production` when unset; `.env.example` ships `sandbox`)
- Demo sessions can't start checkout and always see "no subscription"

## Email

Resend (`src/lib/server/mailer.ts`): welcome, magic-link, team-invite and feedback emails as inline-HTML templates. Without `RESEND_API_KEY`, emails are printed to the server log instead of sent. Feedback goes to `EMAIL_OPS` (falls back to `EMAIL_FROM`, which defaults to `onboarding@resend.dev`).

## i18n

- **svelte-i18n** with English and Spanish (`src/lib/i18n/en.json`, `es.json`); `i18n.test.ts` keeps the key sets identical
- Single-URL strategy — locale stored in the `uipkge-locale` cookie, no locale-prefixed routes; switch via the locale switcher in the dashboard header
- The server stamps `<html lang>` from the cookie; **SSR strings render in English** and switch on the client (svelte-i18n's store is module-global, so per-request SSR locales would race under adapter-node — see `src/lib/i18n/index.ts`)
- Usage: `import { t, locale, setLocale } from '$lib/i18n'`, then `$t('auth.signIn.title')` in templates
- Adding a locale: new JSON file + `Locale` member + `locales[]` entry + extend `normalizeLocale()`
- No over-the-air translations: the Nuxt sibling's `@i18now/nuxt` has no Svelte SDK, so this repo serves local JSON only

## Observability & analytics

- **Sentry** — `@sentry/sveltekit` initialised in `src/hooks.client.ts` + `src/hooks.server.ts` when `PUBLIC_SENTRY_DSN` is set (traces 10%, replay 10% of sessions / 100% on error). No `@sentry/vite-plugin` yet, so **no sourcemap upload** — `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` are validated but unused
- **PostHog** — `posthog-js` dynamically imported only when `PUBLIC_POSTHOG_KEY` is set; manual `$pageview` on navigation, autocapture limited to click / submit / change, `data-private` elements ignored (`src/lib/posthog.ts`)
- **Axiom** — structured log shipping when `AXIOM_TOKEN` + `AXIOM_DATASET` are set. SvelteKit has no server-shutdown hook, so the SDK's interval flush is relied on; `logger.flush()` is for custom server wrappers and tests

---

## UIPKGE UI registry

This boilerplate is wired to the [**`@uipkge`**](https://uipkge.dev/svelte/setup) Svelte registry. Items install with the shadcn-svelte CLI and land under `src/lib/components/` — fully owned, fully editable. The repo ships **55 UI primitives** (`src/lib/components/ui/`) and **29 blocks** (`src/lib/components/blocks/`).

```bash
npx shadcn-svelte@latest add https://uipkge.dev/r/svelte/button.json
npx shadcn-svelte@latest add https://uipkge.dev/r/svelte/kanban-task-board.json
```

Already configured in [`components.json`](./components.json):

```json
{
  "registries": {
    "@uipkge": "https://uipkge.dev/r/svelte/{name}.json"
  }
}
```

Browse the catalog at **[uipkge.dev/svelte/components](https://uipkge.dev/svelte/components)** · the Vue sibling uses [uipkge.dev/vue/components](https://uipkge.dev/vue/components), the React sibling [uipkge.dev/react/components](https://uipkge.dev/react/components).

---

## Tech stack

| Layer | Library |
|---|---|
| Framework | [SvelteKit 2](https://svelte.dev/docs/kit), [Svelte 5](https://svelte.dev), TypeScript, Vite, `adapter-vercel` / `adapter-node` |
| Auth | [iron-session](https://github.com/vvo/iron-session) + [arctic](https://arcticjs.dev) GitHub OAuth + magic links |
| ORM / DB | [Drizzle ORM](https://orm.drizzle.team) + [postgres](https://github.com/porsager/postgres) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com), tw-animate-css |
| Components | shadcn-svelte-compatible [`@uipkge`](https://uipkge.dev) on [Bits UI](https://bits-ui.com) |
| Forms | [TanStack Svelte Form](https://tanstack.com/form) + [Zod](https://zod.dev) |
| Editor | [Tiptap](https://tiptap.dev) |
| Charts | [ECharts](https://echarts.apache.org) |
| Maps | [Leaflet](https://leafletjs.com) |
| i18n | [svelte-i18n](https://github.com/kaisermann/svelte-i18n) |
| Icons / toasts | [@lucide/svelte](https://lucide.dev), [svelte-sonner](https://github.com/wobsoriano/svelte-sonner) |
| Billing | [Polar.sh](https://polar.sh) |
| Email | [Resend](https://resend.com) |
| Errors / logs / analytics | [Sentry](https://sentry.io), [Axiom](https://axiom.co), [PostHog](https://posthog.com) |
| Testing | [Vitest](https://vitest.dev), [Playwright](https://playwright.dev), [svelte-check](https://github.com/sveltejs/language-tools) |

---

## Requirements

- **Node 22+** (developed on 24)
- **npm** (lockfile is `package-lock.json`)
- *Optional:* a Postgres URL — needed for persistence, magic links and team invites

---

## Getting started

### 1. Clone + install

```bash
git clone https://github.com/uday-a/sveltekit-boilerplate my-app
cd my-app
npm install
```

### 2. Environment

```bash
cp .env.example .env
# then set SESSION_PASSWORD in .env to the output of:
openssl rand -base64 32
```

Only `SESSION_PASSWORD` is required (32+ chars). Everything else is optional — see the matrix below. Empty values (`FOO=`) are treated as unset.

### 3. Database (optional)

```bash
# Set DATABASE_URL in .env first, then:
npx drizzle-kit migrate
```

### 4. Run

```bash
npm run dev        # http://localhost:5173
npm run build      # production build → ./build
npm run preview    # preview the production build
```

Open **[http://localhost:5173/login](http://localhost:5173/login)** → **Continue as demo user**.

---

## Project structure

```
.
├── src/
│   ├── routes/
│   │   ├── +page.svelte         # landing (marketing blocks)
│   │   ├── login, sign-up, forgot-password, mfa, invite/[token], onboarding, pricing, terms, privacy
│   │   ├── dashboard/           # dashboard + activity, calendar, data-table, forms, form-example, kanban, locations, messages, ui-kit
│   │   ├── projects/, settings/, admin/, feedback/, support/
│   │   ├── auth/                # github (+ callback), magic-link, demo, logout
│   │   └── api/                 # me, projects, keys, team, activity, admin, billing, feedback, ping, protected, webhooks/polar
│   ├── lib/
│   │   ├── components/ui/       # @uipkge primitives + charts + leaflet-map
│   │   ├── components/blocks/   # @uipkge blocks (Header01, Hero01, CommandPalette, Tour, kanban-task-board, …)
│   │   ├── server/              # env, session, oauth, guards, rate-limit, audit, api-keys, tokens, logger, mailer, polar, response
│   │   ├── server/db/           # Drizzle schema + client
│   │   ├── i18n/                # svelte-i18n setup, en.json, es.json
│   │   └── …                    # theme + color-theme stores, posthog, api client, mock data
│   ├── hooks.server.ts          # session, route protection, <html lang>, Sentry
│   ├── hooks.client.ts          # Sentry (browser)
│   └── app.html                 # anti-FOUC theme script
├── drizzle/                     # SQL migrations
├── e2e/                         # Playwright specs
├── components.json              # shadcn-svelte CLI + @uipkge registry
└── .env.example
```

---

## Graceful degradation matrix

| Env var(s) | Unset | Set |
|---|---|---|
| `SESSION_PASSWORD` | **Boot fails** — required (32+ chars) | Sessions sealed |
| `DEMO_MODE` | Auto: on only when `NODE_ENV=development` | `true` forces demo sign-in on, `false` forces it off |
| `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` | GitHub sign-in unavailable | GitHub OAuth |
| `INITIAL_ADMIN_LOGINS` | Nobody auto-promoted | Listed GitHub logins created as admins on first sign-in |
| `DATABASE_URL` | Demo sessions use sample data; magic links, invites and persistence unavailable | Drizzle persistence |
| `RESEND_API_KEY` (+ `EMAIL_FROM`, `EMAIL_OPS`) | Emails printed to the server log | Real delivery |
| `POLAR_ACCESS_TOKEN` + `POLAR_WEBHOOK_SECRET` (+ `POLAR_*_PRODUCT_ID`, `POLAR_SERVER`) | Billing routes return an instructive error | Checkout, portal, webhooks |
| `AXIOM_TOKEN` + `AXIOM_DATASET` (+ `AXIOM_ORG_ID`) | Logs to stdout only | Logs shipped to Axiom |
| `PUBLIC_POSTHOG_KEY` (+ `PUBLIC_POSTHOG_HOST`) | No analytics; `posthog-js` never loaded | PostHog page views + autocapture |
| `PUBLIC_SENTRY_DSN` | Errors go to `console.error` | Sentry errors, traces, replay (inlined at build time — needs a rebuild) |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | — | Validated only; sourcemap upload not wired |
| `PUBLIC_SITE_URL` | `http://localhost:5173` | OAuth callback + email links |

Half-configured pairs (Polar token without webhook secret, Axiom token without dataset, or vice versa) fail at boot.

---

## API conventions

```ts
// src/routes/api/projects/+server.ts (simplified)
export const GET: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)
    return jsonOk({ projects: await listProjects(session.user.id) })
  }
  catch (err) {
    return jsonError(err) // ApiError → { ok: false, error } with the right status
  }
}
```

```ts
// success
{ ok: true, data: T }
// failure
{ ok: false, error: { code, message, details? } }
```

On the client, `apiFetch()` (`src/lib/api.ts`) returns the same `ApiResponse<T>` union.

---

## Testing

```bash
npm test             # Vitest unit tests (14 files: server utils, schema, i18n, posthog, polar webhook, …)
npm run test:watch   # Vitest watch mode
npm run typecheck    # svelte-kit sync + svelte-check
npm run lint         # ESLint
npm run test:e2e     # Playwright (starts `vite dev` on :5173 unless BASE_URL is set)
```

Playwright needs a browser once: `npx playwright install --with-deps chromium`.

> The e2e suite is a single smoke spec (`e2e/smoke.spec.ts`) that loads the landing page and checks its title and hero heading. Unit tests are the meaningful coverage today.

---

## Deployment

`svelte.config.js` picks the adapter at build time: on Vercel (which sets `VERCEL=1` during its build) it uses `@sveltejs/adapter-vercel` (Node 22 serverless functions); everywhere else `npm run build` emits a standalone `adapter-node` server.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/uday-a/sveltekit-boilerplate&env=SESSION_PASSWORD,PUBLIC_SITE_URL,DEMO_MODE&envDescription=SESSION_PASSWORD%3A%20openssl%20rand%20-base64%2032.%20PUBLIC_SITE_URL%3A%20your%20deployment%20URL.%20DEMO_MODE%3A%20true%20only%20for%20a%20public%20demo%20(demo%20sessions%20are%20admin)%2C%20otherwise%20false.&project-name=sveltekit-boilerplate&repository-name=sveltekit-boilerplate)

1. **Add New → Project** in the Vercel dashboard and import the repo. The SvelteKit framework preset is auto-detected; keep the default build command and output.
2. Set environment variables (Project → Settings → Environment Variables):

   | Variable | Required | Value |
   | --- | --- | --- |
   | `SESSION_PASSWORD` | yes | 32+ random chars — `openssl rand -base64 32` |
   | `PUBLIC_SITE_URL` | yes | your deployment URL, e.g. `https://your-app.vercel.app` (used by OAuth redirects and emails; defaults to localhost) |
   | `DEMO_MODE` | for a public demo | `true` to enable demo sign-in (see the warning below); leave unset or `false` otherwise |
   | `DATABASE_URL`, `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`, `RESEND_API_KEY`, `POLAR_*`, `AXIOM_*`, `PUBLIC_SENTRY_DSN`, `PUBLIC_POSTHOG_*` | optional | see `.env.example` — each integration stays off until its vars are set |

   `PUBLIC_SENTRY_DSN` and `PUBLIC_POSTHOG_*` are inlined at build time, so redeploy after changing them.
3. Deploy. Vercel sets `NODE_ENV=production`, so session cookies are `secure` and demo mode is off unless `DEMO_MODE=true`.

Serverless caveats:

- **Rate limits** (`src/lib/server/rate-limit.ts`) are in-memory per function instance — they reset on cold starts and are not shared between instances. Swap in a shared store (e.g. Upstash Redis) if you need a real limit.
- **Database**: use a pooled connection string (Neon pooled URL, Supabase transaction pooler on port 6543). The `postgres` driver already runs with `prepare: false`, which poolers require.
- **Axiom** batches logs in memory and flushes on an interval; a function can freeze before that flush, so some log lines may be dropped.
- The app never writes to the file system, so the read-only serverless FS is not an issue.

### Self-hosting (Node)

A plain build produces a standalone Node server — deploy it anywhere that runs Node (Docker, Fly.io, Railway, Render, a VPS):

```bash
npm ci
npm run build
NODE_ENV=production PORT=3000 ORIGIN=https://your-domain.com node build
```

`PUBLIC_*` variables are read through `$env/static/public`, so they are **inlined at build time** — set them before `npm run build`. Server-only variables are read from `process.env` at runtime. `ORIGIN` (or `PROTOCOL_HEADER` / `HOST_HEADER` behind a proxy) lets SvelteKit's CSRF check accept same-origin form posts; see the [adapter-node docs](https://svelte.dev/docs/kit/adapter-node).

For Netlify or Cloudflare, swap the adapter in `svelte.config.js` for the matching one.

> **`DEMO_MODE` — read before deploying.** Demo sign-in (`POST /auth/demo`) creates an **ADMIN** session for anyone who asks. It is auto-on **only in local development** (`NODE_ENV=development`); every deployed environment (production, preview, staging) has it off by default. To offer a public demo, set `DEMO_MODE=true` **explicitly** on that deployment. Otherwise leave it unset or set `DEMO_MODE=false`.

### Production checklist

- [ ] Generate a fresh `SESSION_PASSWORD` (never reuse dev).
- [ ] Set `PUBLIC_SITE_URL` to your real domain (and `ORIGIN` for adapter-node).
- [ ] Leave `DEMO_MODE` unset (or `false`) unless this deployment is meant to be a public demo.
- [ ] Register the OAuth callback: `https://<host>/auth/github/callback`.
- [ ] Register the Polar webhook: `https://<host>/api/webhooks/polar`, and set `POLAR_SERVER=production`.
- [ ] Run `npx drizzle-kit migrate` against the production `DATABASE_URL`.
- [ ] Note: rate limits are in-memory per process (per function instance on Vercel) — swap in a shared store if you run multiple instances.

---

## Parity with [nuxt-boilerplate](https://github.com/uday-a/nuxt-boilerplate)

This is the Svelte/SvelteKit sibling of the Nuxt 4 SaaS starter (and of [next-boilerplate](https://github.com/uday-a/next-boilerplate)): same registry-driven UI, same demo sign-in on `/login`, same API envelope, same dashboard routes and translation keys.

| | Nuxt | Next.js | SvelteKit (this repo) |
|---|---|---|---|
| Registry CLI | `npx shadcn-vue add @uipkge/<name>` | `npx shadcn@latest add @uipkge-react/<name>` | `npx shadcn-svelte@latest add https://uipkge.dev/r/svelte/<name>.json` |
| Session | `nuxt-auth-utils` | `iron-session` | `iron-session` |
| OAuth | 44 providers | GitHub | GitHub (arctic) |
| i18n | `@nuxtjs/i18n` | `next-intl` | `svelte-i18n` |
| Demo sign-in | `POST /auth/demo` | `POST /api/auth/demo` | `POST /auth/demo` |

Not ported yet: the multi-provider OAuth catalog, over-the-air translations (i18now), Sentry sourcemap upload, and the Nuxt SEO module setup.

---

## Contributing

PRs welcome. For non-trivial changes, open an issue first.

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgments

- [Svelte](https://svelte.dev) team
- [shadcn-svelte](https://shadcn-svelte.com) + [UIPKGE](https://uipkge.dev) for the component system
- [nuxt-boilerplate](https://github.com/uday-a/nuxt-boilerplate) — the Vue sibling this repo mirrors
- [Drizzle](https://orm.drizzle.team) for the ORM
