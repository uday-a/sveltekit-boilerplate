import { loadApi } from '$lib/server/load-api'
import type { PageServerLoad } from './$types'

// First projects fetch on the server so SSR renders the list (no empty flash).
export const load: PageServerLoad = async ({ fetch }) => ({
  projectsRes: await loadApi<{ projects: unknown[] }>(fetch, '/api/projects'),
})
