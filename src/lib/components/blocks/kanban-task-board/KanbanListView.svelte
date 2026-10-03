<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity'
  import type { KanbanTask, KanbanColumn } from '$lib/composables/useKanban'
  import { getTaskColumn } from '$lib/composables/useKanban'
  import PriorityBadge from './PriorityBadge.svelte'
  import TagBadge from './TagBadge.svelte'
  import DueDateBadge from './DueDateBadge.svelte'
  import UserAvatar from './UserAvatar.svelte'
  import SubtaskProgress from './SubtaskProgress.svelte'
  import KanbanLink from './KanbanLink.svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { MessageSquare, Paperclip, ExternalLink, ArrowUpDown, ChevronDown, ChevronRight } from '@lucide/svelte'

  interface KanbanListViewProps {
    columns: KanbanColumn[]
    allColumns: KanbanColumn[]
    onTaskClick?: (task: KanbanTask) => void
    onMoveTask?: (task: KanbanTask, targetColumnId: string) => void
  }

  let { columns, allColumns, onTaskClick, onMoveTask }: KanbanListViewProps = $props()

  type SortField = 'id' | 'title' | 'priority' | 'assignee' | 'dueDate' | 'status'
  type SortDir = 'asc' | 'desc'

  let sortField = $state<SortField>('status')
  let sortDir = $state<SortDir>('asc')

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      sortField = field
      sortDir = 'asc'
    }
  }

  // WHY (Rule85): sort buttons announce their state like the data table's.
  function ariaSort(field: SortField): 'ascending' | 'descending' | 'none' {
    if (sortField !== field) return 'none'
    return sortDir === 'asc' ? 'ascending' : 'descending'
  }

  const groupByStatus = $state(true)
  let collapsedGroups = $state<Set<string>>(new Set())

  function toggleGroup(columnId: string) {
    const next = new SvelteSet(collapsedGroups)
    if (next.has(columnId)) next.delete(columnId)
    else next.add(columnId)
    collapsedGroups = next
  }

  interface FlatTask {
    task: KanbanTask
    columnId: string
    columnTitle: string
    dotColor: string
  }

  function sortTasks(tasks: FlatTask[]): FlatTask[] {
    return [...tasks].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'id': {
          const numA = parseInt(a.task.id.replace(/^[A-Z]+-/, ''), 10)
          const numB = parseInt(b.task.id.replace(/^[A-Z]+-/, ''), 10)
          cmp = numA - numB
          break
        }
        case 'title':
          cmp = a.task.title.localeCompare(b.task.title)
          break
        case 'priority':
          cmp = (priorityOrder[a.task.priority] ?? 99) - (priorityOrder[b.task.priority] ?? 99)
          break
        case 'assignee':
          cmp = a.task.assignee.name.localeCompare(b.task.assignee.name)
          break
        case 'dueDate':
          cmp = (a.task.dueDate ?? '9999').localeCompare(b.task.dueDate ?? '9999')
          break
        case 'status': {
          const colOrder = allColumns.map((c) => c.id)
          cmp = colOrder.indexOf(a.columnId) - colOrder.indexOf(b.columnId)
          break
        }
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }

  const flatTasks = $derived.by((): FlatTask[] => {
    const items: FlatTask[] = []
    for (const col of columns) {
      for (const task of col.tasks) {
        items.push({
          task,
          columnId: col.id,
          columnTitle: col.title,
          dotColor: col.dotColor,
        })
      }
    }
    return sortTasks(items)
  })

  const groupedTasks = $derived.by(() => {
    if (!groupByStatus) return null
    const groups: { column: KanbanColumn; tasks: FlatTask[] }[] = []
    for (const col of allColumns) {
      const tasks = flatTasks.filter((t) => t.columnId === col.id)
      groups.push({ column: col, tasks })
    }
    return groups
  })

  function subtasksDone(task: KanbanTask): number {
    if (!task.subtaskIds.length) return 0
    return task.subtaskIds.filter((id) => getTaskColumn(allColumns, id)?.id === 'done').length
  }
