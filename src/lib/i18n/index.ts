// App i18n — svelte-i18n wrapper porting nuxt-boilerplate's @nuxtjs/i18n
// behaviour (strategy `no_prefix`: single URL, locale switched in-memory +
// persisted to a cookie; default `en`).
//
// WHY svelte-i18n (not a hand-rolled dict): ICU interpolation ({code},
// {seconds}) + <html lang> sync + Svelte store reactivity come free, and
// the message shape mirrors the nuxt JSON 1:1 so translators diff one
// format. Messages are bundled synchronously via addMessages (only 2 tiny
// locales — no lazy register(), so no waitLocale() dance in layouts).
//
// CONTRACT for page/dashboard workers — import exactly:
//   import { t, locale, setLocale } from '$lib/i18n'
//   - In .svelte templates use `$t('auth.signIn.title')` (REACTIVE —
//     re-renders on locale switch) and `$locale` for the current code.
//   - In .ts / event handlers call `t('key', { code: '123' })` directly
//     (same function; flat nuxt-style vars).
//   - Switch with `setLocale('es')` (sync; `await` is harmless if you keep
//     nuxt's `await setLocale(...)` muscle memory).
// `t` is a store-function hybrid (callable AND subscribable) so both
// styles typecheck. NOTE: `{t('key')}` without `$` in a template renders
// once and will NOT update on locale switch — always use `$t(...)` there.
//
// SSR TRADEOFF (read before "fixing"): svelte-i18n's locale store is
// module-global, so per-request SSR locales would race under adapter-node
// concurrency. We always SSR in `en` and hydrate the stored locale on the
// client (initI18n reads cookie/navigator only when `document` exists).
// hooks.server.ts still stamps the correct <html lang> from the cookie via
// transformPageChunk (cheap, race-free). A stored `es` locale therefore
// hydrates with correct lang + correct strings after the first client
// render — Svelte patches the SSR'd `en` text via normal mismatch
// recovery, not a crash.
//
// ICU DIVERGENCE from nuxt: vue-i18n escapes `@` as `{'@'}` (its linked-
// message syntax); svelte-i18n uses stock ICU where `@` needs no escaping,
// so the svelte JSON uses plain `you@company.com`. Keys are identical
// (enforced by i18n.test.ts); only that escape differs.
//
// NOTE: no `$app/*` imports here on purpose — vitest can't resolve them
// (same reason $lib/server/env.ts reads process.env). Browser detection
// uses `typeof document/navigator` guards, which also keeps this module
// SSR-safe.

import { derived, get, type Readable } from 'svelte/store'
import { _, addMessages, init, locale as svelteLocale } from 'svelte-i18n'
import en from './en.json'
import es from './es.json'

export type Locale = 'en' | 'es'

export const defaultLocale: Locale = 'en'

// Mirrors the nuxt `i18n.locales` config (code + display name) so language
// switchers can render without hardcoding options.
export const locales: Array<{ code: Locale, name: string }> = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
]

// Single persistence mechanism (readable both sides: document.cookie on the
// client, event.cookies in hooks.server.ts). NOT httpOnly by design — the
// client must read it to hydrate the stored locale.
export const LOCALE_COOKIE_NAME = 'uipkge-locale'
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Re-exported svelte-i18n locale store (Writable). `$locale` is the current
// code. Prefer setLocale() (validates + warns), but direct `locale.set()`
// also persists — initI18n subscribes and persists every change.
export const locale = svelteLocale

// Coerce anything (cookie value, navigator.language, Select output) to a
// supported locale. Regional variants collapse to their base ('en-US' ->
// 'en', 'es-MX' -> 'es'); anything else falls back to `en` silently —
// callers with user-visible input should warn via setLocale() instead.
export function normalizeLocale(input: unknown): Locale {
  if (typeof input !== 'string') return defaultLocale
  const base = input.trim().toLowerCase().split(/[-_]/)[0]
  return base === 'es' ? 'es' : defaultLocale
}

function readStoredLocale(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

function readNavigatorLocale(): string | undefined {
  if (typeof navigator === 'undefined') return undefined
  return navigator.language
}

function persistLocale(code: Locale): void {
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : ''
  document.cookie
    = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(code)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`
}

function syncHtmlLang(code: string | undefined | null): void {
  if (typeof document === 'undefined') return
  if (code) document.documentElement.lang = code
}

let initialized = false

// Idempotent. Called from root +layout.svelte (runs on server → `en`, and
// on client hydration → stored/navigator locale). Safe to call again with
// `{ locale }` to switch; t()/setLocale() lazy-init with defaults so
// workers can't hit an uninitialized formatter.
export function initI18n(options: { locale?: string } = {}): void {
  if (initialized) {
    if (options.locale) setLocale(options.locale)
    return
  }
  addMessages('en', en)
  addMessages('es', es)
  const initial = normalizeLocale(options.locale ?? readStoredLocale() ?? readNavigatorLocale())
  init({ fallbackLocale: 'en', initialLocale: initial })
  initialized = true
  if (typeof document !== 'undefined') {
    // Persist every switch (covers direct `locale.set()` too) and mirror
    // <html lang> (svelte-i18n also syncs it; belt + suspenders).
    locale.subscribe((code) => {
      if (!code) return
      const normalized = normalizeLocale(code)
      persistLocale(normalized)
      syncHtmlLang(normalized)
    })
  }
  syncHtmlLang(initial)
}

function ensureInit(): void {
  if (!initialized) initI18n()
}

// Switch locale now (sync — messages are pre-bundled, nothing to load).
// Unknown codes warn + fall back to `en` rather than leaving the store in
// a state with no dictionary. Accepts regional variants ('es-MX').
export function setLocale(code: string): void {
  ensureInit()
  const next = normalizeLocale(code)
  const base = code.trim().toLowerCase().split(/[-_]/)[0]
  if (base !== next) {
    console.warn(`[i18n] unknown locale "${code}" — falling back to "${next}"`)
  }
  locale.set(next)
}

export type TranslateVars = Record<string, string | number | boolean | null | undefined>

export type TranslateFn = (key: string, vars?: TranslateVars | { values?: TranslateVars }) => string

const translateStore: Readable<TranslateFn> = derived(_, ($translate) => {
  const fn: TranslateFn = (key, vars) => {
    if (!vars) return $translate(key)
    // Accept both nuxt-style flat vars `{ code: '1' }` and svelte-i18n's
    // `{ values: {...} }` wrapper — unless the placeholder is literally
    // named `values` (ours aren't: {code}, {seconds}).
    const maybeWrapper = vars as { values?: TranslateVars }
    const values: TranslateVars = typeof maybeWrapper.values === 'object' && maybeWrapper.values !== null
      ? maybeWrapper.values
      : (vars as TranslateVars)
    return $translate(key, { values })
  }
  return fn
})

function translate(key: string, vars?: TranslateVars | { values?: TranslateVars }): string {
  ensureInit()
  return get(translateStore)(key, vars)
}

// Store-function hybrid: `t('key')` in scripts/handlers, `$t('key')`
// (reactive) in templates. Both are the same underlying formatter.
// (Unbound `subscribe` reference is safe — svelte stores are closures,
// no `this` involved.)
export const t: TranslateFn & Readable<TranslateFn> = Object.assign(translate, {
  subscribe: translateStore.subscribe,
})
