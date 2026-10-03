<script lang="ts" module>
  import type { Component } from 'svelte'

  export interface NavSecondaryProps {
    items: {
      title: string
      url: string
      icon: Component
      isActive?: boolean
    }[]
    class?: string
  }
</script>

<script lang="ts">
  import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from '$lib/components/ui/sidebar'

  let { items, class: className }: NavSecondaryProps = $props()
</script>

<SidebarGroup data-slot="sidebar-02" class={className}>
  <SidebarGroupContent>
    <SidebarMenu>
      {#each items as item (item.title)}
        {@const ItemIcon = item.icon}
        <SidebarMenuItem>
          <SidebarMenuButton
            size="sm"
            isActive={item.isActive}
            class="data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary dark:data-[active=true]:text-white data-[active=true]:font-medium data-[active=true]:[&>svg]:text-sidebar-primary dark:data-[active=true]:[&>svg]:text-white"
          >
            {#snippet child({ props })}
              <a href={item.url} {...props}>
                <ItemIcon />
                <span>{item.title}</span>
              </a>
            {/snippet}
          </SidebarMenuButton>
        </SidebarMenuItem>
      {/each}
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>
