<script lang="ts">
  import { untrack } from 'svelte'
  import { AlertCircle, CircleDot, FolderPlus, Loader2, Plus } from '@lucide/svelte'
  import { page } from '$app/state'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '$lib/components/ui/dialog'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import DemoDataBanner from '$lib/components/blocks/demo-data-banner/DemoDataBanner.svelte'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { locale, t } from '$lib/i18n'

  let { data } = $props()

  const title = $derived(routeLabel(page.url.pathname, $t))

  interface Project {
    id: number
    slug: string
    name: string
    description: string | null
    ownerId: number
    createdAt: string | Date
    updatedAt: string | Date
  }

  let projects = $state<Project[]>([])
  let pending = $state(false)
  let fetchError = $state<string | null>(null)

  function apply(res: ApiResponse<{ projects: Project[] }>) {
    fetchError = res.ok ? null : res.error.message
    if (res.ok) projects = res.data.projects
  }

  // First paint comes from +page.server.ts; load() re-fetches after changes.
  untrack(() => apply(data.projectsRes as ApiResponse<{ projects: Project[] }>))

  async function load() {
    pending = true
    apply(await apiFetch('/api/projects'))
    pending = false
  }

  // Members, status and open-task counts aren't in the projects API yet, so
  // each card gets deterministic sample values keyed by project id. Swap this
  // for real fields once the API returns them.
  const SAMPLE_MEMBERS = ['Emma Clarke', 'James Porter', 'Olivia Brooks', 'Daniel Hughes', 'Sophie Turner', 'Liam Foster']
  const SAMPLE_STATUS = [
    { label: 'On track', variant: 'success' },
    { label: 'At risk', variant: 'warning' },
    { label: 'On hold', variant: 'secondary' },
  ] as const

  function initials(name: string) {
    return name.split(' ').map(part => part[0]).join('')
  }

  function sampleMeta(id: number) {
    const memberCount = 2 + (id % 4)
    const members = Array.from({ length: memberCount }, (_, i) => SAMPLE_MEMBERS[(id + i) % SAMPLE_MEMBERS.length]!)
    return {
      members,
      status: SAMPLE_STATUS[id % SAMPLE_STATUS.length]!,
      openTasks: 3 + ((id * 7) % 18),
    }
  }

  function timeAgo(value: string | Date) {
    const diffMs = new Date(value).getTime() - Date.now()
    const rtf = new Intl.RelativeTimeFormat($locale ?? 'en', { numeric: 'auto' })
    const days = Math.round(diffMs / 86400000)
    if (Math.abs(days) < 1) return rtf.format(Math.round(diffMs / 3600000), 'hour')
    if (Math.abs(days) < 30) return rtf.format(days, 'day')
    return rtf.format(Math.round(days / 30), 'month')
  }

  // Create-project dialog state.
  let open = $state(false)
  let form = $state({ slug: '', name: '', description: '' })
  let submitState = $state<'idle' | 'submitting' | 'error'>('idle')
  let submitError = $state<string | null>(null)

  // Auto-derive a slug from the name so vibe-coders rarely have to think
  // about it. Stops auto-deriving the moment they type into the slug field
  // themselves so we don't trample explicit edits.
  let slugTouched = $state(false)

  function slugify(next: string): string {
    return next
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64)
  }

  async function createProject() {
    submitState = 'submitting'
    submitError = null
    const res: ApiResponse<{ project: Project }> = await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ slug: form.slug, name: form.name, description: form.description || undefined }),
    })

    if (!res.ok) {
      submitError = res.error.message
      submitState = 'error'
      return
    }

    // Reset, close, refetch the list.
    form = { slug: '', name: '', description: '' }
    slugTouched = false
    submitState = 'idle'
    open = false
    await load()
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description="Group related work, the people on it and what's still open." />
    {#snippet actions()}
      <Dialog bind:open>
        <DialogTrigger>
          {#snippet child({ props })}
            <Button size="sm" {...props}>
              <Plus class="size-4" aria-hidden="true" />
              New project
            </Button>
          {/snippet}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Group related work and the people working on it.</DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-1">
            <div class="grid gap-2">
              <Label for="np-name">Name</Label>
              <Input
                id="np-name"
                bind:value={form.name}
                placeholder="My new project"
                onValueChange={(v) => {
                  if (!slugTouched) form.slug = slugify(v)
                }}
              />
            </div>
            <div class="grid gap-2">
              <Label for="np-slug">URL name</Label>
              <Input
                id="np-slug"
                bind:value={form.slug}
                placeholder="my-new-project"
                onValueChange={() => {
                  slugTouched = true
                }}
              />
              <p class="text-muted-foreground text-xs">Used in the project URL. Lowercase letters, numbers and hyphens.</p>
            </div>
            <div class="grid gap-2">
              <Label for="np-desc">Description (optional)</Label>
              <Textarea id="np-desc" bind:value={form.description} rows={3} />
            </div>
            {#if submitError}
              <div class="text-destructive flex items-center gap-2 text-sm">
                <AlertCircle class="size-4 shrink-0" aria-hidden="true" />
                {submitError}
              </div>
            {/if}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={submitState === 'submitting'} onclick={() => (open = false)}>
              Cancel
            </Button>
            <Button disabled={submitState === 'submitting' || !form.name || !form.slug} onclick={createProject}>
              {#if submitState === 'submitting'}
                <Loader2 class="size-4 animate-spin" />
              {/if}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    {/snippet}
  </PageHeader>

  <PageBody class="space-y-4">
    {#if fetchError}
      <EmptyState
        icon={AlertCircle}
        role="alert"
        title="Couldn't load projects"
        description="Something went wrong on our side. Try again in a moment."
      >
        <Button size="sm" variant="outline" class="mt-4" onclick={() => void load()}>Retry</Button>
      </EmptyState>
    {:else if pending}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {#each [1, 2, 3] as n (n)}
          <Skeleton class="h-52 rounded-xl" />
        {/each}
      </div>
    {:else if !projects.length}
      <EmptyState icon={FolderPlus} title={$t('projects.empty.title')} description={$t('projects.empty.description')}>
        <Button size="sm" class="mt-4" onclick={() => (open = true)}>
          <Plus class="size-4" aria-hidden="true" />
          {$t('projects.empty.action')}
        </Button>
      </EmptyState>
    {:else}
      <DemoDataBanner message="Members, status and open tasks are sample values." />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each projects as p (p.id)}
          {@const meta = sampleMeta(p.id)}
          <a
            href={`/projects/${p.slug}`}
            class="group focus-visible:ring-ring/50 rounded-xl outline-none focus-visible:ring-[3px]"
          >
            <Card class="group-hover:border-primary/40 flex h-full flex-col transition-colors">
              <CardHeader>
                <CardTitle class="text-base">{p.name}</CardTitle>
                <CardDescription class="line-clamp-2">{p.description || 'No description yet.'}</CardDescription>
                <CardAction>
                  <Badge variant={meta.status.variant}>{meta.status.label}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent class="mt-auto">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex -space-x-2">
                    {#each meta.members as member (member)}
                      <Avatar class="ring-card size-8 ring-2" title={member}>
                        <AvatarFallback class="bg-muted text-muted-foreground text-xs">{initials(member)}</AvatarFallback>
                      </Avatar>
                    {/each}
                  </div>
                  <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs tabular-nums">
                    <CircleDot class="size-3.5" aria-hidden="true" />
                    {meta.openTasks} open
                  </span>
                </div>
              </CardContent>
              <CardFooter class="text-muted-foreground border-t pt-4 text-xs">
                <span>Updated <time datetime={new Date(p.updatedAt).toISOString()}>{timeAgo(p.updatedAt)}</time></span>
              </CardFooter>
            </Card>
          </a>
        {/each}

        <button
          type="button"
          class="text-muted-foreground hover:border-primary/40 hover:text-foreground focus-visible:ring-ring/50 flex min-h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-colors outline-none focus-visible:ring-[3px]"
          onclick={() => (open = true)}
        >
          <FolderPlus class="size-5" aria-hidden="true" />
          New project
        </button>
      </div>
    {/if}
  </PageBody>
</Page>
