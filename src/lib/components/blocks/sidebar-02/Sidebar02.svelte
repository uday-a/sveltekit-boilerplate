<script lang="ts" module>
  export interface Sidebar02Props {
    user?: { name: string; email: string; avatar?: string; role?: string }
    onLogout?: () => void
    onProfileSelect?: (key: string) => void
  }
</script>

<script lang="ts">
  import type { Component } from 'svelte'
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import {
    Activity,
    CalendarDays,
    FileText,
    Folder,
    KanbanSquare,
    LayoutDashboard,
    LayoutTemplate,
    MessageSquare,
    LifeBuoy,
    MapPin,
    Send,
    Settings2,
    ShieldCheck,
    Table2,
  } from '@lucide/svelte'
  import NavMain from './NavMain.svelte'
  import NavProjects from './NavProjects.svelte'
  import NavSecondary from './NavSecondary.svelte'
  import NavUser from './NavUser.svelte'
  import TeamSwitcher from './TeamSwitcher.svelte'
  import { OverlayScroll } from '$lib/components/ui/overlay-scroll'
  import { isNavItemActive } from '$lib/nav-active'
  import { t } from '$lib/i18n'
  import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '$lib/components/ui/sidebar'

  let { user = { name: 'Guest', email: '' }, onLogout, onProfileSelect }: Sidebar02Props = $props()

  // Nav labels come from $lib/i18n (`nav.items.*`, ported from nuxt) so the
  // sidebar follows the locale. Project names are tenant/brand data and
  // stay verbatim either way.
  interface NavItem {
    title: string
    url: string
    icon: Component
    items?: { title: string; url: string }[]
  }

  // The Admin section is role-gated client-side for navigation polish only;
  // the real enforcement is server-side (requireRole('admin')).
  const isAdmin = $derived(user.role === 'admin')

  const navMainStatic = $derived<NavItem[]>([
    { title: $t('nav.items.dashboard'), url: '/dashboard', icon: LayoutDashboard },
    { title: $t('nav.items.messages'), url: '/dashboard/messages', icon: MessageSquare },
    { title: $t('nav.items.kanban'), url: '/dashboard/kanban', icon: KanbanSquare },
    { title: $t('nav.items.dataTable'), url: '/dashboard/data-table', icon: Table2 },
    { title: $t('nav.items.calendar'), url: '/dashboard/calendar', icon: CalendarDays },
    { title: $t('nav.items.activity'), url: '/dashboard/activity', icon: Activity },
    { title: $t('nav.items.locations'), url: '/dashboard/locations', icon: MapPin },
    { title: $t('nav.items.uiKit'), url: '/dashboard/ui-kit', icon: LayoutTemplate },
    { title: $t('nav.items.forms'), url: '/dashboard/forms', icon: FileText },
    {
      title: $t('nav.items.settings'),
      url: '/settings',
      icon: Settings2,
      items: [
        { title: $t('nav.items.general'), url: '/settings/general' },
        { title: $t('nav.items.account'), url: '/settings/account' },
        { title: $t('nav.items.security'), url: '/settings/security' },
        { title: $t('nav.items.apiKeys'), url: '/settings/api-keys' },
        { title: $t('nav.items.notifications'), url: '/settings/notifications' },
        { title: $t('nav.items.integrations'), url: '/settings/integrations' },
        { title: $t('nav.items.team'), url: '/settings/team' },
        { title: $t('nav.items.activityLog'), url: '/settings/activity' },
        { title: $t('nav.items.billing'), url: '/settings/billing' },
        { title: $t('nav.items.limits'), url: '/settings/limits' },
      ],
    },
    ...(isAdmin
      ? [{
        title: $t('nav.items.admin'),
        url: '/admin/users',
        icon: ShieldCheck,
        items: [
          { title: $t('nav.items.users'), url: '/admin/users' },
          { title: $t('nav.items.roles'), url: '/admin/roles' },
        ],
      }]
      : []),
  ])

  const navSecondaryStatic = $derived<NavItem[]>([
    { title: $t('nav.items.support'), url: '/support', icon: LifeBuoy },
    { title: $t('nav.items.feedback'), url: '/feedback', icon: Send },
  ])

  const projectsStatic = [
    { name: 'Design Engineering', url: '/projects/design-engineering', icon: Folder },
    { name: 'Sales & Marketing', url: '/projects/sales-marketing', icon: Folder },
    { name: 'Travel', url: '/projects/travel', icon: Folder },
  ]

  function withActiveNav<T extends { url: string; items?: { url: string }[] }>(pathname: string, items: T[]) {
    return items.map((item) => {
      const childActive = item.items?.some((sub) => isNavItemActive(pathname, sub.url)) ?? false
      const selfActive = isNavItemActive(pathname, item.url)
      return {
        ...item,
        isActive: selfActive || childActive,
        items: item.items?.map((sub) => ({
          ...sub,
          isActive: isNavItemActive(pathname, sub.url),
        })),
      }
    })
  }

  const pathname = $derived(page.url.pathname)
  const navMain = $derived(withActiveNav(pathname, navMainStatic))
  const navSecondary = $derived(
    navSecondaryStatic.map((item) => ({ ...item, isActive: isNavItemActive(pathname, item.url) })),
  )
  const projects = $derived(
    projectsStatic.map((item) => ({ ...item, isActive: isNavItemActive(pathname, item.url) })),
  )

  async function handleLogout() {
    if (onLogout) {
      onLogout()
      return
    }
    await fetch('/auth/logout', { method: 'POST' }).catch(() => undefined)
    await goto('/login')
  }

  function handleProfileSelect(key: string) {
    if (key === 'account') void goto('/settings/account')
    if (key === 'billing') void goto('/settings/billing')
    if (key === 'notifications') void goto('/settings/notifications')
    onProfileSelect?.(key)
  }
</script>

<!-- Boilerplate nav port of nuxt `app/components/blocks/sidebar-02/Sidebar02.vue`.
     The registry twin ships generic Playground/Models demo links; this copy
     owns the real dashboard routes + route-aware highlighting. -->
<Sidebar data-slot="sidebar-02" collapsible="icon">
  <SidebarHeader>
    <TeamSwitcher />
  </SidebarHeader>
  <SidebarContent data-tour="sidebar-nav" class="gap-1 overflow-visible group-data-[collapsible=icon]:overflow-hidden">
    <OverlayScroll class="min-h-0 flex-1">
      <div class="flex min-h-full flex-col gap-2">
        <NavMain items={navMain} />
        <NavProjects {projects} />
        <NavSecondary items={navSecondary} class="mt-auto" />
      </div>
    </OverlayScroll>
  </SidebarContent>
  <SidebarFooter data-tour="profile">
    <NavUser {user} onLogout={handleLogout} onProfileSelect={handleProfileSelect} />
  </SidebarFooter>
  <SidebarRail />
</Sidebar>
