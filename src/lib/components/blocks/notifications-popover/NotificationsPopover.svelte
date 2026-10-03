<script lang="ts" module>
  import type { Component, Snippet } from 'svelte'

  export interface NotificationsPopoverProps {
    /** The consumer's own trigger (e.g. their Bell button). Receives the
     *  trigger `props` (spread them onto your element) and the live
     *  `unreadCount` for the badge. */
    children?: Snippet<[{ props: Record<string, unknown>; unreadCount: number }]>
  }
</script>

<script lang="ts">
  import { Archive, BellOff, CreditCard, FileText, Rocket, ShieldCheck, TriangleAlert, UserPlus, X } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { OverlayScroll } from '$lib/components/ui/overlay-scroll'

  let { children }: NotificationsPopoverProps = $props()

  type NotificationCategory = 'team' | 'billing' | 'deploy' | 'alert' | 'security' | 'system'

  interface Notification {
    id: string
    title: string
    body: string
    category: NotificationCategory
    timestamp: Date
    read: boolean
    actionUrl?: string
    actor?: string
  }

  const categoryConfig: Record<NotificationCategory, { icon: Component; accent: string; bg: string }> = {
    team: { icon: UserPlus, accent: 'bg-success', bg: 'bg-success/10 text-success' },
    billing: { icon: CreditCard, accent: 'bg-info', bg: 'bg-info/10 text-info' },
    deploy: { icon: Rocket, accent: 'bg-chart-1', bg: 'bg-chart-1/10 text-chart-1' },
    alert: { icon: TriangleAlert, accent: 'bg-warning', bg: 'bg-warning/10 text-warning' },
    security: { icon: ShieldCheck, accent: 'bg-primary', bg: 'bg-primary/10 text-primary' },
    system: { icon: FileText, accent: 'bg-muted-foreground', bg: 'bg-muted text-muted-foreground' },
  }

  const now = new Date()

  let notifications = $state<Notification[]>([
    {
      id: '1',
      title: 'Deploy succeeded',
      body: 'v2.14.0 is live in production. 38 changes shipped.',
      category: 'deploy',
      timestamp: new Date(now.getTime() - 720000),
      read: false,
      actor: 'Deploy bot',
    },
    {
      id: '2',
      title: 'New member joined',
      body: 'Chloe Morgan accepted your invite and joined as Editor.',
      category: 'team',
      timestamp: new Date(now.getTime() - 2700000),
      read: false,
      actor: 'Chloe Morgan',
    },
    {
      id: '3',
      title: 'Usage at 94% of limit',
      body: 'Active file bundles: 47 of 50 used. Upgrade or archive to stay under the cap.',
      category: 'alert',
      timestamp: new Date(now.getTime() - 7200000),
      read: false,
    },
    {
      id: '4',
      title: 'Invoice paid',
      body: 'INV-2031 for $149.00 was charged to Visa ending 4242.',
      category: 'billing',
      timestamp: new Date(now.getTime() - 18000000),
      read: true,
    },
    {
      id: '5',
      title: 'New sign-in from Berlin',
      body: 'Chrome on macOS. If this wasn’t you, revoke the session in Security.',
      category: 'security',
      timestamp: new Date(now.getTime() - 28800000),
      read: true,
    },
    {
      id: '6',
      title: 'Weekly report ready',
      body: 'Your workspace summary for Sep 22 – 28 is ready to view.',
      category: 'system',
      timestamp: new Date(now.getTime() - 93600000),
      read: true,
    },
    {
      id: '7',
      title: 'Deploy rolled back',
      body: 'v2.13.2 was rolled back after a failed health check in eu-west.',
      category: 'deploy',
      timestamp: new Date(now.getTime() - 100800000),
      read: true,
      actor: 'Deploy bot',
    },
    {
      id: '8',
      title: 'API key expires soon',
      body: 'The “CI deploys” key expires in 7 days. Rotate it to avoid failed builds.',
      category: 'security',
      timestamp: new Date(now.getTime() - 172800000),
      read: true,
    },
  ])

  let activeFilter = $state<'all' | 'unread'>('all')
  let isOpen = $state(false)

  const unreadCount = $derived(notifications.filter((n) => !n.read).length)

  const filteredNotifications = $derived(
    activeFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications,
  )

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const groupedNotifications = $derived.by(() => {
    const today = filteredNotifications.filter((n) => n.timestamp >= todayStart)
    const earlier = filteredNotifications.filter((n) => n.timestamp < todayStart)
    return { today, earlier }
  })

  function formatTime(date: Date): string {
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs}h ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  function markAsRead(id: string) {
    const n = notifications.find((n) => n.id === id)
    if (n) n.read = true
  }

  function markAllRead() {
    notifications.forEach((n) => (n.read = true))
  }

  function dismissNotification(id: string) {
    notifications = notifications.filter((n) => n.id !== id)
  }
</script>

