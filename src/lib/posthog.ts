// PostHog product analytics — SvelteKit port of nuxt-boilerplate
// app/plugins/posthog.client.ts.
//
// GATING (mirrors nuxt's 3 rules):
//   1. initPostHog() is called from root +layout.svelte onMount → client-only.
//   2. Empty key → return undefined immediately.
//   3. `posthog-js` is ONLY imported via dynamic import() inside initPostHog,
//      so with no key the SDK never enters the client bundle (Vite splits the
//      dynamic import into a chunk that is never requested).
//      → NEVER add a static `import 'posthog-js'` here (`import type` is
//        erased at compile time and safe).
//
// Usage (mirrors nuxt `$posthog?.capture(...)` ergonomics):
//   import { posthog } from '$lib/posthog'
//   $posthog?.capture('user.upgraded', { plan: 'pro' })
// The store starts `undefined` and is set once init completes; it stays
// `undefined` forever when unconfigured, so call sites stay undefined-safe
// with zero env checks.
//
// NOTE: no `$env/*` imports here on purpose — the key/host are passed in by
// +layout.svelte (which reads $env/dynamic/public), keeping this module
// unit-testable under vitest (same reason $lib/server/env.ts avoids $env).

import type { PostHog } from 'posthog-js'
import { get, writable } from 'svelte/store'

// Derive the init-options type from the SDK instead of naming PostHogConfig:
// stays in sync across posthog-js majors without chasing renamed exports.
type PostHogInitOptions = Parameters<PostHog['init']>[1]

export const POSTHOG_DEFAULT_HOST = 'https://us.i.posthog.com'

// The initialized client (undefined until init completes / forever when the
// key is unset). Components subscribe with `$posthog?.capture(...)`.
export const posthog = writable<PostHog | undefined>(undefined)

// Pure gate — the single check initPostHog and tests share. Blank/whitespace
// keys count as unset (catches `PUBLIC_POSTHOG_KEY=" "` misconfig).
export function isPostHogEnabled(key: string | null | undefined): boolean {
  return Boolean(key?.trim())
}

// Mirrors the nuxt plugin's init options 1:1:
// - capture_pageview false → we track SPA navigations manually (afterNavigate
//   + initial mount in +layout.svelte) so every view counts exactly once.
// - capture_pageleave true.
// - autocapture allowlisted to click/submit/change; `data-private` elements
//   ignored. Sensible privacy floor — opt forms back in per-element.
export function getPostHogConfig(host: string | null | undefined): PostHogInitOptions {
  return {
    api_host: host?.trim() || POSTHOG_DEFAULT_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ['click', 'submit', 'change'],
      element_attribute_ignorelist: ['data-private'],
    },
  }
}

// Undefined-safe $pageview sender. `$current_url` takes the absolute URL
// (PostHog docs format — one deliberate improvement over nuxt's relative
// `to.fullPath`, so session replay + toolbar link back correctly).
export function capturePageview(client: PostHog | null | undefined, url: string): void {
  client?.capture('$pageview', { $current_url: url })
}

// Init once; re-calls return the existing client (HMR-safe). Resolves
// undefined WITHOUT importing posthog-js when the key is empty.
export async function initPostHog(
  key: string | null | undefined,
  host: string | null | undefined,
): Promise<PostHog | undefined> {
  const existing = get(posthog)
  if (existing) return existing
  const trimmed = key?.trim()
  if (!trimmed) return undefined
  const { default: client } = await import('posthog-js')
  client.init(trimmed, getPostHogConfig(host))
  posthog.set(client)
  return client
}
