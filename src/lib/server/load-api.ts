import type { ApiResponse } from '$lib/api'

/** GET an internal API route from a server load (event.fetch keeps the
 *  user's cookies) so SSR renders the data. Never throws: failures come
 *  back as the usual `{ ok: false }` envelope for the page to render. */
export function loadApi<T>(fetch: typeof globalThis.fetch, path: string): Promise<ApiResponse<T>> {
  return fetch(path)
    .then(r => r.json() as Promise<ApiResponse<T>>)
    .catch((): ApiResponse<T> => ({ ok: false, error: { code: 'INTERNAL', message: `Request failed: ${path}` } }))
}
