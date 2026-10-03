// Theme store — Svelte 5 runes port of nuxt `app/composables/useTheme.ts`.
//
// Persists in the `uipkge-theme` COOKIE (not localStorage) so SSR and the
// client agree on the initial value and avoid a hydration mismatch —
// `src/app.html` runs the same read synchronously before first paint
// (anti-FOUC). If you rename the cookie key, change it here AND in app.html.

export type Theme = 'light' | 'dark' | 'system'

const COOKIE_KEY = 'uipkge-theme'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function readCookie(): Theme {
  if (typeof document === 'undefined') return 'system'
  const m = document.cookie.match(/(?:^|; )uipkge-theme=([^;]+)/)
  const v = m ? decodeURIComponent(m[1]!) : 'system'
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

function writeCookie(next: Theme) {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(next)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
}

export function resolveDark(next: Theme): boolean {
  if (typeof window === 'undefined') return false
  return next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

export function applyTheme(next: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolveDark(next))
}

class ThemeStore {
  current = $state<Theme>('system')
  private initialized = false

  constructor() {
    if (typeof window !== 'undefined' && !this.initialized) {
      this.initialized = true
      this.current = readCookie()
      applyTheme(this.current)
      // Re-apply when the OS theme flips while in system mode.
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.current === 'system') applyTheme('system')
      })
    }
  }

  set(next: Theme) {
    this.current = next
    writeCookie(next)
    applyTheme(next)
  }
}

export const themeStore = new ThemeStore()

/** Compat wrapper mirroring the nuxt `useTheme()` call shape. */
export function useTheme() {
  return {
    get theme() {
      return themeStore.current
    },
    setTheme: (next: Theme) => themeStore.set(next),
  }
}

export function setTheme(next: Theme) {
  themeStore.set(next)
}
