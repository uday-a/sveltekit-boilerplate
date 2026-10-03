// Colour theme + corner radius for the whole app (header theme
// customiser). Svelte 5 runes port of nuxt `app/composables/useColorTheme.ts`.
//
// Cookie-backed (`uipkge-color-theme` + `uipkge-radius`, NOT localStorage)
// and applied on <html> during SSR, so the first paint is already themed —
// no flash. `src/app.html` runs the same read synchronously before first
// paint (anti-FOUC). If you rename a cookie key, change it here AND in app.html.

import { COLOR_THEME_DEFAULT, COLOR_THEME_IDS, RADIUS_DEFAULT, RADIUS_OPTIONS } from './color-themes'

const THEME_COOKIE = 'uipkge-color-theme'
const RADIUS_COOKIE = 'uipkge-radius'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function readCookie(key: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]+)`))
  return m ? decodeURIComponent(m[1]!) : null
}

function writeCookie(key: string, value: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
}

function normalizeTheme(value: string | null): string {
  return value && COLOR_THEME_IDS.has(value) ? value : COLOR_THEME_DEFAULT
}

function normalizeRadius(value: string | null): string {
  const v = value ?? ''
  return (RADIUS_OPTIONS as readonly string[]).includes(v) ? v : RADIUS_DEFAULT
}

export function applyColorTheme(theme: string, radius: string) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === COLOR_THEME_DEFAULT) root.removeAttribute('data-color-theme')
  else root.setAttribute('data-color-theme', theme)
  root.style.setProperty('--radius', `${radius}rem`)
}

class ColorThemeStore {
  colorTheme = $state<string>(COLOR_THEME_DEFAULT)
  radius = $state<string>(RADIUS_DEFAULT)
  private initialized = false

  constructor() {
    if (typeof window !== 'undefined' && !this.initialized) {
      this.initialized = true
      this.colorTheme = normalizeTheme(readCookie(THEME_COOKIE))
      this.radius = normalizeRadius(readCookie(RADIUS_COOKIE))
      applyColorTheme(this.colorTheme, this.radius)
    }
  }

  setColorTheme(next: string) {
    this.colorTheme = normalizeTheme(next)
    writeCookie(THEME_COOKIE, this.colorTheme)
    applyColorTheme(this.colorTheme, this.radius)
  }

  setRadius(next: string) {
    this.radius = normalizeRadius(next)
    writeCookie(RADIUS_COOKIE, this.radius)
    applyColorTheme(this.colorTheme, this.radius)
  }

  reset() {
    this.setColorTheme(COLOR_THEME_DEFAULT)
    this.setRadius(RADIUS_DEFAULT)
  }
}

export const colorThemeStore = new ColorThemeStore()

/** Compat wrapper mirroring the nuxt `useColorTheme()` call shape. */
export function useColorTheme() {
  return {
    get colorTheme() {
      return colorThemeStore.colorTheme
    },
    set colorTheme(next: string) {
      colorThemeStore.setColorTheme(next)
    },
    get radius() {
      return colorThemeStore.radius
    },
    set radius(next: string) {
      colorThemeStore.setRadius(next)
    },
    reset: () => colorThemeStore.reset(),
  }
}
