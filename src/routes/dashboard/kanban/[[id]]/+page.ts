import { error } from '@sveltejs/kit'
import { browser } from '$app/environment'
import { createInitialColumns } from '$lib/composables/kanbanData'
import type { PageLoad } from './$types'

// `/dashboard/kanban` and `/dashboard/kanban/<id>` share one page so the board
// state survives opening/closing a task. Unknown ids are a real 404; known
// ids name the last breadcrumb (`crumb`, read by AppShell).
export const load: PageLoad = ({ params }) => {
  if (!params.id) return {}
  const task = createInitialColumns().flatMap(c => c.tasks).find(t => t.id === params.id)
  // Client-side, a task added this session isn't in the seed — let the page
  // resolve it from board state instead of 404ing.
  if (!task) {
    if (browser) return {}
    error(404, 'Not found')
  }
  return { crumb: task.id }
}
