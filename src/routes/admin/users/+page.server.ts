import { loadApi } from '$lib/server/load-api'
import type { PageServerLoad } from './$types'

// First users fetch on the server so SSR renders the table (no empty flash).
export const load: PageServerLoad = async ({ fetch }) => ({
  usersRes: await loadApi<unknown[]>(fetch, '/api/admin/users'),
})
