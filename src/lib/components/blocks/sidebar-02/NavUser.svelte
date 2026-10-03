<script lang="ts" module>
  export interface NavUserProps {
    user: {
      name: string
      email: string
      avatar?: string
    }
    onLogout?: () => void
    onProfileSelect?: (key: string) => void
  }
</script>

<script lang="ts">
  import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Monitor,
    Moon,
    Palette,
    Sparkles,
    Sun,
  } from '@lucide/svelte'
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '$lib/components/ui/sidebar'
  import { themeStore, type Theme } from '$lib/theme.svelte'
  import { t } from '$lib/i18n'

  let { user, onLogout, onProfileSelect }: NavUserProps = $props()

  // Read via `sidebar.isMobile` (not destructured) to stay subscribed.
  const sidebar = useSidebar()

  // App theme comes from the shared cookie-backed store (not local state)
  // so the sidebar radio group, header ThemeSwitch, and SSR stay in sync.

  const initials = $derived.by(() => {
    const parts = user.name.trim().split(/\s+/).slice(0, 2)
    return parts.map((p) => p[0]?.toUpperCase()).join('') || 'U'
  })
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
            <Avatar class="size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:size-6">
              {#if user.avatar}
                <AvatarImage src={user.avatar} alt={user.name} />
              {/if}
              <AvatarFallback class="rounded-lg text-xs group-data-[collapsible=icon]:text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span class="truncate font-medium" title={user.name}>{user.name}</span>
              <span class="truncate text-xs" title={user.email}>{user.email}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        {/snippet}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar class="size-8 rounded-lg">
              {#if user.avatar}
                <AvatarImage src={user.avatar} alt={user.name} />
              {/if}
              <AvatarFallback class="rounded-lg text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold" title={user.name}>{user.name}</span>
              <span class="truncate text-xs" title={user.email}>{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles />
            {$t('nav.user.upgrade')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onProfileSelect?.('account')}>
            <BadgeCheck />
            {$t('nav.user.account')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onProfileSelect?.('billing')}>
            <CreditCard />
            {$t('nav.user.billing')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onProfileSelect?.('notifications')}>
            <Bell />
            {$t('nav.user.notifications')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette />
            Theme
            <span class="text-muted-foreground ml-auto text-xs capitalize">{themeStore.current}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent class="min-w-36">
            <DropdownMenuRadioGroup
              value={themeStore.current}
              onValueChange={(v) => themeStore.set(v as Theme)}
            >
              <DropdownMenuRadioItem value="light"><Sun /> Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark"><Moon /> Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system"><Monitor /> System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onLogout?.()}>
          <LogOut />
          {$t('nav.user.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </SidebarMenuItem>
</SidebarMenu>
