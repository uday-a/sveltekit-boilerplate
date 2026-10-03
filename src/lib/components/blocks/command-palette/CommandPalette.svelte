<script lang="ts" module>
  import type { Component } from 'svelte'

  export interface CommandPaletteItem {
    label: string
    value?: string
    hint?: string
    icon?: Component
    onSelect?: () => void
  }

  export interface CommandPaletteGroup {
    heading: string
    items: CommandPaletteItem[]
  }

  export interface CommandPaletteProps {
    groups?: CommandPaletteGroup[]
    placeholder?: string
    triggerLabel?: string
    showTrigger?: boolean
    /** Controlled open state (`bind:open`) — the Svelte counterpart of the Vue twin's exposed show()/hide()/toggle(). */
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSelect?: (item: CommandPaletteItem) => void
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import { FileText, Inbox, KanbanSquare, LayoutDashboard, Search, Settings, Users } from '@lucide/svelte'
  import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
  } from '$lib/components/ui/command'

  let {
    groups = [
      {
        heading: 'Navigate',
        items: [
          { label: 'Dashboard', hint: '/dashboard', icon: LayoutDashboard },
          { label: 'Messages', hint: '/dashboard/messages', icon: Inbox },
          { label: 'Kanban', hint: '/dashboard/kanban', icon: KanbanSquare },
          { label: 'Team', hint: '/settings/team', icon: Users },
        ],
      },
      {
        heading: 'Settings',
        items: [
          { label: 'General', hint: '/settings/general', icon: FileText },
          { label: 'Settings', hint: '/settings', icon: Settings },
        ],
      },
    ],
    placeholder = 'Search pages, commands…',
    triggerLabel = 'Search…',
    showTrigger = true,
    open = $bindable(false),
    onOpenChange,
    onSelect,
  }: CommandPaletteProps = $props()

  function setOpen(next: boolean) {
    open = next
    onOpenChange?.(next)
  }

  function pick(item: CommandPaletteItem) {
    setOpen(false)
    item.onSelect?.()
    onSelect?.(item)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen(!open)
    }
  }

  const triggerShortcut = $derived.by(() => {
    if (typeof navigator === 'undefined') return '⌘K'
    return /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘K' : 'Ctrl K'
  })

  onMount(() => {
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  })
</script>

{#if showTrigger}
  <button
    data-slot="command-palette"
    type="button"
    class="bg-background border-input hover:bg-accent hover:text-foreground text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 relative hidden h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-sm shadow-xs transition-colors outline-none focus-visible:ring-[3px] sm:flex md:w-[180px] lg:w-[240px]"
    aria-label="Open command palette"
    onclick={() => setOpen(true)}
  >
    <Search class="size-3.5 shrink-0" />
    <span class="flex-1 truncate text-left">{triggerLabel}</span>
    <kbd
      class="bg-muted/80 text-muted-foreground pointer-events-none flex h-5 items-center justify-center rounded-md border px-1.5 font-mono text-xs font-medium"
    >
      <span>{triggerShortcut}</span>
    </kbd>
  </button>
{/if}

<CommandDialog bind:open {onOpenChange} title="Command palette" description="Search pages and run commands">
  <CommandInput {placeholder} />
  <CommandList class="max-h-[30rem]">
    <CommandEmpty>No matches.</CommandEmpty>
    {#each groups as group, gi (group.heading)}
      <CommandGroup heading={group.heading}>
        {#each group.items as item (`${group.heading}-${item.label}`)}
          {@const ItemIcon = item.icon}
          <CommandItem value={`${group.heading} ${item.label} ${item.hint ?? ''}`} onSelect={() => pick(item)}>
            {#if ItemIcon}
              <ItemIcon class="size-4" />
            {/if}
            <span>{item.label}</span>
            {#if item.hint}
              <CommandShortcut class="text-muted-foreground/70">{item.hint}</CommandShortcut>
            {/if}
          </CommandItem>
        {/each}
      </CommandGroup>
      {#if gi < groups.length - 1}
        <CommandSeparator />
      {/if}
    {/each}
  </CommandList>
</CommandDialog>
