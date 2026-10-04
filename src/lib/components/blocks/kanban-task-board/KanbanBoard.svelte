<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import type { Component } from 'svelte'
  import { toast } from 'svelte-sonner'
  import { Plus } from '@lucide/svelte'
  import { PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import KanbanToolbar from './KanbanToolbar.svelte'
  import KanbanColumn from './KanbanColumn.svelte'
  import KanbanListView from './KanbanListView.svelte'
  import KanbanTaskSheet from './KanbanTaskSheet.svelte'
  import KanbanAddTaskDialog from './KanbanAddTaskDialog.svelte'
  import type { KanbanColumn as KanbanColumnType, KanbanTask } from '$lib/composables/useKanban'
  import { setKanbanLinkContext, type KanbanLinkValue } from './link-context'

  interface KanbanBoardProps {
    columns?: KanbanColumnType[]
    title?: string | null
    description?: string | null
    defaultColumnId?: string
    hideHeader?: boolean
    hideToolbar?: boolean
    lockParentScroll?: boolean
    linkComponent?: string | Component<any>
    /** Deep-link: open this task's sheet (e.g. from `/dashboard/kanban/<id>`). */
    taskId?: string | null
    /** Called when the user closes a sheet that was opened via `taskId`. */
    onTaskClose?: () => void
    onColumnsChange?: (columns: KanbanColumnType[]) => void
  }

  let {
    columns = $bindable([]),
    title = 'Kanban Board',
    description = 'Drag tasks across columns to update their status.',
    defaultColumnId = 'backlog',
    hideHeader = false,
    hideToolbar = false,
    lockParentScroll = true,
    linkComponent = 'a',
    taskId = null,
    onTaskClose,
    onColumnsChange,
  }: KanbanBoardProps = $props()

  // Provide the link component to all child views (KanbanCard, KanbanListView,
  // KanbanTaskSheet, SubtaskList) so they render SPA-aware links without
  // hard-coding a router. Defaults to a plain <a> — SvelteKit enhances
  // anchors with client-side routing automatically; pass a custom component
  // for anything fancier.
  setKanbanLinkContext({
    get current(): KanbanLinkValue {
      return linkComponent
    },
  })

  // The board mutates the columns array in place (splice/push on nested task
  // lists, like the Vue twin). Re-assign afterwards so `bind:columns`
  // parents and downstream $deriveds observe the change.
  function commit() {
    columns = [...columns]
    onColumnsChange?.(columns)
  }

  let kanbanEl: HTMLElement | null = $state(null)
  let parentMain: HTMLElement | null = null

  onMount(() => {
    if (!lockParentScroll) return
    parentMain = kanbanEl?.closest('main[data-slot="sidebar-inset"]') as HTMLElement | null
    if (parentMain) parentMain.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      if (parentMain) {
        parentMain.style.overflow = ''
        parentMain = null
      }
      document.documentElement.style.overflow = ''
    }
  })

  let searchQuery = $state('')
  let selectedPriority = $state<string | null>(null)
  let selectedAssignee = $state<string | null>(null)
  let viewMode = $state<'board' | 'list'>('board')

  const filteredColumns = $derived(
    columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        const q = searchQuery.toLowerCase()
        const matchesSearch = !q || task.title.toLowerCase().includes(q) || task.id.toLowerCase().includes(q)
        const matchesPriority = !selectedPriority || task.priority === selectedPriority
        const matchesAssignee = !selectedAssignee || task.assignee.name === selectedAssignee
        return matchesSearch && matchesPriority && matchesAssignee
      }),
    })),
  )

  const totalTasks = $derived(columns.reduce((sum, col) => sum + col.tasks.length, 0))

  let collapsedColumns = $state<Set<string>>(new Set())

  function toggleCollapse(columnId: string) {
    const next = new SvelteSet(collapsedColumns)
    if (next.has(columnId)) next.delete(columnId)
    else next.add(columnId)
    collapsedColumns = next
  }

  function addComment(task: KanbanTask, text: string) {
    task.commentItems.push({
      id: `c${Date.now()}`,
      author: 'Admin User',
      authorColor: 'bg-muted text-muted-foreground',
      text,
      time: 'Just now',
    })
    commit()
  }

  function moveTask(task: KanbanTask, targetColumnId: string) {
    const sourceCol = columns.find((c) => c.tasks.some((t) => t.id === task.id))
    const targetCol = columns.find((c) => c.id === targetColumnId)
    if (!sourceCol || !targetCol || sourceCol.id === targetColumnId) return
    const taskIndex = sourceCol.tasks.findIndex((t) => t.id === task.id)
    if (taskIndex === -1) return
    const removed = sourceCol.tasks.splice(taskIndex, 1)
    if (!removed[0]) return
    targetCol.tasks.push(removed[0])
    toast(`${task.id} moved to ${targetCol.title}`)
    commit()
  }

  let detailOpen = $state(false)
  let detailTask = $state<KanbanTask | null>(null)

  function openTaskDetail(task: KanbanTask) {
    detailTask = task
    detailOpen = true
  }

  // Deep link: open the routed task's sheet whenever `taskId` changes.
  $effect(() => {
    const id = taskId
    if (!id) return
    untrack(() => {
      const task = columns.flatMap((c) => c.tasks).find((t) => t.id === id)
      if (task) openTaskDetail(task)
    })
  })

  function onSheetOpenChange(open: boolean) {
    if (!open && taskId) onTaskClose?.()
  }

  let draggedTask = $state<string | null>(null)
  let dragOverColumn = $state<string | null>(null)
  let dropTargetIndex = $state(-1)
  let lastDragEnd = 0

  function onDragStart(event: DragEvent, taskId: string) {
    draggedTask = taskId
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', taskId)
    }
  }

  function resetDrag() {
    draggedTask = null
    dragOverColumn = null
    dropTargetIndex = -1
    lastDragEnd = Date.now()
  }

  function onDrop() {
    if (!draggedTask || !dragOverColumn) {
      resetDrag()
      return
    }

    let sourceColIdx = -1
    let taskIdx = -1
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c]
      if (!col) continue
      const tIdx = col.tasks.findIndex((t) => t.id === draggedTask)
      if (tIdx !== -1) {
        sourceColIdx = c
        taskIdx = tIdx
        break
      }
    }
    const targetColIdx = columns.findIndex((c) => c.id === dragOverColumn)
    if (sourceColIdx === -1 || targetColIdx === -1) {
      resetDrag()
      return
    }

    const sourceCol = columns[sourceColIdx]
    const targetCol = columns[targetColIdx]
    if (!sourceCol || !targetCol) {
      resetDrag()
      return
    }

    const [task] = sourceCol.tasks.splice(taskIdx, 1)
    if (!task) {
      resetDrag()
      return
    }

    let insertAt = dropTargetIndex
    if (insertAt < 0) insertAt = targetCol.tasks.length
    if (sourceColIdx === targetColIdx && taskIdx < insertAt) insertAt--

    targetCol.tasks.splice(insertAt, 0, task)
    commit()
    resetDrag()
  }

  function onCardClick(task: KanbanTask) {
    if (Date.now() - lastDragEnd < 200) return
    openTaskDetail(task)
  }

  function onCardDragOver(event: DragEvent, columnId: string, taskIndex: number) {
    dragOverColumn = columnId
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    dropTargetIndex = event.clientY < midY ? taskIndex : taskIndex + 1
  }

  function onLaneDragOver(_event: DragEvent, columnId: string, taskCount: number) {
    dragOverColumn = columnId
    dropTargetIndex = taskCount
  }

  let addTaskOpen = $state(false)
  let addTaskColumnId = $state(defaultColumnId)

  function openAddTask(columnId: string) {
    addTaskColumnId = columnId
    addTaskOpen = true
  }

  function onCreateTask(columnId: string, tasks: KanbanTask[]) {
    const col = columns.find((c) => c.id === columnId)
    if (col) col.tasks.push(...tasks)
    commit()
  }
