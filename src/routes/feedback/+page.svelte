<script lang="ts">
  import type { Component } from 'svelte'
  import { AlertCircle, Bug, CheckCircle2, Lightbulb, Send, Sparkles, ThumbsUp } from '@lucide/svelte'
  import { page } from '$app/state'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { FileUpload, FileUploadContent, FileUploadItem } from '$lib/components/ui/file-upload'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import DemoDataBanner from '$lib/components/blocks/demo-data-banner/DemoDataBanner.svelte'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { apiFetch, type ApiResponse } from '$lib/api'
  import { t } from '$lib/i18n'

  const title = $derived(routeLabel(page.url.pathname, $t))

  let category = $state<'idea' | 'bug' | 'praise'>('idea')
  let subject = $state('')
  let message = $state('')

  // Screenshots: images only, capped at 3 files / 5 MB each. Validated
  // here for fast feedback; the API re-checks every file server-side.
  const MAX_FEEDBACK_FILES = 3
  const MAX_FEEDBACK_FILE_BYTES = 5 * 1024 * 1024

  let files = $state<File[]>([])
  let fileError = $state<string | null>(null)

  function onFilesPicked(next: File[]) {
    fileError = null
    const merged = [...files]
    for (const f of next) {
      if (!f.type.startsWith('image/')) {
        fileError = $t('feedback.attachments.badType', { name: f.name })
        continue
      }
      if (f.size > MAX_FEEDBACK_FILE_BYTES) {
        fileError = $t('feedback.attachments.tooBig', { name: f.name })
        continue
      }
      if (merged.length >= MAX_FEEDBACK_FILES) {
        fileError = $t('feedback.attachments.tooMany')
        break
      }
      if (merged.some(m => m.name === f.name && m.size === f.size)) continue
      merged.push(f)
    }
    files = merged.slice(0, MAX_FEEDBACK_FILES)
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index)
    if (!files.length) fileError = null
  }

  type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent', delivered: boolean } | { kind: 'error', message: string }
  let status = $state<Status>({ kind: 'idle' })

  async function onSend() {
    status = { kind: 'sending' }
    const form = new FormData()
    form.append('category', category)
    form.append('subject', subject)
    form.append('message', message)
    for (const f of files) form.append('files', f, f.name)
    // No JSON content-type header: the browser sets the multipart boundary.
    const res: ApiResponse<{ delivered: boolean, id: string | null }> = await apiFetch('/api/feedback', {
      method: 'POST',
      headers: {},
      body: form,
    })

    if (!res.ok) {
      status = { kind: 'error', message: res.error.message }
      return
    }

    status = { kind: 'sent', delivered: res.data.delivered }
    subject = ''
    message = ''
    files = []
    fileError = null
  }

  const recent = [
    { kind: 'bug', author: 'Mark R.', summary: 'Chart tooltip flickers when a series crosses zero', upvotes: 8, status: 'in-progress', age: '2d ago' },
    { kind: 'idea', author: 'Alice C.', summary: 'Pin favorite projects to the top of the sidebar', upvotes: 14, status: 'planned', age: '4d ago' },
    { kind: 'idea', author: 'David K.', summary: 'Compare two billing periods side by side on the usage page', upvotes: 32, status: 'planned', age: '1w ago' },
    { kind: 'bug', author: 'Eva J.', summary: 'CSV export adds a blank line at the end of the file', upvotes: 3, status: 'shipped', age: '1w ago' },
    { kind: 'idea', author: 'Frank L.', summary: 'Slack notifications when a deploy finishes', upvotes: 21, status: 'considering', age: '2w ago' },
    { kind: 'praise', author: 'Olivia P.', summary: 'The new search is incredibly fast — feels instant.', upvotes: 11, status: '', age: '2w ago' },
  ]

  const statusVariant: Record<string, 'success' | 'info' | 'secondary' | 'outline'> = {
    'shipped': 'success',
    'in-progress': 'info',
    'planned': 'secondary',
    'considering': 'outline',
  }

  const kindIcon: Record<string, Component> = { bug: Bug, idea: Lightbulb, praise: Sparkles }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading
      {title}
      description="Tell us what's broken, what's missing and what works. We read every note within 48 hours."
    />
  </PageHeader>

  <PageBody class="grid gap-4 lg:grid-cols-3">
    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle class="text-base">Send us a note</CardTitle>
        <CardDescription>Pick the closest category so the right person replies.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-2">
          <Label id="fb-category">Category</Label>
          <RadioGroup bind:value={category} aria-labelledby="fb-category" class="grid grid-cols-3 gap-2">
            <div class="hover:bg-muted/40 [&:has([data-state=checked])]:bg-muted [&:has([data-state=checked])]:border-foreground/30 flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
              <RadioGroupItem id="cat-idea" value="idea" />
              <Label for="cat-idea" class="cursor-pointer text-sm font-medium">Idea</Label>
            </div>
            <div class="hover:bg-muted/40 [&:has([data-state=checked])]:bg-muted [&:has([data-state=checked])]:border-foreground/30 flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
              <RadioGroupItem id="cat-bug" value="bug" />
              <Label for="cat-bug" class="cursor-pointer text-sm font-medium">Bug</Label>
            </div>
            <div class="hover:bg-muted/40 [&:has([data-state=checked])]:bg-muted [&:has([data-state=checked])]:border-foreground/30 flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
              <RadioGroupItem id="cat-praise" value="praise" />
              <Label for="cat-praise" class="cursor-pointer text-sm font-medium">Praise</Label>
            </div>
          </RadioGroup>
        </div>

        <div class="grid gap-2">
          <Label for="fb-subject">Subject</Label>
          <Input id="fb-subject" bind:value={subject} placeholder="One-line summary" />
        </div>

        <div class="grid gap-2">
          <Label for="fb-message">Details</Label>
          <Textarea
            id="fb-message"
            bind:value={message}
            rows={6}
            placeholder="What happened? What were you expecting? Anything we should reproduce?"
          />
          <p class="text-muted-foreground text-xs">
            For bugs, include the steps you took and the request ID from any error message.
          </p>
        </div>

        <div class="grid gap-2">
          <Label>{$t('feedback.attachments.label')}</Label>
          <FileUpload
            modelValue={files}
            accept="image/*"
            multiple
            disabled={status.kind === 'sending'}
            onModelValueChange={onFilesPicked}
          >
            {#snippet content()}
              {#if files.length}
                <FileUploadContent>
                  {#each files as f, i (`${f.name}-${f.size}`)}
                    <FileUploadItem file={f} onRemove={() => removeFile(i)} />
                  {/each}
                </FileUploadContent>
              {/if}
            {/snippet}
          </FileUpload>
          <p class="text-muted-foreground text-xs">{$t('feedback.attachments.hint')}</p>
          {#if fileError}
            <p class="text-destructive text-xs">{fileError}</p>
          {/if}
        </div>

        {#if status.kind === 'sent'}
          <div
            class="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            role="status"
          >
            <CheckCircle2 class="size-4 shrink-0" aria-hidden="true" />
            <!-- `status.delivered` is false when no email provider is set up
                 (the note is printed to the server log instead). -->
            Thanks — we got it.
          </div>
        {:else if status.kind === 'error'}
          <div
            class="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            role="alert"
          >
            <AlertCircle class="size-4 shrink-0" aria-hidden="true" />
            {status.message}
          </div>
        {/if}

        <div class="flex justify-end gap-2">
          <Button variant="outline" disabled={status.kind === 'sending'}>Save draft</Button>
          <Button disabled={status.kind === 'sending' || subject.length < 3 || message.length < 10} onclick={onSend}>
            <Send class="size-4" aria-hidden="true" />
            {status.kind === 'sending' ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Recent from the team</CardTitle>
        <CardDescription>Public feedback from your workspace.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <DemoDataBanner message="Sample feedback. Your team's notes will appear here." />
        {#each recent as r, i (i)}
          {@const KindIcon = kindIcon[r.kind]!}
          <div class="border-b pb-4 last:border-0 last:pb-0">
            <div class="flex items-start gap-3">
              <KindIcon class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div class="min-w-0 flex-1 space-y-1">
                <p class="text-sm">{r.summary}</p>
                <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  <span>{r.author} · {r.age}</span>
                  {#if r.status}
                    <Badge variant={statusVariant[r.status]} class="capitalize">{r.status.replace('-', ' ')}</Badge>
                  {/if}
                </div>
              </div>
              <button
                type="button"
                aria-label={`Upvote: ${r.upvotes} votes`}
                class="hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors"
              >
                <ThumbsUp class="size-3.5" aria-hidden="true" />
                <span class="tabular-nums">{r.upvotes}</span>
              </button>
            </div>
          </div>
        {/each}
      </CardContent>
    </Card>
  </PageBody>
</Page>
