<script lang="ts" module>
  export interface SimpleKanbanItem {
    id: string
    title: string
    description?: string
    date?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    tag?: string
    tagColor?: string
    assignee?: {
      name: string
      initials?: string
      avatar?: string
    }
  }

  export interface SimpleKanbanColumn {
    id: string
    title: string
    color?: string
    dotColor?: string
    items: SimpleKanbanItem[]
  }
</script>

<script lang="ts">
  import { Plus, Calendar, GripVertical, Check } from '@lucide/svelte'
  import { cn } from '$lib/utils'
  import { Button } from '$lib/components/ui/button'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'

  interface SimpleKanbanProps {
    columns?: SimpleKanbanColumn[]
    allowAdd?: boolean
    className?: string
    cardClassName?: string
    onColumnsChange?: (columns: SimpleKanbanColumn[]) => void
    onCardClick?: (item: SimpleKanbanItem, columnId: string) => void
    onCardMove?: (item: SimpleKanbanItem, fromColumnId: string, toColumnId: string, newIndex: number) => void
    onAddItem?: (columnId: string, title: string) => void
  }

  let {
    columns = $bindable([]),
    allowAdd = true,
    className,
    cardClassName,
    onColumnsChange,
    onCardClick,
    onCardMove,
    onAddItem,
  }: SimpleKanbanProps = $props()

  const DEFAULT_DOT_COLORS: Record<string, string> = {
    backlog: 'bg-muted-foreground/60',
    todo: 'bg-chart-1',
    'in-progress': 'bg-chart-3',
    review: 'bg-chart-4',
    done: 'bg-chart-2',
  }

  const PRIORITY_STYLES: Record<string, { label: string; class: string }> = {
    low: { label: 'Low', class: 'bg-muted text-muted-foreground' },
    medium: { label: 'Medium', class: 'bg-info/10 text-info' },
    high: { label: 'High', class: 'bg-warning/10 text-warning' },
    urgent: { label: 'Urgent', class: 'bg-destructive/10 text-destructive font-medium' },
  }

  let draggedId = $state<string | null>(null)
  let dragOverColumnId = $state<string | null>(null)
  let dropTargetIndex = $state(-1)
  let addingColumnId = $state<string | null>(null)
  let newTitle = $state('')
  let lastDragTime = 0

  function handleDragStart(e: DragEvent, id: string) {
    draggedId = id
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    }
  }

  function handleDragEnd() {
    draggedId = null
    dragOverColumnId = null
    dropTargetIndex = -1
    lastDragTime = Date.now()
  }

  function handleDragOverColumn(e: DragEvent, columnId: string, itemsCount: number) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dragOverColumnId = columnId
    dropTargetIndex = itemsCount
  }

  function handleCardDragOver(e: DragEvent, columnId: string, index: number) {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dragOverColumnId = columnId
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    dropTargetIndex = e.clientY < midY ? index : index + 1
  }

  function commit(next: SimpleKanbanColumn[]) {
    columns = next
    onColumnsChange?.(next)
  }

  function handleDrop(e: DragEvent, targetColumnId: string) {
    e.preventDefault()
    if (!draggedId || !targetColumnId) {
      handleDragEnd()
      return
    }

    const next = columns.map((col) => ({
      ...col,
      items: [...col.items],
    }))

    let sourceColIdx = -1
    let itemIdx = -1
    for (let c = 0; c < next.length; c++) {
      const col = next[c]
      if (!col) continue
      const idx = col.items.findIndex((item) => item.id === draggedId)
      if (idx !== -1) {
        sourceColIdx = c
        itemIdx = idx
        break
      }
    }

    const targetColIdx = next.findIndex((c) => c.id === targetColumnId)
    if (sourceColIdx === -1 || targetColIdx === -1) {
      handleDragEnd()
      return
    }

    const sourceCol = next[sourceColIdx]
    const targetCol = next[targetColIdx]
    if (!sourceCol || !targetCol) {
      handleDragEnd()
      return
    }

    const [removed] = sourceCol.items.splice(itemIdx, 1)
    if (!removed) {
      handleDragEnd()
      return
    }

    let at = dropTargetIndex
    if (at < 0) at = targetCol.items.length
    if (sourceColIdx === targetColIdx && itemIdx < at) at--

    targetCol.items.splice(at, 0, removed)
    commit(next)
    onCardMove?.(removed, sourceCol.id, targetColumnId, at)

    handleDragEnd()
  }

  function handleInlineAdd(columnId: string) {
    if (!newTitle.trim()) {
      addingColumnId = null
      return
    }

    const text = newTitle.trim()
    onAddItem?.(columnId, text)

    const next = columns.map((col) => ({
      ...col,
      items: [...col.items],
    }))
    const col = next.find((c) => c.id === columnId)
    if (col) {
      col.items.push({
        id: `item-${Date.now()}`,
        title: text,
      })
      commit(next)
    }

    newTitle = ''
    addingColumnId = null
  }

  function handleCardClick(item: SimpleKanbanItem, columnId: string) {
    if (Date.now() - lastDragTime < 150) return
    onCardClick?.(item, columnId)
  }
</script>

<div
  data-slot="simple-kanban"
  class={cn('flex min-h-[380px] w-full [scrollbar-width:thin] items-start gap-4 overflow-x-auto pb-4', className)}
