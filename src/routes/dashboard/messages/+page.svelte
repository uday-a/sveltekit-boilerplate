<script lang="ts">
  import type { Component } from 'svelte'
  import {
    Search,
    Send,
    MoreHorizontal,
    Star,
    Archive,
    Trash2,
    Inbox,
    Send as SentIcon,
    FileText,
    AlertCircle,
    CheckCheck,
    Plus,
  } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Badge } from '$lib/components/ui/badge'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from '$lib/components/ui/dialog'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import { Separator } from '$lib/components/ui/separator'
  import { OverlayScroll } from '$lib/components/ui/overlay-scroll'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { t } from '$lib/i18n'

  // Port of nuxt `app/pages/dashboard/messages.vue` — same folders, seed
  // messages, and three-pane layout.

  interface Message {
    id: string
    sender: string
    email: string
    initials: string
    subject: string
    preview: string
    body: string
    time: string
    read: boolean
    starred: boolean
    folder: 'inbox' | 'sent' | 'drafts' | 'spam'
    tags: string[]
  }

  const folders: { id: Message['folder'], label: string, icon: Component, count: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: 12 },
    { id: 'sent', label: 'Sent', icon: SentIcon, count: 0 },
    { id: 'drafts', label: 'Drafts', icon: FileText, count: 3 },
    { id: 'spam', label: 'Spam', icon: AlertCircle, count: 0 },
  ]

  const messages: Message[] = [
    { id: '1', sender: 'Sarah Connor', email: 'sarah@acme.com', initials: 'SC', subject: 'Q2 roadmap review — Design Engineering', preview: 'Can we move the component audit to Thursday? The team needs one more day to finish the token migration.', body: 'Hi team,\n\nCan we move the component audit to Thursday? The team needs one more day to finish the token migration.\n\nAlso — the new KpiGrid spec looks great. One question: do we want to support 6-column layout or cap at 5?\n\nSarah', time: '10:32 AM', read: false, starred: true, folder: 'inbox', tags: ['work', 'roadmap'] },
    { id: '2', sender: 'Marcus Rivera', email: 'marcus@acme.com', initials: 'MR', subject: 'Re: Auth middleware token storage', preview: 'I reviewed the PR. The compliance-ready token storage looks solid. One nit on the retry logic — see line 84.', body: 'I reviewed the PR. The compliance-ready token storage looks solid. One nit on the retry logic — see line 84.\n\nAlso flagged the missing test for the edge case where refresh returns 401. Can you add that before merge?\n\n— Marcus', time: '9:15 AM', read: false, starred: false, folder: 'inbox', tags: ['code-review'] },
    { id: '3', sender: 'Alice Chen', email: 'alice@acme.com', initials: 'AC', subject: 'Sparkline tooltip precision', preview: 'Fixed in #1283. The hover now shows full-precision values instead of rounding to 1 decimal.', body: 'Fixed in #1283. The hover now shows full-precision values instead of rounding to 1 decimal.\n\nScreenshot attached. Let me know if the formatting looks off on your end.\n\nAlice', time: 'Yesterday', read: true, starred: true, folder: 'inbox', tags: ['bugfix'] },
    { id: '4', sender: 'David Kim', email: 'david@acme.com', initials: 'DK', subject: 'Dark mode WCAG AAA tokens', preview: 'Maybe we should land the WCAG AAA tokens as a separate PR? The diff is already +400 lines.', body: 'Maybe we should land the WCAG AAA tokens as a separate PR? The diff is already +400 lines.\n\nI worry about review fatigue if we bundle it with the high-contrast override.\n\nDavid', time: 'Yesterday', read: true, starred: false, folder: 'inbox', tags: ['design-system'] },
    { id: '5', sender: 'Eva Johnson', email: 'eva@acme.com', initials: 'EJ', subject: 'WIP: native AbortSignal in API wrapper', preview: 'Pushed 4 commits to feature/abort-signal. Still need to handle the timeout edge case.', body: 'Pushed 4 commits to feature/abort-signal. Still need to handle the timeout edge case.\n\nThe wrapper now accepts signal?: AbortSignal and passes it through to fetch. Works in Chrome and Firefox. Safari needs testing.\n\nEva', time: 'Yesterday', read: true, starred: false, folder: 'inbox', tags: ['engineering'] },
    { id: '6', sender: 'Frank Lee', email: 'frank@acme.com', initials: 'FL', subject: 'QA sign-off for Sprint 24', preview: 'All P0s passed. Two P1s remaining — both UI polish, no blockers for release.', body: 'All P0s passed. Two P1s remaining — both UI polish, no blockers for release.\n\nFull report is in Notion. Let me know if you want me to walk through the edge cases.\n\nFrank', time: 'May 14', read: true, starred: false, folder: 'inbox', tags: ['qa'] },
    { id: '7', sender: 'Olive Park', email: 'olive@acme.com', initials: 'OP', subject: 'Welcome to the team!', preview: 'Thanks for the onboarding doc. The local setup took 12 minutes — faster than expected.', body: 'Thanks for the onboarding doc. The local setup took 12 minutes — faster than expected.\n\nOne thing I noticed: the env.example is missing the DATABASE_URL variable. Should I open a PR?\n\nOlive', time: 'May 13', read: true, starred: false, folder: 'inbox', tags: ['onboarding'] },
    { id: '8', sender: 'Northwind Industries', email: 'ops@northwind.example', initials: 'NI', subject: 'Enterprise contract renewal', preview: 'We would like to renew for another 12 months at the current Enterprise tier.', body: 'We would like to renew for another 12 months at the current Enterprise tier.\n\nCould you send the updated invoice by end of week?\n\n— Northwind Ops', time: 'May 12', read: true, starred: true, folder: 'inbox', tags: ['sales'] },
    { id: '9', sender: 'Sentinel Labs', email: 'team@sentinel.example', initials: 'SL', subject: 'Feedback: streaming citations', preview: '"Streaming citations are a game-changer. Our legal team saves ~3h per brief."', body: '"Streaming citations are a game-changer. Our legal team saves ~3h per brief."\n\nWould love to see batch citation export in the next quarter. Happy to beta test.\n\n— Sentinel Labs', time: 'May 10', read: true, starred: true, folder: 'inbox', tags: ['feedback'] },
    { id: '10', sender: 'System', email: 'system@acme.com', initials: 'SY', subject: 'Weekly digest — May 12', preview: '37 tasks closed, 12 opened. 4 deploys to production. Zero incidents.', body: 'Weekly digest — May 12\n\n37 tasks closed, 12 opened.\n4 deploys to production.\nZero incidents.\n\nTop contributor: Alice Chen (8 merged PRs)\n\n— Acme Bot', time: 'May 10', read: true, starred: false, folder: 'inbox', tags: ['system'] },
  ]

  let activeFolder = $state<Message['folder']>('inbox')
  let searchQuery = $state('')
  let selectedId = $state<string | null>('1')
  let composeOpen = $state(false)
  let replyBody = $state('')

  const filteredMessages = $derived.by(() => {
    let list = messages.filter((m) => m.folder === activeFolder)
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (m) =>
          m.subject.toLowerCase().includes(q)
          || m.sender.toLowerCase().includes(q)
          || m.preview.toLowerCase().includes(q),
      )
    }
    return list
  })

  const selectedMessage = $derived(messages.find((m) => m.id === selectedId))

  type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'
  function tagVariant(tag: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      'work': 'default',
      'roadmap': 'secondary',
      'code-review': 'outline',
      'bugfix': 'destructive',
      'design-system': 'secondary',
      'engineering': 'outline',
      'qa': 'default',
      'onboarding': 'secondary',
      'sales': 'default',
      'feedback': 'secondary',
      'system': 'outline',
    }
    return map[tag] ?? 'secondary'
  }

  function sendReply() {
    replyBody = ''
  }
