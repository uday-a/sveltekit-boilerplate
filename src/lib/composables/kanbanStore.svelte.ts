import { createInitialColumns } from './kanbanData'
import type { KanbanColumn } from './useKanban'

// Client board state shared by `/dashboard/kanban` and its `/<id>` deep link,
// so tasks added this session resolve on their own link (the load reads it).
// ponytail: module state is shared per server process too — safe only because
// the board is never mutated during SSR (adds/drags are browser events). Swap
// for a per-user fetch when wiring to your DB.
export const kanban = $state<{ columns: KanbanColumn[] }>({ columns: createInitialColumns() })
