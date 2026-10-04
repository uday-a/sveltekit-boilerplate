import { error } from '@sveltejs/kit'
import { browser } from '$app/environment'
import { createInitialColumns } from '$lib/composables/kanbanData'
import { kanban } from '$lib/composables/kanbanStore.svelte'
import type { PageLoad } from './$types'

// `/dashboard/kanban` and `/dashboard/kanban/<id>` share one page so the board
// state survives opening/closing a task. The id resolves against the client
// board (so tasks added this session work) or the seed on the server; unknown
// ids are a real 404. Known ids name the last breadcrumb (`crumb`, read by AppShell).
export const load: PageLoad = ({ params }) => {
  if (!params.id) return {}
  const columns = browser ? kanban.columns : createInitialColumns()
  const task = columns.flatMap(c => c.tasks).find(t => t.id === params.id)
  if (!task) error(404, 'Not found')
  return { crumb: task.title }
}
