<script lang="ts" module>
  import type { Component } from 'svelte'

  export interface NavMainItem {
    title: string
    url: string
    icon: Component
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }

  export interface NavMainProps {
    items: NavMainItem[]
  }
</script>

<script lang="ts">
  import { ChevronRight } from '@lucide/svelte'
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui/collapsible'
  import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
  } from '$lib/components/ui/sidebar'
  import { t } from '$lib/i18n'

  let { items }: NavMainProps = $props()

  // Groups with children open when one of their pages is active — also after
  // client-side navigation, not only on first render — and stay
  // user-toggleable. Port of the nuxt NavMain.vue sidebar fix (740c76c).
  // The Svelte Collapsible has no as-child mode, so it renders its own
  // wrapper inside the menu item where the Vue twin merges the two.
  let open = $state<Record<string, boolean>>({})

  $effect(() => {
    for (const item of items) {
      if (item.isActive) open[item.title] = true
    }
  })

  function onOpenChange(title: string, next: boolean) {
    open[title] = next
  }
</script>

<SidebarGroup data-slot="sidebar-02">
  <SidebarGroupLabel>{$t('nav.groups.platform')}</SidebarGroupLabel>
  <SidebarMenu>
    {#each items as item (item.title)}
      {@const ItemIcon = item.icon}
      {#if item.items?.length}
        <!-- Group: the whole row toggles; only the children navigate. -->
        <SidebarMenuItem>
          <Collapsible open={open[item.title] ?? false} onOpenChange={(v) => onOpenChange(item.title, v)}>
            <CollapsibleTrigger>
              {#snippet child({ props })}
                <SidebarMenuButton
                  {...props}
                  tooltip={item.title}
                  class={item.isActive ? 'group/trigger text-sidebar-foreground font-medium' : 'group/trigger'}
                >
                  <ItemIcon />
                  <span>{item.title}</span>
                  <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" />
                </SidebarMenuButton>
              {/snippet}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {#each item.items as subItem (subItem.title)}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={subItem.isActive}
                      class="data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary dark:data-[active=true]:text-white data-[active=true]:font-medium"
                    >
                      {#snippet child({ props })}
                        <a href={subItem.url} {...props}>
                          <span>{subItem.title}</span>
                        </a>
                      {/snippet}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                {/each}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      {:else}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={item.title}
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
      {/if}
    {/each}
  </SidebarMenu>
</SidebarGroup>
