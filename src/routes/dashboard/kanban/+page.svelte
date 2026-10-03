<script lang="ts">
  import KanbanBoard from '$lib/components/blocks/kanban-task-board/KanbanBoard.svelte'
  import { createInitialColumns } from '$lib/composables/kanbanData'
  import type { KanbanColumn } from '$lib/composables/useKanban'
  import { t } from '$lib/i18n'

  // Port of nuxt `app/pages/dashboard/kanban.vue`. Columns live in local
  // $state (nuxt used useState for SSR-shared state; a module-level rune
  // would leak across users on the server, so per-page state is correct).
  let columns = $state<KanbanColumn[]>(createInitialColumns())
</script>

<svelte:head>
  <title>Kanban | UIPKGE</title>
</svelte:head>

<KanbanBoard
  bind:columns
  title={$t('nav.items.kanban')}
  description="Demo board seeded from the registry's kanban-data lib. Swap createInitialColumns() for a real fetcher when wiring to your DB."
/>
