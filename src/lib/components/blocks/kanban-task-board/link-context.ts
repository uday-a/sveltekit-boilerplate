import { getContext, setContext } from 'svelte'
import type { Component } from 'svelte'

// Shared context for the kanban-board link component.
// KanbanBoard provides it; KanbanCard, KanbanListView, KanbanTaskSheet,
// and SubtaskList consume it (through KanbanLink) so task links render
// with the consumer's router component or a plain <a> by default.
// A getter keeps consumers reactive if the prop changes post-mount.
export type KanbanLinkValue = string | Component<any>

const KEY = Symbol('kanbanLink')

export function setKanbanLinkContext(link: { readonly current: KanbanLinkValue }) {
  setContext(KEY, link)
}

export function getKanbanLinkContext(): { readonly current: KanbanLinkValue } {
  return getContext<{ readonly current: KanbanLinkValue }>(KEY) ?? { current: 'a' }
}
