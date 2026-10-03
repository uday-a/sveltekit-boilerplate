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
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { locale, t } from '$lib/i18n'

  interface Project {
    id: number
    slug: string
    name: string
    description: string | null
    ownerId: number
    createdAt: string | Date
    updatedAt: string | Date
  }

  const slug = $derived(String(page.params.slug ?? ''))

  let project = $state<Project | null>(null)
  let pending = $state(true)
  let loadError = $state<string | null>(null)

  async function load(currentSlug: string) {
    if (!currentSlug) return
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

  $effect(() => {
    void load(slug)
  })

  // Edit form. Initialized from server data each time it arrives.
  let form = $state({ name: '', description: '' })

  $effect(() => {
    if (project) {
      form.name = project.name
      form.description = project.description ?? ''
    }
  })

  let saveState = $state<'idle' | 'saving' | 'error'>('idle')
  let saveError = $state<string | null>(null)
  let deleteState = $state<'idle' | 'deleting'>('idle')
  // Designed confirm dialog instead of window.confirm(), matching delete-user.
  let confirmDelete = $state(false)

  const createdLabel = $derived(
    project ? new Date(project.createdAt).toLocaleDateString($locale ?? 'en', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
  )

  async function save() {
    if (!project) return
    saveState = 'saving'
    saveError = null
    const res: ApiResponse<{ project: Project }> = await apiFetch(`/api/projects/${slug}`, {
      method: 'PUT',
      body: JSON.stringify({ name: form.name, description: form.description || null }),
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
  <title>{project?.name ?? slug} · Projects | UIPKGE</title>
</svelte:head>

<Page class="max-w-3xl">
  <PageHeader>
    <PageHeaderHeading
      title={project?.name ?? slug}
      description={project ? `Project · ${project.slug} · created ${createdLabel}` : undefined}
    />
  </PageHeader>

  {#if loadError}
    <Card>
      <EmptyState icon={AlertCircle} title={$t('common.loadFailedTitle')} description={$t('common.loadFailed')} role="alert">
        <Button variant="outline" size="sm" class="mt-4" onclick={() => load(slug)}>{$t('common.retry')}</Button>
      </EmptyState>
    </Card>
  {:else if pending}
    <p class="text-muted-foreground text-sm">{$t('common.loading')}</p>
  {:else if project}
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Details</CardTitle>
        <CardDescription>Edit the project metadata. Slug is immutable after creation.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-2">
          <Label for="p-name">Name</Label>
          <Input id="p-name" bind:value={form.name} />
        </div>
        <div class="grid gap-2">
          <Label for="p-desc">Description</Label>
          <Textarea id="p-desc" bind:value={form.description} rows={4} />
        </div>
        {#if saveError}
          <div class="text-destructive flex items-center gap-2 text-sm">
            <AlertCircle class="size-4" />
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
            <Trash2 class="size-4" />
            Delete project
          </Button>
          <Button disabled={saveState === 'saving' || !form.name} onclick={save}>
            {#if saveState === 'saving'}
              <Loader2 class="size-4 animate-spin" />
            {/if}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}

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
