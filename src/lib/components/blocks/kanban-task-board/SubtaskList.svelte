<script lang="ts">
  import type { KanbanColumn } from '$lib/composables/useKanban'
  import { findTaskById, getTaskColumn } from '$lib/composables/useKanban'
  import KanbanLink from './KanbanLink.svelte'

  interface SubtaskListProps {
    subtaskIds: string[]
    columns: KanbanColumn[]
    compact?: boolean
  }

  let { subtaskIds, columns, compact = false }: SubtaskListProps = $props()

  const subtasks = $derived(
    subtaskIds
      .map((id) => {
        const task = findTaskById(columns, id)
        const column = getTaskColumn(columns, id)
        return task ? { task, column } : null
      })
      .filter((s): s is NonNullable<typeof s> => s !== null),
  )

  const doneCount = $derived(subtasks.filter((s) => s.column?.id === 'done').length)
  const percent = $derived(subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0)
</script>

{#if subtasks.length}
  <div data-slot="kanban-board">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-muted-foreground text-xs tabular-nums">{doneCount}/{subtasks.length} done</span>
      <span class="text-muted-foreground text-xs font-medium tabular-nums">{percent}%</span>
    </div>
    <div class="bg-muted mb-3 h-1.5 overflow-hidden rounded-full">
      <div
        class={[
          'h-full rounded-full transition-[width,background-color] duration-500',
          doneCount === subtasks.length ? 'bg-success' : 'bg-primary',
        ]}
        style="width: {percent}%"
      ></div>
    </div>

    <div class={compact ? 'space-y-0.5' : 'space-y-1'}>
      {#each subtasks as { task, column } (task.id)}
        <KanbanLink
          href="/dashboard/kanban/{task.id}"
          to="/dashboard/kanban/{task.id}"
          class={[
            'group/subtask flex items-center gap-2 rounded-md transition-colors',
            compact ? 'px-1 py-1' : 'px-1.5 py-1.5',
            'hover:bg-muted/50',
          ].join(' ')}
        >
          <span class={['size-1.5 shrink-0 rounded-full', column?.dotColor ?? 'bg-muted-foreground']}></span>
          <span class="text-muted-foreground shrink-0 font-mono text-xs">
            {task.id}
          </span>
          <span
            class={[
              'min-w-0 flex-1 truncate',
              compact ? 'text-xs' : 'text-sm',
              column?.id === 'done' ? 'text-muted-foreground line-through' : 'text-foreground',
            ]}
          >
            {task.title}
          </span>
          <span class={['shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium', column?.color ?? 'text-muted-foreground']}>
            {column?.title ?? 'Unknown'}
          </span>
        </KanbanLink>
      {/each}
    </div>
  </div>
{:else}
  <p class={compact ? 'text-muted-foreground text-xs' : 'text-muted-foreground text-sm'}>No subtasks yet.</p>
{/if}