>
  {#each columns as column (column.id)}
    <div
      data-slot="kanban-column"
      class={cn(
        'bg-muted/40 flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors',
        dragOverColumnId === column.id && 'border-primary/50 bg-muted/60 ring-primary/10 ring-2',
      )}
      ondragover={(e) => handleDragOverColumn(e, column.id, column.items.length)}
      ondrop={(e) => handleDrop(e, column.id)}
    >
      <!-- Column Header -->
      <div class="mb-3 flex items-center justify-between gap-2 px-1">
        <div class="flex items-center gap-2">
          <span
            class={cn(
              'size-2 rounded-full',
              column.dotColor || column.color || DEFAULT_DOT_COLORS[column.id] || 'bg-primary',
            )}
          ></span>
          <h3 class="text-foreground text-sm font-semibold tracking-tight">{column.title}</h3>
          <span class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
            {column.items.length}
          </span>
        </div>
        {#if allowAdd}
          <Button
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-foreground size-7 rounded-lg"
            aria-label="Add item to {column.title}"
            onclick={() => {
              addingColumnId = column.id
              newTitle = ''
            }}
          >
            <Plus class="size-3.5" />
          </Button>
        {/if}
      </div>

      <!-- Column Cards Container -->
      <div class="flex min-h-[120px] flex-1 flex-col gap-2.5">
        <!-- Inline quick add input -->
        {#if addingColumnId === column.id}
          <div
            class="bg-card border-border animate-in fade-in zoom-in-95 rounded-lg border p-2.5 shadow-xs duration-150"
          >
            <input
              bind:value={newTitle}
              type="text"
              autofocus
              placeholder="Item title..."
              class="placeholder:text-muted-foreground w-full bg-transparent text-sm font-medium outline-none"
              onkeydown={(e) => {
                if (e.key === 'Enter') handleInlineAdd(column.id)
                if (e.key === 'Escape') addingColumnId = null
              }}
            />
            <div class="mt-2.5 flex items-center justify-end gap-1.5">
              <Button size="sm" variant="ghost" class="h-7 px-2 text-xs" onclick={() => (addingColumnId = null)}>
                Cancel
              </Button>
              <Button size="sm" class="h-7 gap-1 px-2.5 text-xs" onclick={() => handleInlineAdd(column.id)}>
                <Check class="size-3" />
                Add
              </Button>
            </div>
          </div>
        {/if}

        <!-- Cards list -->
        {#each column.items as item, index (item.id)}
          {#if dragOverColumnId === column.id && dropTargetIndex === index && draggedId !== item.id}
            <div class="bg-primary/20 h-1.5 w-full rounded-full"></div>
          {/if}
          <div
            role="button"
            tabindex="0"
            draggable="true"
            data-slot="kanban-card"
            class={cn(
              'group bg-card text-card-foreground relative flex cursor-grab flex-col gap-2 rounded-lg border p-3 shadow-xs transition-colors hover:shadow-sm active:cursor-grabbing',
              draggedId === item.id && 'ring-primary/40 opacity-40 shadow-md ring-2',
              cardClassName,
            )}
            ondragstart={(e) => handleDragStart(e, item.id)}
            ondragend={handleDragEnd}
            ondragover={(e) => handleCardDragOver(e, column.id, index)}
            onclick={() => handleCardClick(item, column.id)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCardClick(item, column.id)
              }
            }}
          >
            <!-- Top row: Title + Grip handle -->
            <div class="flex items-start justify-between gap-2">
              <p class="text-foreground line-clamp-2 text-sm leading-snug font-medium">
                {item.title}
              </p>
              <GripVertical
                class="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>

            <!-- Optional description -->
            {#if item.description}
              <p class="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                {item.description}
              </p>
            {/if}

            <!-- Metadata row: Date, Tag, Priority, Assignee -->
            {#if item.date || item.tag || item.priority || item.assignee}
              <div class="mt-1 flex flex-wrap items-center justify-between gap-1.5 border-t pt-1 text-xs">
                <div class="flex flex-wrap items-center gap-1.5">
                  {#if item.date}
                    <div class="text-muted-foreground flex items-center gap-1 text-xs">
                      <Calendar class="text-muted-foreground size-3" />
                      <span>{item.date}</span>
                    </div>
                  {/if}

                  {#if item.tag}
                    <span class={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', item.tagColor || 'bg-secondary text-secondary-foreground')}>
                      {item.tag}
                    </span>
                  {/if}

                  {#if item.priority && PRIORITY_STYLES[item.priority]}
                    <span class={cn('rounded-md px-1.5 py-0.5 text-xs', PRIORITY_STYLES[item.priority].class)}>
                      {PRIORITY_STYLES[item.priority].label}
                    </span>
                  {/if}
                </div>

                {#if item.assignee}
                  <Avatar class="border-background size-5 shrink-0 border">
                    <AvatarFallback class="text-xs font-medium">
                      {item.assignee.initials || item.assignee.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                {/if}
              </div>
            {/if}
          </div>
        {/each}

        <!-- Trailing drop indicator -->
        {#if dragOverColumnId === column.id && dropTargetIndex >= column.items.length && draggedId}
          <div class="bg-primary/20 h-1.5 w-full rounded-full"></div>
        {/if}

        <!-- Empty column placeholder -->
        {#if column.items.length === 0 && addingColumnId !== column.id}
          <div
            class="text-muted-foreground flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 text-center text-xs"
          >
            Drop items here
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>