</script>

<svelte:head>
  <title>Messages | UIPKGE</title>
</svelte:head>

<!-- Full-bleed panel: -m-4 cancels main's p-4 on every side; height
     follows the topbar (h-14, h-12 when the sidebar is collapsed). -->
<div
  class="-m-4 flex h-[calc(100svh-3.5rem)] flex-col group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100svh-3rem)]"
>
  <!-- Header: the topbar owns the breadcrumb and search -->
  <div class="flex items-center justify-between border-b px-4 py-3">
    <h1 class="text-base font-semibold tracking-tight">Messages</h1>
    <Button size="sm" class="gap-1.5" onclick={() => (composeOpen = true)}>
      <Plus class="size-3.5" />
      Compose
    </Button>
  </div>

  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar folders -->
    <div class="flex w-56 flex-col border-r">
      <div class="space-y-1 p-3">
        {#each folders as folder (folder.id)}
          {@const FolderIcon = folder.icon}
          <button
            type="button"
            aria-pressed={activeFolder === folder.id}
            aria-current={activeFolder === folder.id ? 'page' : undefined}
            class={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${activeFolder === folder.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
            onclick={() => (activeFolder = folder.id)}
          >
            <span class="flex items-center gap-2">
              <FolderIcon class="size-4" />
              {folder.label}
            </span>
            {#if folder.count > 0}
              <Badge variant="secondary" class="h-5 px-1.5 tabular-nums">{folder.count}</Badge>
            {/if}
          </button>
        {/each}
      </div>
      <Separator />
      <div class="p-3">
        <p class="text-muted-foreground mb-2 text-xs font-medium">Labels</p>
        <div class="flex flex-wrap gap-1.5">
          {#each ['work', 'code-review', 'bugfix', 'sales', 'system'] as tag (tag)}
            <Badge variant="outline" class="cursor-pointer hover:bg-accent">{tag}</Badge>
          {/each}
        </div>
      </div>
    </div>

    <!-- Message list -->
    <div class="flex w-80 flex-col border-r">
      <div class="border-b p-2">
        <div class="relative">
          <Search class="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input bind:value={searchQuery} placeholder="Search messages..." class="h-8 pl-8 text-sm" />
        </div>
      </div>
      <OverlayScroll class="flex-1">
        <!-- WHY (Rule79): an empty result renders an EmptyState with a
             clear-search action, not a bare sentence. -->
        {#if filteredMessages.length === 0}
          <EmptyState
            icon={Inbox}
            title={$t('dashboard.messages.emptySearchTitle')}
            description={$t('dashboard.messages.emptySearchDescription')}
            class="p-4"
          >
            <Button variant="outline" size="sm" class="mt-4 h-8 text-xs" onclick={() => (searchQuery = '')}>
              {$t('dashboard.messages.clearSearch')}
            </Button>
          </EmptyState>
        {/if}
        {#each filteredMessages as msg (msg.id)}
          <div
            class={`flex cursor-pointer gap-3 border-b p-3 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none ${selectedId === msg.id ? 'bg-accent' : 'hover:bg-muted/50'} ${!msg.read ? 'bg-primary/5' : ''}`}
            onclick={() => (selectedId = msg.id)}
            onkeydown={(e) => {
              if (e.key === 'Enter') selectedId = msg.id
            }}
            role="button"
            tabindex="0"
          >
            <Avatar class="size-9 shrink-0">
              <AvatarFallback class="text-xs font-semibold bg-muted text-muted-foreground">{msg.initials}</AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1 space-y-0.5">
              <div class="flex items-center justify-between gap-2">
                <!-- WHY (Rule28/30): truncated rows expose full text via
                     title so hover/touch long-press still reveals it. -->
                <p class={`truncate text-xs ${!msg.read ? 'font-semibold' : 'font-medium'}`} title={msg.sender}>{msg.sender}</p>
                <span class="text-muted-foreground shrink-0 text-xs tabular-nums">{msg.time}</span>
              </div>
              <p class={`truncate text-sm ${!msg.read ? 'font-medium' : 'text-muted-foreground'}`} title={msg.subject}>{msg.subject}</p>
              <p class="text-muted-foreground line-clamp-1 text-xs" title={msg.preview}>{msg.preview}</p>
              <div class="flex items-center gap-1 pt-0.5">
                {#if msg.starred}
                  <Star class="size-3 fill-warning text-warning" />
                {/if}
                {#each msg.tags.slice(0, 2) as tag (tag)}
                  <Badge variant={tagVariant(tag)} class="px-1">{tag}</Badge>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </OverlayScroll>
    </div>

    <!-- Message detail -->
    <div class="flex min-w-0 flex-1 flex-col">
      {#if selectedMessage}
        <div class="flex items-start justify-between gap-4 border-b px-4 py-4">
          <div class="flex items-center gap-3">
            <Avatar class="size-10">
              <AvatarFallback class="text-sm font-semibold bg-muted text-muted-foreground">
                {selectedMessage.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p class="text-sm font-medium">{selectedMessage.sender}</p>
              <p class="text-muted-foreground text-xs">{selectedMessage.email} · {selectedMessage.time}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {#snippet child({ props })}
                    <Button {...props} variant="ghost" size="icon" class="size-8">
                      <Star
                        class={`size-4 ${selectedMessage.starred ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
                      />
                    </Button>
                  {/snippet}
                </TooltipTrigger>
                <TooltipContent><p>{selectedMessage.starred ? 'Unstar' : 'Star'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {#snippet child({ props })}
                    <Button {...props} variant="ghost" size="icon" class="size-8">
                      <Archive class="text-muted-foreground size-4" />
                    </Button>
                  {/snippet}
                </TooltipTrigger>
                <TooltipContent><p>Archive</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Popover>
              <PopoverTrigger>
                {#snippet child({ props })}
                  <Button {...props} variant="ghost" size="icon" class="size-8">
                    <MoreHorizontal class="text-muted-foreground size-4" />
                  </Button>
                {/snippet}
              </PopoverTrigger>
              <PopoverContent align="end" class="w-40 p-1">
                <button class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  <CheckCheck class="size-3" />Mark as read
                </button>
                <button
                  class="text-destructive flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Trash2 class="size-3" />Delete
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div class="flex-1 overflow-auto p-4">
          <h2 class="mb-2 text-lg font-semibold">{selectedMessage.subject}</h2>
          <div class="mb-4 flex flex-wrap gap-1.5">
            {#each selectedMessage.tags as tag (tag)}
              <Badge variant={tagVariant(tag)}>{tag}</Badge>
            {/each}
          </div>
          <div class="prose prose-sm dark:prose-invert max-w-none">
            <p class="text-sm leading-relaxed whitespace-pre-line">{selectedMessage.body}</p>
          </div>
        </div>

        <div class="border-t p-4">
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <Input bind:value={replyBody} placeholder="Reply..." class="min-h-[80px] resize-y" />
            </div>
            <div class="flex flex-col gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    {#snippet child({ props })}
                      <Button {...props} size="icon" class="size-9" onclick={sendReply}>
                        <Send class="size-4" />
                      </Button>
                    {/snippet}
                  </TooltipTrigger>
                  <TooltipContent><p>Send reply</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      {:else}
        <div class="text-muted-foreground flex flex-1 items-center justify-center">
          <p class="text-sm">Select a message to read</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Compose Dialog -->
  <Dialog bind:open={composeOpen}>
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>New message</DialogTitle>
        <DialogDescription>Compose a new message to your team.</DialogDescription>
      </DialogHeader>
      <div class="space-y-3 py-2">
        <Input placeholder="To" />
        <Input placeholder="Subject" />
        <textarea
          class="bg-background min-h-[120px] w-full resize-y rounded-md border px-3 py-2 text-sm"
          placeholder="Write your message..."
        ></textarea>
      </div>
      <DialogFooter>
        <Button variant="outline" onclick={() => (composeOpen = false)}>Cancel</Button>
        <Button onclick={() => (composeOpen = false)}>Send</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
