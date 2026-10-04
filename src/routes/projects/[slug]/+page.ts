import type { ApiResponse } from '$lib/api'
import type { PageLoad } from './$types'

export interface Project {
  id: number
  slug: string
  name: string
  description: string | null
  ownerId: number
  createdAt: string | Date
  updatedAt: string | Date
}

// Universal load so SSR renders the project name in the H1 and <title>
// (mirrors Nuxt's awaited useFetch) instead of flashing the raw slug.
export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/projects/${params.slug}`)
  const json = (await res.json().catch(() => null)) as ApiResponse<{ project: Project }> | null
  const project = json?.ok ? json.data.project : null
  return {
    project,
    // Names the last breadcrumb (read by AppShell) instead of the humanized slug.
    crumb: project?.name,
    loadError: json?.ok ? null : (json?.error.message ?? `Request failed (${res.status})`),
  }
}
