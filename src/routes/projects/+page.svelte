<script lang="ts">
  import { onMount } from 'svelte'
  import { AlertCircle, Folder, Loader2, Plus } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '$lib/components/ui/dialog'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { apiFetch, type ApiResponse } from '$lib/api'

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
  let pending = $state(true)
  let fetchError = $state<string | null>(null)

  async function load() {
    pending = true
    fetchError = null
    const res: ApiResponse<{ projects: Project[] }> = await apiFetch('/api/projects')
    if (res.ok) {
      projects = res.data.projects
    }
    else {
      fetchError = res.error.message
    }
    pending = false
  }

  onMount(() => {
    void load()
  })

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
  <title>Projects | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading title="Projects" description="Workspaces grouping related work, members, and assets." />
    {#snippet actions()}
      <Dialog bind:open>
        <DialogTrigger>
          {#snippet child({ props })}
            <Button size="sm" {...props}>
              <Plus class="size-4" />
              New project
            </Button>
          {/snippet}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Slug becomes part of the URL: /projects/&lt;slug&gt;.</DialogDescription>
          </DialogHeader>
          <div class="space-y-3">
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
              <Label for="np-slug">Slug</Label>
              <Input
                id="np-slug"
                bind:value={form.slug}
                placeholder="my-new-project"
                onValueChange={() => {
                  slugTouched = true
                }}
              />
              <p class="text-muted-foreground text-xs">Lowercase letters, numbers, hyphens. Must be unique.</p>
            </div>
            <div class="grid gap-2">
              <Label for="np-desc">Description (optional)</Label>
              <Textarea id="np-desc" bind:value={form.description} rows={3} />
            </div>
            {#if submitError}
              <div class="text-destructive flex items-center gap-2 text-sm">
                <AlertCircle class="size-4" />
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

  {#if fetchError}
    <div
      class="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <AlertCircle class="size-4" />
      {fetchError}
    </div>
  {:else if pending}
    <div class="text-muted-foreground text-sm">Loading projects…</div>
  {:else if !projects.length}
    <div class="text-muted-foreground text-sm">No projects yet. Create one to get started.</div>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each projects as p (p.id)}
        <a href={`/projects/${p.slug}`} class="group">
          <Card class="h-full transition-colors group-hover:border-foreground/20">
            <CardHeader>
              <div class="flex items-center gap-2">
                <Folder class="text-muted-foreground size-4" />
                <CardTitle class="text-base">{p.name}</CardTitle>
              </div>
              <CardDescription>{p.description ?? '—'}</CardDescription>
            </CardHeader>
            <CardContent>
              <span class="text-muted-foreground text-xs">Open project →</span>
            </CardContent>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</Page>
