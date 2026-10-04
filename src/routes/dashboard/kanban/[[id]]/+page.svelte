<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import KanbanBoard from '$lib/components/blocks/kanban-task-board/KanbanBoard.svelte'
  import { createInitialColumns } from '$lib/composables/kanbanData'
  import type { KanbanColumn } from '$lib/composables/useKanban'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'

  // Seeded from createInitialColumns(); replace it with a real fetcher when wiring to your DB.
  // Per-page $state (a module-level rune would leak across users on the server).
  let columns = $state<KanbanColumn[]>(createInitialColumns())
  const title = $derived(routeLabel('/dashboard/kanban', $t))
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<KanbanBoard
  bind:columns
  {title}
  description="Track product work across releases, bugs, docs and customer onboarding."
  taskId={page.params.id ?? null}
  onTaskClose={() => goto('/dashboard/kanban')}
/>
