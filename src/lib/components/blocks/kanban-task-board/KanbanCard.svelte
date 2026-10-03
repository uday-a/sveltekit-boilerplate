<script lang="ts">
  import { type KanbanTask, type KanbanColumn, priorityConfig, getTaskColumn } from '$lib/composables/useKanban'
  import TagBadge from './TagBadge.svelte'
  import SubtaskProgress from './SubtaskProgress.svelte'
  import DueDateBadge from './DueDateBadge.svelte'
  import UserAvatar from './UserAvatar.svelte'
  import KanbanLink from './KanbanLink.svelte'
  import { Button } from '$lib/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { MoreHorizontal, MessageSquare, Paperclip, ExternalLink } from '@lucide/svelte'

  interface KanbanCardProps {
    task: KanbanTask
    isDone: boolean
    columns: KanbanColumn[]
    onClick?: (task: KanbanTask) => void
    onQuickView?: (task: KanbanTask) => void
  }

  let { task, isDone, columns, onClick, onQuickView }: KanbanCardProps = $props()

  const subtasksDone = $derived(
    !columns || !task.subtaskIds.length
      ? 0
      : task.subtaskIds.filter((id) => getTaskColumn(columns, id)?.id === 'done').length,
  )

  // Screen-reader name: title first, then status + priority for context.
  const ariaLabel = $derived(
    [task.title, getTaskColumn(columns, task.id)?.title, `${priorityConfig[task.priority]?.label ?? task.priority} priority`]
      .filter(Boolean)
      .join(', '),
  )
</script>

<div
  data-slot="kanban-board"
  data-task-id={task.id}
  class={[
    'kanban-card group/card bg-card relative cursor-grab rounded-lg border p-3 transition-colors duration-150',
    'hover:border-border hover:shadow-md active:scale-[0.97] active:cursor-grabbing',
    'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
    isDone ? 'opacity-75 hover:opacity-100 focus-visible:opacity-100' : '',
  ]}
  onclick={() => onClick?.(task)}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(task)
    }
  }}
  role="button"
  tabindex="0"
  aria-label={ariaLabel}
>
  <div
    class={[
      'kanban-accent absolute top-3 bottom-3 left-0 w-[0.09375rem] rounded-full transition-colors duration-150',
      priorityConfig[task.priority]?.bg,
      task.priority === 'low' ? 'opacity-40' : task.priority === 'medium' ? 'opacity-60' : 'opacity-90',
    ]}
  ></div>

  <div class="mb-1 flex items-center justify-between pl-2">
    <span class="text-muted-foreground/70 font-mono text-xs">{task.id}</span>
    <DropdownMenu>
      <DropdownMenuTrigger>
        {#snippet child({ props })}
          <Button
            aria-label={`More actions for ${task.id}`}
            variant="ghost"
            size="icon"
            {...props}
            class="text-muted-foreground -mr-1 size-6 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 data-[state=open]:opacity-100"
            onclick={(e: MouseEvent) => {
              e.stopPropagation()
              ;(props.onclick as ((e: MouseEvent) => void) | undefined)?.(e)
            }}
          >
            <MoreHorizontal class="size-3.5" aria-hidden="true" />
          </Button>
        {/snippet}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-36">
        <DropdownMenuItem
          onclick={(e) => {
            e.stopPropagation()
            onQuickView?.(task)
          }}>Quick view</DropdownMenuItem
        >
        <DropdownMenuItem>
          <KanbanLink href="/dashboard/kanban/{task.id}" to="/dashboard/kanban/{task.id}" class="flex items-center gap-2">
            <ExternalLink class="size-3.5" />
            Open detail
          </KanbanLink>
        </DropdownMenuItem>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Move to...</DropdownMenuItem>
        <DropdownMenuItem>Assign to...</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <p class={['mb-2 pl-2 text-sm leading-snug font-medium', isDone ? 'decoration-muted-foreground/40 line-through' : '']}>
    {task.title}
  </p>

  {#if task.tags.length}
    <div class="mb-2 flex flex-wrap gap-1 pl-2">
      {#each task.tags as tag (tag.label)}
        <TagBadge label={tag.label} color={tag.color} />
      {/each}
    </div>
  {/if}

  {#if task.subtaskIds.length}
    <div class="mb-2 pl-2">
      <SubtaskProgress done={subtasksDone} total={task.subtaskIds.length} />
    </div>
  {/if}

  <div class="flex items-center gap-2 pl-2">
    {#if task.dueDate}
      <DueDateBadge dueDate={task.dueDate} variant="chip" />
    {/if}

    {#if task.commentItems.length}
      <div class="text-muted-foreground/70 flex items-center gap-1 text-xs tabular-nums">
        <MessageSquare class="size-3" />
        {task.commentItems.length}
      </div>
    {/if}

    {#if task.fileItems.length}
      <div class="text-muted-foreground/70 flex items-center gap-1 text-xs tabular-nums">
        <Paperclip class="size-3" />
        {task.fileItems.length}
      </div>
    {/if}

    <div class="ml-auto">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger>
            <UserAvatar name={task.assignee.name} color={task.assignee.color} size="xs" />
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">{task.assignee.name}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</div>

<style>
  .kanban-card {
    animation: card-in 0.25s ease-out both;
  }
  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  .kanban-card:hover .kanban-accent {
    box-shadow: 0 0 3px currentColor;
  }
</style>