{#snippet notificationRow(n: Notification, index: number)}
  {@const config = categoryConfig[n.category]}
  {@const RowIcon = config.icon}
  <div
    class="group hover:bg-muted animate-in fade-in-0 slide-in-from-bottom-1 relative cursor-pointer transition-colors duration-150"
    style="animation-delay: {index * 30}ms"
    onclick={() => markAsRead(n.id)}
    onkeydown={(e) => e.key === 'Enter' && markAsRead(n.id)}
    role="button"
    tabindex="0"
  >
    <div
      class="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full transition-opacity {!n.read
        ? config.accent
        : 'opacity-0'}"
    ></div>

    <div class="flex gap-3 px-4 py-3">
      <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg {config.bg}">
        <RowIcon class="size-4" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <p class="text-sm leading-snug {!n.read ? 'font-semibold' : 'font-medium'}">
            {n.title}
          </p>
          <div class="flex shrink-0 items-center gap-1.5">
            <span class="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
              {formatTime(n.timestamp)}
            </span>
            {#if !n.read}
              <span class="bg-primary size-1.5 shrink-0 rounded-full"></span>
            {/if}
          </div>
        </div>
        <p class="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
          {n.body}
        </p>
      </div>

      <button
        class="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        title="Dismiss"
        onclick={(e) => {
          e.stopPropagation()
          dismissNotification(n.id)
        }}
      >
        <X class="size-3.5" />
      </button>
    </div>
  </div>
{/snippet}

<Popover bind:open={isOpen}>
  <PopoverTrigger>
    {#snippet child({ props })}
      {@render children?.({ props, unreadCount })}
    {/snippet}
  </PopoverTrigger>
  <!-- data-slot lives on the panel: Popover itself renders no element. -->
  <PopoverContent
    data-slot="notifications-popover"
    align="end"
    sideOffset={8}
    class="notification-panel w-[380px] overflow-hidden rounded-lg border p-0 shadow-xl"
  >
    <div class="flex items-center justify-between px-4 pt-4 pb-3">
      <div class="flex items-center gap-2.5">
        <h3 class="text-sm font-semibold tracking-tight">Notifications</h3>
        {#if unreadCount > 0}
          <Badge
            class="bg-primary/15 text-primary hover:bg-primary/15 h-5 rounded-full px-1.5 text-xs font-semibold tabular-nums"
          >
            {unreadCount}
          </Badge>
        {/if}
      </div>
      {#if unreadCount > 0}
        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground hover:text-foreground -mr-1 h-7 px-2 text-xs"
          onclick={markAllRead}
        >
          Mark all read
        </Button>
      {/if}
    </div>

    <div class="border-b px-4">
      <div class="flex gap-0">
        <button
          class="relative px-3 pb-2.5 text-xs font-medium transition-colors {activeFilter === 'all'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => (activeFilter = 'all')}
        >
          All
          {#if activeFilter === 'all'}
            <span class="bg-primary absolute right-0 bottom-0 left-0 h-[2px] rounded-t-full"></span>
          {/if}
        </button>
        <button
          class="relative px-3 pb-2.5 text-xs font-medium transition-colors {activeFilter === 'unread'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'}"
          onclick={() => (activeFilter = 'unread')}
        >
          Unread
          {#if activeFilter === 'unread'}
            <span class="bg-primary absolute right-0 bottom-0 left-0 h-[2px] rounded-t-full"></span>
          {/if}
        </button>
      </div>
    </div>

    <OverlayScroll class="max-h-[420px]">
      {#if filteredNotifications.length === 0}
        <div class="flex flex-col items-center justify-center py-4 text-center">
          <div class="bg-muted mb-3 rounded-full p-3">
            <BellOff class="text-muted-foreground size-5" />
          </div>
          <p class="text-sm font-medium">All caught up</p>
          <p class="text-muted-foreground mt-0.5 text-xs">
            No {activeFilter === 'unread' ? 'unread ' : ''}notifications
          </p>
        </div>
      {:else}
        {#if groupedNotifications.today.length > 0}
          <div class="px-4 pt-3 pb-1">
            <span class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Today</span>
          </div>
          {#each groupedNotifications.today as n, index (n.id)}
            {@render notificationRow(n, index)}
          {/each}
        {/if}

        {#if groupedNotifications.earlier.length > 0}
          <div class="px-4 pt-3 pb-1">
            <span class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Earlier</span>
          </div>
          {#each groupedNotifications.earlier as n, index (n.id)}
            {@render notificationRow(n, groupedNotifications.today.length + index)}
          {/each}
        {/if}
      {/if}
      <div
        aria-hidden="true"
        class="pointer-events-none sticky bottom-0 -mt-6 h-6 bg-gradient-to-b from-transparent to-popover"
      ></div>
    </OverlayScroll>

    <div class="bg-popover relative z-10 border-t px-4 py-2.5">
      <a
        href="#"
        class="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 text-xs transition-colors"
        onclick={() => (isOpen = false)}
      >
        <Archive class="size-3.5" aria-hidden="true" />
        View all notifications
      </a>
    </div>
  </PopoverContent>
</Popover>
