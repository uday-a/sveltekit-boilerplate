<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface DashboardLayoutCrumb {
    label: string
    href?: string
  }

  export interface DashboardLayoutProps {
    breadcrumbs?: DashboardLayoutCrumb[]
    user?: { name: string; email: string; avatar?: string; role?: string }
    onProfileSelect?: (key: string) => void
    onLogout?: () => void
    onCommandSelect?: (item: { label: string; hint?: string }) => void
    children?: Snippet
  }
</script>

<script lang="ts">
  import { Bell } from '@lucide/svelte'
  import Sidebar02 from '$lib/components/blocks/sidebar-02/Sidebar02.svelte'
  import CommandPalette from '$lib/components/blocks/command-palette/CommandPalette.svelte'
  import NotificationsPopover from '$lib/components/blocks/notifications-popover/NotificationsPopover.svelte'
  import { Button } from '$lib/components/ui/button'
  import { Separator } from '$lib/components/ui/separator'
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from '$lib/components/ui/breadcrumb'
  import { SidebarInset, SidebarProvider, SidebarTrigger } from '$lib/components/ui/sidebar'
  import { ThemeSwitch, type ThemeSwitchTheme } from '$lib/components/ui/theme-switch'
  import ThemeCustomizer from '$lib/components/blocks/theme-customizer/ThemeCustomizer.svelte'
  import LocaleSwitcher from '$lib/components/blocks/locale-switcher/LocaleSwitcher.svelte'
  import { themeStore, type Theme } from '$lib/theme.svelte'

  let {
    breadcrumbs = [{ label: 'Dashboard' }],
    user = { name: 'Guest', email: '' },
    onProfileSelect,
    onLogout,
    onCommandSelect,
    children,
  }: DashboardLayoutProps = $props()

  // ThemeSwitch's Theme union includes 'black' (extra registry preset) which
  // our app-level theme store doesn't model. Coerce at the boundary; the
  // cookie only ever stores values from our narrower union.
  function onThemeChange(next: ThemeSwitchTheme) {
    if (next === 'black') return
    themeStore.set(next as Theme)
  }
</script>

<!-- App shell: registry DashboardLayout adapted to the boilerplate — shared
     cookie-backed theme store (SSR-safe), session user wired into the
     sidebar footer, GitHub badge in the header. Port of nuxt
     `app/components/blocks/DashboardLayout.vue`. -->
<SidebarProvider data-slot="dashboard-layout">
  <a
    href="#main-content"
    class="bg-background text-foreground ring-ring sr-only z-50 rounded-md text-sm font-medium shadow-md ring-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-3 focus:py-2"
  >Skip to content</a>
  <Sidebar02 {user} {onLogout} {onProfileSelect} />
  <SidebarInset>
    <header
      class="bg-background sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
    >
      <div class="flex items-center gap-2">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {#each breadcrumbs as crumb, i (i)}
              <BreadcrumbItem class={i === 0 ? 'hidden md:block' : ''}>
                {#if crumb.href && i < breadcrumbs.length - 1}
                  <BreadcrumbLink href={crumb.href} class="text-muted-foreground/70 hover:text-foreground transition-colors">
                    {crumb.label}
                  </BreadcrumbLink>
                {:else}
                  <BreadcrumbPage class="font-medium">{crumb.label}</BreadcrumbPage>
                {/if}
              </BreadcrumbItem>
              {#if i < breadcrumbs.length - 1}
                <BreadcrumbSeparator class={i === 0 ? 'hidden md:block' : ''} />
              {/if}
            {/each}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div class="flex items-center gap-1 px-2 sm:gap-3">
        <a
          href="https://github.com/uday-a/sveltekit-boilerplate"
          target="_blank"
          rel="noreferrer"
          data-tour="github"
          class="border-border/80 bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors sm:inline-flex"
        >
          <svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17 4.7 18 5 18 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
            />
          </svg>
          <span>SvelteKit Starter</span>
        </a>
        <div data-tour="palette" class="inline-flex">
          <CommandPalette onSelect={(item) => onCommandSelect?.(item)} />
        </div>
        <div class="flex items-center gap-0.5">
          <LocaleSwitcher />
          <ThemeCustomizer />
          <div data-tour="theme" class="inline-flex">
            <ThemeSwitch value={themeStore.current} variant="icon-only" onValueChange={onThemeChange} />
          </div>
          <NotificationsPopover>
            {#snippet children({ props, unreadCount })}
              <Button
                {...props}
                variant="ghost"
                size="icon"
                class="text-muted-foreground hover:text-foreground relative size-8 rounded-lg"
                aria-label="Notifications"
              >
                <Bell class="size-4" />
                {#if unreadCount > 0}
                  <span class="bg-primary ring-background absolute top-1.5 right-1.5 size-2 rounded-full ring-2"></span>
                {/if}
              </Button>
            {/snippet}
          </NotificationsPopover>
        </div>
      </div>
    </header>
    <!-- WHY (Rule18): cap content width so ultra-wide viewports don't
         stretch charts into noise. -->
    <main id="main-content" tabindex="-1" class="mx-auto flex w-full max-w-[1600px] flex-1 flex-col p-4 outline-none">
      {@render children?.()}
    </main>
  </SidebarInset>
</SidebarProvider>
