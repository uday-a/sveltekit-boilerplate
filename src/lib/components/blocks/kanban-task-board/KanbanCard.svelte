<script lang="ts">
  import { type KanbanTask, type KanbanColumn, priorityConfig, getTaskColumn } from '$lib/composables/useKanban'
  import TagBadge from './TagBadge.svelte'
  import SubtaskProgress from './SubtaskProgress.svelte'
  import DueDateBadge from './DueDateBadge.svelte'
  import UserAvatar from './UserAvatar.svelte'
  import PriorityBadge from './PriorityBadge.svelte'
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
    [task.title, getTaskColumn(columns, task.id)?.title, `${priorityConfig[task.priority].label} priority`]
      .filter(Boolean)
      .join(', '),
  )
</script>

<!-- Not a button itself: the title is the card's one button, stretched
     over the card with `after:inset-0`; the menu and avatar sit above it. -->
<div
  data-slot="kanban-board"
  data-task-id={task.id}
  class={[
    'animate-in fade-in-0 slide-in-from-bottom-1.5 duration-200 group/card bg-card relative cursor-grab rounded-lg border p-3 transition-all',
    'hover:border-border hover:shadow-md active:scale-[0.97] active:cursor-grabbing',
  ]}
>
  <div
    class={[
      'absolute top-3 bottom-3 left-0 w-[1.5px] rounded-full transition-all duration-150',
      priorityConfig[task.priority].bg,
      task.priority === 'low' ? 'opacity-40' : task.priority === 'medium' ? 'opacity-60' : 'opacity-90',
    ]}
  ></div>

  <div class="mb-1 flex items-center justify-between pl-2">
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground font-mono text-xs">{task.id}</span>
      {#if task.priority === 'urgent' || task.priority === 'high'}
        <PriorityBadge priority={task.priority} />
      {/if}
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger>
        {#snippet child({ props })}
          <Button
            aria-label={`More actions for ${task.id}`}
            variant="ghost"
            size="icon"
            {...props}
            class="text-muted-foreground relative z-10 -mr-1 size-6 opacity-0 transition-opacity group-focus-within/card:opacity-100 group-hover/card:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal class="size-3.5" aria-hidden="true" />
          </Button>
        {/snippet}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-36">
        <DropdownMenuItem onclick={() => onQuickView?.(task)}>Quick view</DropdownMenuItem>
        <DropdownMenuItem>
          <KanbanLink href="/dashboard/kanban/{task.id}" class="flex w-full items-center gap-2">
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

  <button
    type="button"
    data-card-title
    aria-label={ariaLabel}
    class={[
      'mb-2 block w-full cursor-[inherit] pl-2 text-left text-sm leading-snug font-medium outline-none',
      'after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50',
      isDone ? 'decoration-muted-foreground/40 line-through' : '',
    ]}
    onclick={() => onClick?.(task)}
  >
    {task.title}
  </button>

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
      <div class="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
        <MessageSquare class="size-3" />
        {task.commentItems.length}
      </div>
    {/if}

    {#if task.fileItems.length}
      <div class="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
        <Paperclip class="size-3" />
        {task.fileItems.length}
      </div>
    {/if}

    <div class="relative z-10 ml-auto">
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
