<script lang="ts">
  import { type KanbanTask, type KanbanColumn, priorityConfig, fileIconMap } from '$lib/composables/useKanban'
  import PriorityBadge from './PriorityBadge.svelte'
  import TagBadge from './TagBadge.svelte'
  import DueDateBadge from './DueDateBadge.svelte'
  import UserAvatar from './UserAvatar.svelte'
  import CommentList from './CommentList.svelte'
  import SubtaskList from './SubtaskList.svelte'
  import KanbanLink from './KanbanLink.svelte'
  import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '$lib/components/ui/sheet'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Button } from '$lib/components/ui/button'
  import { Clock, Download, ExternalLink } from '@lucide/svelte'

  interface KanbanTaskSheetProps {
    open?: boolean
    task: KanbanTask | null
    columns: KanbanColumn[]
    onMoveTask?: (task: KanbanTask, columnId: string) => void
    onAddComment?: (task: KanbanTask, text: string) => void
    /** Fires when the user opens/closes the sheet (Escape, overlay, Close). */
    onOpenChange?: (open: boolean) => void
  }

  let {
    open = $bindable(false),
    task,
    columns,
    onMoveTask,
    onAddComment,
    onOpenChange,
  }: KanbanTaskSheetProps = $props()

  const columnIdForTask = $derived.by(() => {
    if (!task) return ''
    return columns.find((c) => c.tasks.some((t) => t.id === task.id))?.id ?? ''
  })
</script>

<Sheet bind:open {onOpenChange}>
  <SheetContent data-slot="kanban-board" class="gap-0 overflow-hidden sm:max-w-[420px]">
    {#if task}
      <div class={['h-1 w-full shrink-0', priorityConfig[task.priority]?.bg]}></div>

      <SheetHeader class="shrink-0 border-b p-4 pr-12">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-muted-foreground font-mono text-xs tracking-tight">{task.id}</span>
          <span class="text-muted-foreground">·</span>
          <Select value={columnIdForTask} onValueChange={(val) => task && onMoveTask?.(task, String(val))}>
            <SelectTrigger
              aria-label="Status"
              class="hover:bg-secondary h-5 w-auto gap-1 rounded-md border-none bg-transparent px-1.5 text-xs font-medium shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {#each columns as col (col.id)}
                <SelectItem value={col.id}>
                  <span class="flex items-center gap-1.5">
                    <span class={['size-1.5 rounded-full', col.dotColor]}></span>
                    {col.title}
                  </span>
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
          <PriorityBadge priority={task.priority} iconSize="size-3" />
        </div>

        <SheetTitle class="text-base leading-snug font-semibold tracking-tight">
          {task.title}
        </SheetTitle>
        <SheetDescription class="sr-only">Task details</SheetDescription>
      </SheetHeader>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="space-y-4">
          {#if task.description}
            <div class="text-muted-foreground rich-text-content prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
              <!-- Renders HTML produced by this block's own RichTextEditor (tiptap). Sanitize (e.g. DOMPurify) before rendering untrusted stored HTML. -->
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html task.description}
            </div>
          {:else}
            <p class="text-muted-foreground text-sm leading-relaxed">No description provided.</p>
          {/if}

          <div class="flex flex-wrap gap-1.5">
            {#if task.tags.length}
              {#each task.tags as tag (tag.label)}
                <TagBadge label={tag.label} color={tag.color} />
              {/each}
            {:else}
              <span class="text-muted-foreground text-xs">No tags</span>
            {/if}
          </div>

          <div class="bg-border h-px"></div>

          <div class="flex items-center gap-3">
            <UserAvatar name={task.assignee.name} color={task.assignee.color} size="md" />
            <div>
              <p class="text-sm leading-tight font-medium">{task.assignee.name}</p>
              <p class="text-muted-foreground text-xs">Assignee</p>
            </div>
            <div class="ml-auto text-right">
              {#if task.dueDate}
                <DueDateBadge dueDate={task.dueDate} />
              {:else}
                <p class="text-muted-foreground flex items-center gap-1 text-sm leading-tight">
                  <Clock class="size-3" />
                  No due date
                </p>
              {/if}
            </div>
          </div>

          {#if task.parentId}
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground text-xs">Parent:</span>
              <KanbanLink
                href="/dashboard/kanban/{task.parentId}"
                class="text-primary text-xs font-medium hover:underline"
                onclick={() => (open = false)}
              >
                {task.parentId}
              </KanbanLink>
            </div>
          {/if}

          <div>
            <h4 class="mb-2 text-sm font-semibold">
              Subtasks
              {#if task.subtaskIds.length}
                <span class="text-muted-foreground font-normal">({task.subtaskIds.length})</span>
              {/if}
            </h4>
            <SubtaskList subtaskIds={task.subtaskIds} {columns} compact />
          </div>

          <div class="bg-border h-px"></div>

          <div>
            <h4 class="mb-2 text-sm font-semibold">
              Comments
              {#if task.commentItems.length}
                <span class="text-muted-foreground font-normal">({task.commentItems.length})</span>
              {/if}
            </h4>
            <CommentList
              comments={task.commentItems}
              compact
              onAdd={(text) => task && onAddComment?.(task, text)}
            />
          </div>

          <div class="bg-border h-px"></div>

          <div>
            <h4 class="mb-2 text-sm font-semibold">
              Files
              {#if task.fileItems.length}
                <span class="text-muted-foreground font-normal">({task.fileItems.length})</span>
              {/if}
            </h4>
            {#if task.fileItems.length}
              <div class="space-y-1">
                {#each task.fileItems as file (file.id)}
                  {@const FileIcon = fileIconMap[file.type] ?? fileIconMap.other}
                  <div class="hover:bg-muted/50 group/file flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors">
                    <div class="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md">
                      {#if FileIcon}
                        <FileIcon class="text-muted-foreground size-4" />
                      {/if}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-medium" title={file.name}>{file.name}</p>
                      <p class="text-muted-foreground text-xs">{file.size}</p>
                    </div>
                    <Button
                      aria-label="Download attachment"
                      variant="ghost"
                      size="icon"
                      class="size-7 shrink-0 opacity-0 transition-opacity group-hover/file:opacity-100"
                    >
                      <Download class="size-3.5" />
                    </Button>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-muted-foreground text-xs">No files attached.</p>
            {/if}
          </div>
        </div>
      </div>

      <SheetFooter class="shrink-0 border-t p-4">
        <div class="flex w-full items-center gap-2">
          <KanbanLink href="/dashboard/kanban/{task.id}" class="flex-1" onclick={() => (open = false)}>
            <Button variant="outline" size="sm" class="w-full gap-1.5">
              <ExternalLink class="size-3.5" />
              View full detail
            </Button>
          </KanbanLink>
          <SheetClose>
            {#snippet child({ props })}
              <Button variant="ghost" size="sm" {...props}>Close</Button>
            {/snippet}
          </SheetClose>
        </div>
      </SheetFooter>
    {/if}
  </SheetContent>
</Sheet>
