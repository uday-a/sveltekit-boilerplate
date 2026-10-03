<script lang="ts" module>
  import type { Component } from 'svelte'

  export interface NavProjectsProps {
    projects: {
      name: string
      url: string
      icon: Component
      isActive?: boolean
    }[]
  }
</script>

<script lang="ts">
  import { Folder, Forward, MoreHorizontal, Trash2 } from '@lucide/svelte'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
  } from '$lib/components/ui/sidebar'
  import { t } from '$lib/i18n'

  let { projects }: NavProjectsProps = $props()

  // Read via `sidebar.isMobile` (not destructured) to stay subscribed.
  const sidebar = useSidebar()
</script>

<!-- Upstream shadcn-vue hides this entire group on icon-mode collapse
     with `group-data-[collapsible=icon]:hidden`. We keep it visible so
     the project icons stay reachable in the narrow column; the
     SidebarGroupLabel below and the `<span>` children of each
     SidebarMenuButton already self-hide on collapse, leaving an
     icon-only column that lines up with NavMain. -->
<SidebarGroup>
  <SidebarGroupLabel>{$t('nav.groups.projects')}</SidebarGroupLabel>
  <SidebarMenu>
    {#each projects as item (item.name)}
      {@const ItemIcon = item.icon}
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={item.isActive}
          class="data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary dark:data-[active=true]:text-white data-[active=true]:font-medium data-[active=true]:[&>svg]:text-sidebar-primary dark:data-[active=true]:[&>svg]:text-white"
        >
          {#snippet child({ props })}
            <a href={item.url} {...props}>
              <ItemIcon />
              <span>{item.name}</span>
            </a>
          {/snippet}
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child({ props })}
              <SidebarMenuAction {...props} showOnHover>
                <MoreHorizontal />
                <span class="sr-only">{$t('nav.actions.more')}</span>
              </SidebarMenuAction>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-48 rounded-lg"
            side={sidebar.isMobile ? 'bottom' : 'right'}
            align={sidebar.isMobile ? 'end' : 'start'}
          >
            <DropdownMenuItem>
              <Folder class="text-muted-foreground" />
              <span>{$t('nav.actions.viewProject')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Forward class="text-muted-foreground" />
              <span>{$t('nav.actions.shareProject')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Trash2 class="text-muted-foreground" />
              <span>{$t('nav.actions.deleteProject')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    {/each}
    <SidebarMenuItem>
      <SidebarMenuButton>
        <MoreHorizontal />
        <span>{$t('nav.actions.more')}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarGroup>
