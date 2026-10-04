<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { AlertCircle, Loader2, Trash2 } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from '$lib/components/ui/dialog'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import { EmptyState } from '$lib/components/ui/empty-state'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { locale, t } from '$lib/i18n'
  import type { PageData } from './$types'
  import type { Project } from './+page'

  let { data }: { data: PageData } = $props()

  const slug = $derived(String(page.params.slug ?? ''))

  // Writable deriveds: seeded from the load (SSR + client nav between
  // slugs), overwritten in place by save/retry re-fetches.
  let project = $derived<Project | null>(data.project)
  let loadError = $derived<string | null>(data.loadError)
  let pending = $state(false)

  async function load(currentSlug: string) {
    pending = true
    loadError = null
    const res: ApiResponse<{ project: Project }> = await apiFetch(`/api/projects/${currentSlug}`)
    if (res.ok) {
      project = res.data.project
    }
    else {
      project = null
      loadError = res.error.message
    }
    pending = false
  }

  // Detail pages have no nav label of their own; the H1 and tab title use
  // the project's name (falling back to the route label while it loads).
  const title = $derived(project?.name ?? routeLabel(page.url.pathname, $t))

  // Edit form. Re-initialized from server data each time it arrives
  // (writable deriveds, so the fields are filled on SSR too).
  let formName = $derived(project?.name ?? '')
  let formDescription = $derived(project?.description ?? '')

  let saveState = $state<'idle' | 'saving' | 'error'>('idle')
  let saveError = $state<string | null>(null)
  let deleteState = $state<'idle' | 'deleting'>('idle')
  // Designed confirm dialog instead of window.confirm(), matching delete-user.
  let confirmDelete = $state(false)

  async function save() {
    if (!project) return
    saveState = 'saving'
    saveError = null
    const res: ApiResponse<{ project: Project }> = await apiFetch(`/api/projects/${slug}`, {
      method: 'PUT',
      body: JSON.stringify({ name: formName, description: formDescription || null }),
    })
    if (!res.ok) {
      saveError = res.error.message
      saveState = 'error'
      return
    }
    saveState = 'idle'
    await load(slug)
  }

  async function remove() {
    if (!project) return
    confirmDelete = false
    deleteState = 'deleting'
    const res: ApiResponse<{ deleted: boolean }> = await apiFetch(`/api/projects/${slug}`, {
      method: 'DELETE',
    })
    deleteState = 'idle'
    if (res.ok) {
      await goto('/projects')
    }
    else {
      saveError = res.error.message
    }
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading
      {title}
      description={project ? `Created ${new Date(project.createdAt).toLocaleDateString($locale ?? 'en')}` : undefined}
    />
  </PageHeader>

  <PageBody class="max-w-3xl space-y-4">
    {#if loadError}
      <EmptyState
        icon={AlertCircle}
        role="alert"
        title="Couldn't load this project"
        description="It may have been deleted, or something went wrong on our side."
      >
        <div class="mt-4 flex justify-center gap-2">
          <Button size="sm" variant="outline" onclick={() => load(slug)}>Retry</Button>
          <Button size="sm" variant="ghost">
            {#snippet child({ props })}
              <a href="/projects" {...props}>Back to projects</a>
            {/snippet}
          </Button>
        </div>
      </EmptyState>
    {:else if pending}
      <Skeleton class="h-72 rounded-xl" aria-busy="true" />
    {:else if project}
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Details</CardTitle>
          <CardDescription>Rename the project or update its description.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-2">
            <Label for="p-name">Name</Label>
            <Input id="p-name" bind:value={formName} />
          </div>
          <div class="grid gap-2">
            <Label for="p-desc">Description</Label>
            <Textarea id="p-desc" bind:value={formDescription} rows={4} />
          </div>
          {#if saveError}
            <div class="text-destructive flex items-center gap-2 text-sm" role="alert">
              <AlertCircle class="size-4 shrink-0" aria-hidden="true" />
              {saveError}
            </div>
          {/if}
          <div class="flex justify-between">
            <Button
              variant="ghost"
              disabled={deleteState === 'deleting'}
              class="text-destructive hover:text-destructive"
              onclick={() => (confirmDelete = true)}
            >
              <Trash2 class="size-4" aria-hidden="true" />
              Delete project
            </Button>
            <Button disabled={saveState === 'saving' || !formName} onclick={save}>
              {#if saveState === 'saving'}
                <Loader2 class="size-4 animate-spin" aria-hidden="true" />
              {/if}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    {/if}
  </PageBody>

  <!-- Delete confirmation -->
  <Dialog bind:open={confirmDelete}>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete “{project?.name}”?</DialogTitle>
        <DialogDescription>The project and its settings are removed for everyone. This can’t be undone.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onclick={() => (confirmDelete = false)}>Cancel</Button>
        <Button variant="destructive" disabled={deleteState === 'deleting'} onclick={remove}>
          {#if deleteState === 'deleting'}
            <Loader2 class="size-4 animate-spin" />
          {:else}
            <Trash2 class="size-4" aria-hidden="true" />
          {/if}
          Delete project
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</Page>
