<script lang="ts">
  import { Search, Filter, ChevronDown, X, LayoutGrid, List } from '@lucide/svelte'
  import { Input } from '$lib/components/ui/input'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { priorityConfig, assignees, getInitials } from '$lib/composables/useKanban'
  import { t } from '$lib/i18n'

  interface KanbanToolbarProps {
    searchQuery?: string
    selectedPriority?: string | null
    selectedAssignee?: string | null
    viewMode?: 'board' | 'list'
  }

  let {
    searchQuery = $bindable(''),
    selectedPriority = $bindable(null),
    selectedAssignee = $bindable(null),
    viewMode = $bindable('board'),
  }: KanbanToolbarProps = $props()

  // WHY (Rule70): chip labels resolve through the same priority config the
  // dropdown uses, so the chip value always matches the menu wording.
  const priorityLabel = $derived(
    selectedPriority ? (priorityConfig as Record<string, { label: string }>)[selectedPriority]?.label ?? selectedPriority : '',
  )
</script>

<div>
<div data-slot="kanban-board" class="mb-3 flex shrink-0 items-center gap-2">
  <div class="relative w-56">
    <Search class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
    <Input bind:value={searchQuery} placeholder="Search tasks..." class="h-8 pl-8 text-sm" />
  </div>

  <DropdownMenu>
    <DropdownMenuTrigger>
      {#snippet child({ props })}
        <Button variant="outline" size="sm" {...props} class="h-8 gap-1.5 text-xs">
          <Filter class="size-3" />
          Priority
          {#if selectedPriority}
            <Badge variant="default" class="ml-0.5 h-4 min-w-4 justify-center rounded px-1 text-xs">1</Badge>
          {/if}
          <ChevronDown class="text-muted-foreground size-3" />
        </Button>
      {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-40">
      {#each Object.entries(priorityConfig) as [key, config] (key)}
        {@const Icon = config.icon}
        <DropdownMenuItem
          class="gap-2"
          onclick={() => (selectedPriority = selectedPriority === key ? null : key)}
        >
          <Icon class={['size-3.5', config.class]} />
          {config.label}
          {#if selectedPriority === key}
            <span class="bg-primary ml-auto size-1.5 rounded-full"></span>
          {/if}
        </DropdownMenuItem>
      {/each}
      {#if selectedPriority}
        <DropdownMenuSeparator />
        <DropdownMenuItem onclick={() => (selectedPriority = null)}>Clear filter</DropdownMenuItem>
      {/if}
    </DropdownMenuContent>
  </DropdownMenu>

  {#if selectedAssignee}
    <Badge
      variant="secondary"
      class="h-7 cursor-pointer gap-1 pr-1.5 text-xs"
      onclick={() => (selectedAssignee = null)}
    >
      {selectedAssignee}
      <X class="size-3 opacity-50" />
    </Badge>
  {/if}

  <ToggleGroup
    type="single"
    size="sm"
    animated={false}
    value={viewMode}
    onValueChange={(v) => {
      if (v) viewMode = v as 'board' | 'list'
    }}
    class="bg-muted ml-auto flex items-center gap-0.5 rounded-md p-0.5"
  >
    <!-- WHY (Rule76): board/list toggles were title-only -- they now carry
       an accessible name and a tooltip like every other icon trigger. -->
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger>
          <ToggleGroupItem
            value="board"
            class="data-[state=on]:bg-background size-7 rounded-sm p-0 data-[state=on]:shadow-sm"
            aria-label={$t('dashboard.kanban.boardView')}
          >
            <LayoutGrid class="size-3.5" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{$t('dashboard.kanban.boardView')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <ToggleGroupItem
            value="list"
            class="data-[state=on]:bg-background size-7 rounded-sm p-0 data-[state=on]:shadow-sm"
            aria-label={$t('dashboard.kanban.listView')}
          >
            <List class="size-3.5" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>{$t('dashboard.kanban.listView')}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </ToggleGroup>

  <div class="flex items-center">
    <TooltipProvider delayDuration={300}>
      {#each Object.entries(assignees) as [key, a] (key)}
        <Tooltip>
          <TooltipTrigger>
            <button
              class={[
                // rounded-full so the selected ring + focus ring trace the
                // Avatar's circular outline instead of the rectangular button.
                'ring-background focus-visible:ring-ring/50 relative -ml-1.5 rounded-full transition-colors outline-none first:ml-0 focus-visible:ring-1',
                selectedAssignee === a.name
                  ? 'ring-primary z-20 ring-1'
                  : selectedAssignee && selectedAssignee !== a.name
                    ? 'opacity-40 hover:opacity-70'
                    : 'hover:z-10 hover:scale-110',
              ]}
              onclick={() => (selectedAssignee = selectedAssignee === a.name ? null : a.name)}
            >
              <Avatar class="border-background size-7 border-2">
                <AvatarFallback class={['text-xs font-semibold', a.color]}>
                  {getInitials(a.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" class="text-xs">
            {a.name}
            {#if selectedAssignee === a.name}
              <span class="text-muted-foreground ml-1">(filtered)</span>
            {/if}
          </TooltipContent>
        </Tooltip>
      {/each}
    </TooltipProvider>
  </div>
</div>
<!-- WHY (Rule70): active-filter chip row for priority/assignee/search --
     same contract as the data table: value + clear. -->
{#if selectedPriority || selectedAssignee || searchQuery.trim()}
  <div class="mb-3 flex flex-wrap items-center gap-1.5">
    {#if selectedPriority}
      <Badge variant="secondary" class="gap-1 py-0.5 pr-1 text-xs">
        {$t('dashboard.kanban.priority')}: {priorityLabel}
        <button
          type="button"
          class="hover:text-foreground inline-flex items-center rounded-full p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={$t('dashboard.kanban.clearFilter')}
          onclick={() => (selectedPriority = null)}
        >
          <X class="size-3" aria-hidden="true" />
        </button>
      </Badge>
    {/if}
    {#if selectedAssignee}
      <Badge variant="secondary" class="gap-1 py-0.5 pr-1 text-xs">
        {$t('dashboard.kanban.assignee')}: {selectedAssignee}
        <button
          type="button"
          class="hover:text-foreground inline-flex items-center rounded-full p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={$t('dashboard.kanban.clearFilter')}
          onclick={() => (selectedAssignee = null)}
        >
          <X class="size-3" aria-hidden="true" />
        </button>
      </Badge>
    {/if}
    {#if searchQuery.trim()}
      <Badge variant="secondary" class="max-w-56 gap-1 py-0.5 pr-1 text-xs">
        <span class="truncate">{$t('dashboard.kanban.search')}: "{searchQuery.trim()}"</span>
        <button
          type="button"
          class="hover:text-foreground inline-flex shrink-0 items-center rounded-full p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={$t('dashboard.kanban.clearFilter')}
          onclick={() => (searchQuery = '')}
        >
          <X class="size-3" aria-hidden="true" />
        </button>
      </Badge>
    {/if}
  </div>
{/if}
</div>