</script>

<div data-slot="kanban-board" class="kanban-list flex min-h-0 flex-1 flex-col overflow-auto pb-3">
  <div
    class="bg-muted/50 sticky top-0 z-10 grid grid-cols-[60px_1fr_100px_110px_130px_100px_80px] items-center gap-2 rounded-t-lg border px-3 py-2 text-xs font-semibold tracking-wider uppercase"
  >
    <div role="columnheader" aria-sort={ariaSort('id')} class="flex">
      <button class="flex items-center gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onclick={() => toggleSort('id')}>
        ID
        <ArrowUpDown class={['size-3', sortField === 'id' ? 'text-foreground' : 'text-muted-foreground/50']} />
      </button>
    </div>
    <div role="columnheader" aria-sort={ariaSort('title')} class="flex">
      <button class="flex items-center gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onclick={() => toggleSort('title')}>
        Task
        <ArrowUpDown class={['size-3', sortField === 'title' ? 'text-foreground' : 'text-muted-foreground/50']} />
      </button>
    </div>
    <div role="columnheader" aria-sort={ariaSort('status')} class="flex">
      <button class="flex items-center gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onclick={() => toggleSort('status')}>
        Status
        <ArrowUpDown class={['size-3', sortField === 'status' ? 'text-foreground' : 'text-muted-foreground/50']} />
      </button>
    </div>
    <div role="columnheader" aria-sort={ariaSort('priority')} class="flex">
      <button class="flex items-center gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onclick={() => toggleSort('priority')}>
        Priority
        <ArrowUpDown class={['size-3', sortField === 'priority' ? 'text-foreground' : 'text-muted-foreground/50']} />
      </button>
    </div>
    <div role="columnheader" aria-sort={ariaSort('assignee')} class="flex">
      <button class="flex items-center gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onclick={() => toggleSort('assignee')}>
        Assignee
        <ArrowUpDown class={['size-3', sortField === 'assignee' ? 'text-foreground' : 'text-muted-foreground/50']} />
      </button>
    </div>
    <div role="columnheader" aria-sort={ariaSort('dueDate')} class="flex">
      <button class="flex items-center gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onclick={() => toggleSort('dueDate')}>
        Due
        <ArrowUpDown class={['size-3', sortField === 'dueDate' ? 'text-foreground' : 'text-muted-foreground/50']} />
      </button>
    </div>
    <span class="text-center">Info</span>
  </div>

  {#if groupedTasks}
    {#each groupedTasks as group (group.column.id)}
      <button
        class="bg-muted/30 hover:bg-muted/50 flex items-center gap-2 border-x border-b px-3 py-1.5 text-left transition-colors"
        onclick={() => toggleGroup(group.column.id)}
      >
        {#if collapsedGroups.has(group.column.id)}
          <ChevronRight class="text-muted-foreground size-3.5" />
        {:else}
          <ChevronDown class="text-muted-foreground size-3.5" />
        {/if}
        <span class={['size-2 rounded-full', group.column.dotColor]}></span>
        <span class="text-sm font-medium">{group.column.title}</span>
        <Badge variant="secondary" class="ml-1 h-4 px-1.5 text-xs tabular-nums">
          {group.tasks.length}
        </Badge>
      </button>

      {#if !collapsedGroups.has(group.column.id)}
        {#each group.tasks as item (item.task.id)}
          <div
            class="hover:bg-muted/30 grid cursor-pointer grid-cols-[60px_1fr_100px_110px_130px_100px_80px] items-center gap-2 border-x border-b px-3 py-2 transition-colors"
            onclick={() => onTaskClick?.(item.task)}
            onkeydown={(e) => {
              if (e.key === 'Enter') onTaskClick?.(item.task)
            }}
            role="button"
            tabindex="0"
          >
            <span class="text-muted-foreground font-mono text-xs">{item.task.id}</span>

            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span
                  title={item.task.title}
                  class={[
                    'truncate text-sm font-medium',
                    item.columnId === 'done' ? 'text-muted-foreground line-through' : '',
                  ]}
                >
                  {item.task.title}
                </span>
                <KanbanLink
                  href="/dashboard/kanban/{item.task.id}"
                  to="/dashboard/kanban/{item.task.id}"
                  class="text-muted-foreground hover:text-foreground shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100"
                  onclick={(e) => e.stopPropagation()}
                >
                  <ExternalLink class="size-3" />
                </KanbanLink>
              </div>
              {#if item.task.tags.length || item.task.subtaskIds.length}
                <div class="mt-0.5 flex items-center gap-1.5">
                  {#each item.task.tags as tag (tag.label)}
                    <TagBadge label={tag.label} color={tag.color} class="!px-1.5 !py-0 !text-xs" />
                  {/each}
                  {#if item.task.subtaskIds.length}
                    <SubtaskProgress
                      done={subtasksDone(item.task)}
                      total={item.task.subtaskIds.length}
                      class="ml-1"
                    />
                  {/if}
                </div>
              {/if}
            </div>

            <div>
              <Select value={item.columnId} onValueChange={(val) => onMoveTask?.(item.task, String(val))}>
                <SelectTrigger
                  class="hover:bg-muted h-6 w-auto gap-1 rounded-md border-none bg-transparent px-1.5 text-xs font-medium shadow-none"
                  onclick={(e) => e.stopPropagation()}
                >
                  <span class="flex items-center gap-1.5">
                    <span class={['size-1.5 rounded-full', item.dotColor]}></span>
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {#each allColumns as col (col.id)}
                    <SelectItem value={col.id}>
                      <span class="flex items-center gap-1.5">
                        <span class={['size-1.5 rounded-full', col.dotColor]}></span>
                        {col.title}
                      </span>
                    </SelectItem>
                  {/each}
                </SelectContent>
              </Select>
            </div>

            <PriorityBadge priority={item.task.priority} />

            <div class="flex items-center gap-2">
              <UserAvatar name={item.task.assignee.name} color={item.task.assignee.color} size="xs" />
              <span class="truncate text-xs" title={item.task.assignee.name}>{item.task.assignee.name}</span>
            </div>

            <div>
              {#if item.task.dueDate}
                <DueDateBadge dueDate={item.task.dueDate} variant="chip" />
              {:else}
                <span class="text-muted-foreground/50 text-xs">—</span>
              {/if}
            </div>

            <div class="flex items-center justify-center gap-2">
              <TooltipProvider delayDuration={200}>
                {#if item.task.commentItems.length}
                  <Tooltip>
                    <TooltipTrigger>
                      <span class="text-muted-foreground/70 flex items-center gap-0.5 text-xs tabular-nums">
                        <MessageSquare class="size-3" />
                        {item.task.commentItems.length}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent class="text-xs">{item.task.commentItems.length} comments</TooltipContent>
                  </Tooltip>
                {/if}
                {#if item.task.fileItems.length}
                  <Tooltip>
                    <TooltipTrigger>
                      <span class="text-muted-foreground/70 flex items-center gap-0.5 text-xs tabular-nums">
                        <Paperclip class="size-3" />
                        {item.task.fileItems.length}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent class="text-xs">{item.task.fileItems.length} files</TooltipContent>
                  </Tooltip>
                {/if}
              </TooltipProvider>
            </div>
          </div>
        {/each}
      {/if}
    {/each}
  {/if}

  {#if flatTasks.length === 0}
    <div
      class="text-muted-foreground flex flex-1 items-center justify-center rounded-b-lg border-x border-b py-12 text-sm"
    >
      No tasks match your filters.
    </div>
  {/if}
</div>

<style>
  .kanban-list {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
  }
  .kanban-list::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }
  .kanban-list::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 3px;
  }
</style>