</script>

<div
  bind:this={kanbanEl}
  data-slot="kanban-board"
  class="flex h-[calc(100dvh-3.5rem-2rem)] flex-col overflow-hidden"
>
  {#if !hideHeader}
    <div class="mb-4 shrink-0">
      <PageHeader>
        <PageHeaderHeading title={title ?? ''} description={description ?? ''} />
        {#snippet actions()}
          <div class="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" class="tabular-nums">{totalTasks} tasks</Badge>
            <Button size="sm" onclick={() => openAddTask(defaultColumnId)}>
              <Plus class="size-4" aria-hidden="true" />
              Add task
            </Button>
          </div>
        {/snippet}
      </PageHeader>
    </div>
  {/if}

  {#if !hideToolbar}
    <KanbanToolbar
      bind:searchQuery
      bind:selectedPriority
      bind:selectedAssignee
      bind:viewMode
    />
  {/if}

  {#if viewMode === 'board'}
    <div class="relative flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden pb-3 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
      {#each filteredColumns as column (column.id)}
        <KanbanColumn
          {column}
          columns={columns}
          collapsed={collapsedColumns.has(column.id)}
          {draggedTask}
          {dragOverColumn}
          {dropTargetIndex}
          onToggleCollapse={toggleCollapse}
          onAddTask={openAddTask}
          onCardClick={onCardClick}
          onCardQuickView={openTaskDetail}
          {onDragStart}
          onDragEnd={resetDrag}
          {onCardDragOver}
          {onLaneDragOver}
          onDrop={onDrop}
        />
      {/each}
    </div>
  {:else}
    <KanbanListView
      columns={filteredColumns}
      allColumns={columns}
      onTaskClick={openTaskDetail}
      onMoveTask={moveTask}
    />
  {/if}

  <KanbanTaskSheet
    bind:open={detailOpen}
    task={detailTask}
    columns={columns}
    onMoveTask={moveTask}
    onAddComment={addComment}
    onOpenChange={onSheetOpenChange}
  />

  <KanbanAddTaskDialog
    bind:open={addTaskOpen}
    columns={columns}
    initialColumnId={addTaskColumnId}
    onCreate={onCreateTask}
  />
</div>
