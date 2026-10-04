<script lang="ts">
  import { FolderKanban, LayoutDashboard, Settings } from '@lucide/svelte'
  import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
  } from '$lib/components/ui/sidebar'

  const items = [
    { title: 'Dashboard', icon: LayoutDashboard, active: true },
    { title: 'Projects', icon: FolderKanban, active: false },
    { title: 'Settings', icon: Settings, active: false },
  ]
</script>

<!-- A static (collapsible="none") sidebar. The app's real one is the
     Sidebar02 block in the dashboard layout. -->
<SidebarProvider class="min-h-0">
  <Sidebar collapsible="none" class="h-auto rounded-md border">
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          {#each items as item (item.title)}
            <SidebarMenuItem>
              <SidebarMenuButton isActive={item.active}>
                <item.icon aria-hidden="true" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          {/each}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</SidebarProvider>
