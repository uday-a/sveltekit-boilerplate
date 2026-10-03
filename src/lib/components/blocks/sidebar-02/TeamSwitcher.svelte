<script lang="ts">
  // Edit teams + activeTeam below to match your tenant model. The dropdown
  // is the full team switcher pattern -- avatar tile, label, kbd shortcut,
  // and a "Add team" footer row. Wire setActive() to your tenant API.
  import type { Component } from 'svelte'
  import { AudioWaveform, Check, ChevronsUpDown, Command, Plus } from '@lucide/svelte'
  import UipkgeMark from './UipkgeMark.svelte'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '$lib/components/ui/sidebar'
  import { t } from '$lib/i18n'

  const teams: { name: string; logo: Component; plan: string }[] = [
    { name: 'UIPKGE', logo: UipkgeMark, plan: 'SvelteKit' },
    { name: 'Globex', logo: AudioWaveform, plan: 'Startup' },
    { name: 'Initech', logo: Command, plan: 'Free' },
  ]

  // Read via `sidebar.isMobile` (not destructured) to stay subscribed.
  const sidebar = useSidebar()
  let activeTeam = $state(teams[0]!)

  function setActive(team: (typeof teams)[number]) {
    activeTeam = team
  }

  const ActiveLogo = $derived(activeTeam.logo)
</script>

<SidebarMenu data-slot="sidebar-02">
  <SidebarMenuItem>
    <DropdownMenu>
      <DropdownMenuTrigger>
        {#snippet child({ props })}
          <SidebarMenuButton
            {...props}
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!justify-center"
          >
            <div
              class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg group-data-[collapsible=icon]:size-6"
            >
              <ActiveLogo class="size-8 group-data-[collapsible=icon]:size-6" />
            </div>
            <div class="flex flex-1 flex-col justify-center gap-0.5 text-left min-w-0 group-data-[collapsible=icon]:hidden">
              <span class="truncate font-semibold text-sm leading-none tracking-tight" title={activeTeam.name}>{activeTeam.name}</span>
              <span class="truncate text-xs text-muted-foreground leading-none">{activeTeam.plan}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        {/snippet}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? 'bottom' : 'right'}
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel class="text-muted-foreground text-xs">{$t('nav.groups.teams')}</DropdownMenuLabel>
        {#each teams as team, i (team.name)}
          {@const TeamLogo = team.logo}
          <DropdownMenuItem class="gap-2 p-2" onSelect={() => setActive(team)}>
            <div class="flex size-6 items-center justify-center rounded-sm border p-0.5">
              <TeamLogo class="size-full shrink-0" />
            </div>
            {team.name}
            {#if activeTeam === team}
              <Check class="ml-auto size-4" />
            {:else}
              <DropdownMenuShortcut>⌘{i + 1}</DropdownMenuShortcut>
            {/if}
          </DropdownMenuItem>
        {/each}
        <DropdownMenuSeparator />
        <DropdownMenuItem class="gap-2 p-2">
          <div class="bg-background flex size-6 items-center justify-center rounded-md border">
            <Plus class="size-4" />
          </div>
          <div class="text-muted-foreground font-medium">{$t('nav.actions.addTeam')}</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </SidebarMenuItem>
</SidebarMenu>
