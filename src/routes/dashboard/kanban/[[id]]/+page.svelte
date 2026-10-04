<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import KanbanBoard from '$lib/components/blocks/kanban-task-board/KanbanBoard.svelte'
  import { kanban } from '$lib/composables/kanbanStore.svelte'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'

  // Seeded from createInitialColumns() via the shared kanban store; replace it
  // with a real fetcher when wiring to your DB.
  const title = $derived(routeLabel('/dashboard/kanban', $t))
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<KanbanBoard
  bind:columns={kanban.columns}
  {title}
  description="Track product work across releases, bugs, docs and customer onboarding."
  taskId={page.params.id ?? null}
  onTaskClose={() => goto('/dashboard/kanban')}
/>
