<script lang="ts">
  import { Plus, MoreHorizontal, ChevronsLeft, ChevronsRight } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import KanbanCard from './KanbanCard.svelte'
  import type { KanbanColumn as KanbanColumnType, KanbanTask } from '$lib/composables/useKanban'

  interface KanbanColumnProps {
    column: { id: string; title: string; color: string; dotColor: string; tasks: KanbanTask[] }
    columns: KanbanColumnType[]
    collapsed: boolean
    draggedTask: string | null
    dragOverColumn: string | null
    dropTargetIndex: number
    onToggleCollapse?: (columnId: string) => void
    onAddTask?: (columnId: string) => void
    onCardClick?: (task: KanbanTask) => void
    onCardQuickView?: (task: KanbanTask) => void
    onDragStart?: (event: DragEvent, taskId: string) => void
    onDragEnd?: () => void
    onCardDragOver?: (event: DragEvent, columnId: string, taskIndex: number) => void
    onLaneDragOver?: (event: DragEvent, columnId: string, taskCount: number) => void
    onDrop?: () => void
  }

  let {
    column,
    columns,
    collapsed,
    draggedTask,
    dragOverColumn,
    dropTargetIndex,
    onToggleCollapse,
    onAddTask,
    onCardClick,
    onCardQuickView,
    onDragStart,
    onDragEnd,
    onCardDragOver,
    onLaneDragOver,
    onDrop,
  }: KanbanColumnProps = $props()
</script>

<div
  data-slot="kanban-board"
  class={['group/col flex max-h-full min-h-0 shrink-0 flex-col transition-all duration-200', collapsed ? 'w-12' : 'border-border/70 bg-muted/40 w-[300px] rounded-xl border p-2']}
  ondragover={(e) => e.preventDefault()}
  ondrop={() => onDrop?.()}
>
  {#if collapsed}
    <button
      class="bg-muted/40 hover:bg-muted/60 flex h-full flex-col items-center gap-2 rounded-xl px-1 pt-3 pb-4 transition-colors"
      onclick={() => onToggleCollapse?.(column.id)}
    >
      <span class={['size-2 shrink-0 rounded-full', column.dotColor]}></span>
      <span class={['text-xs font-semibold tracking-tight', column.color, 'rotate-180 [writing-mode:vertical-lr]']}>
        {column.title}
      </span>
      <Badge variant="secondary" class="mt-1 h-5 min-w-5 justify-center rounded-md px-1 text-xs tabular-nums">
        {column.tasks.length}
      </Badge>
      <ChevronsRight class="text-muted-foreground mt-auto size-3.5" />
    </button>
  {:else}
    <div class="mb-2 flex shrink-0 items-center gap-2 rounded-lg bg-[color-mix(in_oklch,var(--muted)_40%,var(--background))] px-2 py-1.5">
      <button
        class="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
        title="Collapse column"
        aria-label="Collapse column"
        onclick={() => onToggleCollapse?.(column.id)}
      >
        <ChevronsLeft class="size-3.5" />
      </button>
      <span class={['size-2 shrink-0 rounded-full', column.dotColor]}></span>
      <h3 class={['text-sm font-semibold tracking-tight', column.color]}>{column.title}</h3>
      <span class="text-muted-foreground bg-muted rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums">
        {column.tasks.length}
      </span>
      <div class="ml-auto flex items-center">
        <Button
          aria-label="Column options"
          variant="ghost"
          size="icon"
          class="text-muted-foreground size-6 opacity-0 transition-opacity group-hover/col:opacity-100"
        >
          <MoreHorizontal class="size-3.5" />
        </Button>
        <Button
          aria-label="Add task"
          variant="ghost"
          size="icon"
          class="text-muted-foreground size-6"
          onclick={() => onAddTask?.(column.id)}
        >
          <Plus class="size-3.5" />
        </Button>
      </div>
    </div>

    <div
      class={[
        'min-h-15 flex flex-col overflow-y-auto rounded-lg transition-all duration-200 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]',
        dragOverColumn === column.id && draggedTask
          ? 'bg-primary/[0.06] ring-primary/25 ring-1 ring-inset'
          : '',
      ]}
      ondragover={(e) => {
        e.preventDefault()
        onLaneDragOver?.(e, column.id, column.tasks.length)
      }}
    >
      {#each column.tasks as task, taskIndex (task.id)}
        <div
          class={[
            'drop-indicator mx-1 transition-all duration-150',
            dragOverColumn === column.id && dropTargetIndex === taskIndex && draggedTask && draggedTask !== task.id
              ? 'bg-primary h-0.5 rounded-full'
              : 'h-0',
          ]}
        ></div>
        <div
          data-task-id={task.id}
          draggable="true"
          class={['mt-2 first:mt-0', draggedTask === task.id ? 'scale-95 rotate-1 opacity-30' : 'opacity-100']}
          ondragstart={(e) => onDragStart?.(e, task.id)}
          ondragend={() => onDragEnd?.()}
          ondragover={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onCardDragOver?.(e, column.id, taskIndex)
          }}
        >
          <KanbanCard
            {task}
            {columns}
            isDone={column.id === 'done'}
            onClick={(t) => onCardClick?.(t)}
            onQuickView={(t) => onCardQuickView?.(t)}
          />
        </div>
      {/each}

      {#if column.tasks.length > 0}
        <div
          class={[
            'drop-indicator mx-1 transition-all duration-150',
            dragOverColumn === column.id && dropTargetIndex === column.tasks.length && draggedTask
              ? 'bg-primary mt-2 h-0.5 rounded-full'
              : 'h-0',
          ]}
        ></div>
      {/if}

      {#if column.tasks.length === 0}
        <button
          aria-label="Add task"
          class="text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-4 transition-colors"
          onclick={() => onAddTask?.(column.id)}
        >
          <Plus class="mb-1 size-4" />
          <p class="text-xs">No tasks</p>
        </button>
      {/if}
    </div>

    <button
      class="text-muted-foreground hover:text-foreground hover:bg-muted/60 mt-2 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs transition-colors"
      onclick={() => onAddTask?.(column.id)}
    >
      <Plus class="size-3.5" />
      Add task
    </button>
  {/if}
</div>
