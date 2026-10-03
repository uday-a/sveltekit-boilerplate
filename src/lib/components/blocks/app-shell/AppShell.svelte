<script lang="ts" module>
  import type { Snippet } from 'svelte'

  // Structural user mirror (not the server SessionUser — server-only code
  // must never be imported into client components). Same shape the
  // dashboard/admin layouts cast `data.user` to.
  export interface AppShellData {
    user?: { name?: string, login?: string, email?: string | null, avatar?: string | null, role?: string } | null
  }

  export interface AppShellProps {
    data: AppShellData
    children?: Snippet
  }
</script>

<script lang="ts">
  import { page } from '$app/state'
  import { goto, invalidateAll } from '$app/navigation'
  import DashboardLayout from '$lib/components/blocks/dashboard-layout/DashboardLayout.svelte'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'

  let { data, children }: AppShellProps = $props()

  // Breadcrumbs derive from the route path (port of nuxt
  // `app/layouts/dashboard.vue`). Keyed by full path so segment
  // collisions resolve correctly (`/settings/activity` is "Activity log",
  // not "Activity"). `$t` access inside the derived keeps crumbs reactive
  // to locale switches.
  const breadcrumbs = $derived.by(() => {
    const pathname = page.url.pathname
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return [{ label: $t('nav.items.dashboard') }]
    return parts.map((_, i) => {
      const path = '/' + parts.slice(0, i + 1).join('/')
      return { label: routeLabel(path, $t), href: i < parts.length - 1 ? path : undefined }
    })
  })

  // Display user comes from the root +layout.server.ts load (`data.user`);
  // hooks.server.ts is the auth source of truth. Layout-level guards live
  // in +layout.server.ts files (admin role gate); plain auth sections need
  // no server file — the hook already redirects anonymous visitors.
  const user = $derived.by(() => {
    const u = data.user
    if (!u) return { name: 'Guest', email: '', avatar: '' }
    return { name: u.name || u.login || u.email || 'Guest', email: u.email ?? '', avatar: u.avatar ?? '', role: u.role }
  })

  async function onLogout() {
    await fetch('/auth/logout', { method: 'POST' }).catch(() => undefined)
    await invalidateAll()
    await goto('/login')
  }

  async function onProfileSelect(key: string) {
    if (key === 'logout') {
      await onLogout()
      return
    }
    if (key === 'account') await goto('/settings/account')
    if (key === 'billing') await goto('/settings/billing')
    if (key === 'notifications') await goto('/settings/notifications')
    if (key === 'settings') await goto('/settings')
  }

  function onCommandSelect(item: { label: string, hint?: string }) {
    if (item.hint) void goto(item.hint)
  }
</script>

<DashboardLayout {breadcrumbs} {user} {onLogout} {onProfileSelect} {onCommandSelect}>
  {@render children?.()}
</DashboardLayout>
