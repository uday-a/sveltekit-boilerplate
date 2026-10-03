// Tiny client-side fetch helper for the `{ ok, data/error }` envelope.
// Mirrors nuxt's `$fetch` usage in app/pages/*: same-origin cookies,
// JSON bodies, and envelope-aware error surfacing.

export interface ApiOk<T> {
  ok: true
  data: T
}

export interface ApiErr {
  ok: false
  error: { code: string, message: string, details?: unknown }
}

export type ApiResponse<T> = ApiOk<T> | ApiErr

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    const json = (await res.json().catch(() => null)) as ApiResponse<T> | null
    if (json && typeof json === 'object' && 'ok' in json) return json
    if (!res.ok) return { ok: false, error: { code: 'INTERNAL', message: `Request failed (${res.status})` } }
    return { ok: false, error: { code: 'INTERNAL', message: 'Unexpected response from server' } }
  }
  catch (e) {
    return { ok: false, error: { code: 'INTERNAL', message: e instanceof Error ? e.message : 'Network error' } }
  }
}

export function errMessage(res: ApiErr, fallback: string): string {
  return res.error?.message ?? fallback
}
