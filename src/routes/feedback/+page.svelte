<script lang="ts">
  import type { Component } from 'svelte'
  import {
    Bug,
    Lightbulb,
    MessageCircle,
    Send,
    Sparkles,
    ThumbsUp,
  } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group'
  import { Textarea } from '$lib/components/ui/textarea'
  import { FormStatus } from '$lib/components/ui/form'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { apiFetch, type ApiResponse } from '$lib/api'

  let category = $state<'idea' | 'bug' | 'praise'>('idea')
  let subject = $state('')
  let message = $state('')

  type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent', delivered: boolean } | { kind: 'error', message: string }
  let status = $state<Status>({ kind: 'idle' })

  async function onSend() {
    status = { kind: 'sending' }
    const res: ApiResponse<{ delivered: boolean, id: string | null }> = await apiFetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ category, subject, message }),
    })

    if (!res.ok) {
      status = { kind: 'error', message: res.error.message }
      return
    }

    status = { kind: 'sent', delivered: res.data.delivered }
    subject = ''
    message = ''
  }

  const recent = [
    { kind: 'bug', author: 'Marcus R.', summary: 'Sparkline tooltip flickers when crossing zero', upvotes: 8, status: 'in-progress', age: '2d ago' },
    { kind: 'idea', author: 'Alice C.', summary: 'Let me pin sessions from the playground header, not just the menu', upvotes: 14, status: 'planned', age: '4d ago' },
    { kind: 'idea', author: 'David K.', summary: 'Add a "compare two models side-by-side" view in the playground', upvotes: 32, status: 'planned', age: '1w ago' },
    { kind: 'bug', author: 'Eva J.', summary: 'JSON mode adds a trailing newline on Quantum responses', upvotes: 3, status: 'shipped', age: '1w ago' },
    { kind: 'idea', author: 'Frank L.', summary: 'Slack notifications when batch jobs finish', upvotes: 21, status: 'considering', age: '2w ago' },
    { kind: 'praise', author: 'Olive P.', summary: 'The new docs search is incredibly fast — feels instant.', upvotes: 11, status: '', age: '2w ago' },
  ]

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'shipped': 'default',
    'in-progress': 'secondary',
    'planned': 'outline',
    'considering': 'outline',
  }

  const kindIcon: Record<string, Component> = { bug: Bug, idea: Lightbulb, praise: Sparkles }
  const kindColor: Record<string, string> = {
    bug: 'text-chart-3',
    idea: 'text-chart-4',
    praise: 'text-chart-2',
  }
</script>

<svelte:head>
  <title>Feedback | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading title="Feedback" description="Tell us what's broken, what's missing, what feels right. We read every submission within 48 hours." />
  </PageHeader>

  <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Send us a note</CardTitle>
        <CardDescription>Choose the closest match. We route based on category and respond from the right person.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-2">
          <Label>Category</Label>
          <RadioGroup bind:value={category} class="grid grid-cols-3 gap-2">
            <div
              class="hover:bg-muted/40 [&:has([data-state=checked])]:bg-muted [&:has([data-state=checked])]:border-foreground/30 flex items-center gap-2 rounded-lg border p-3 cursor-pointer"
            >
              <RadioGroupItem id="cat-idea" value="idea" />
              <Label for="cat-idea" class="cursor-pointer text-sm font-medium">Idea</Label>
            </div>
            <div
              class="hover:bg-muted/40 [&:has([data-state=checked])]:bg-muted [&:has([data-state=checked])]:border-foreground/30 flex items-center gap-2 rounded-lg border p-3 cursor-pointer"
            >
              <RadioGroupItem id="cat-bug" value="bug" />
              <Label for="cat-bug" class="cursor-pointer text-sm font-medium">Bug</Label>
            </div>
            <div
              class="hover:bg-muted/40 [&:has([data-state=checked])]:bg-muted [&:has([data-state=checked])]:border-foreground/30 flex items-center gap-2 rounded-lg border p-3 cursor-pointer"
            >
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
            If this is a bug, include the API request ID from the error toast — we can pull the exact server-side log.
          </p>
        </div>

        {#if status.kind === 'sent'}
          <FormStatus status="success" message={status.delivered ? 'Thanks — we got it.' : 'Sent (dev mode — printed to server log).'} />
        {:else if status.kind === 'error'}
          <FormStatus status="error" message={status.message} />
        {/if}

        <div class="flex justify-end gap-2">
          <Button variant="outline" disabled={status.kind === 'sending'}>Save draft</Button>
          <Button
            class="gap-2"
            disabled={status.kind === 'sending' || subject.length < 3 || message.length < 10}
            onclick={onSend}
          >
            <Send class="size-4" />
            {status.kind === 'sending' ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base flex items-center gap-2">
          <MessageCircle class="size-4" /> Recent from the team
        </CardTitle>
        <CardDescription>Public feedback from your workspace.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        {#each recent as r, i (i)}
          {@const KindIcon = kindIcon[r.kind]!}
          <div class="border-b pb-3 last:border-0 last:pb-0">
            <div class="flex items-start gap-2.5">
              <KindIcon class={['mt-0.5 size-4 shrink-0', kindColor[r.kind]]} />
              <div class="min-w-0 flex-1 space-y-1">
                <p class="text-sm leading-snug">{r.summary}</p>
                <div class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  <span>{r.author} · {r.age}</span>
                  {#if r.status}
                    <span aria-hidden="true">·</span>
                    <Badge variant={statusVariant[r.status]} class="capitalize">
                      {r.status.replace('-', ' ')}
                    </Badge>
                  {/if}
                </div>
              </div>
              <button
                class="hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors"
              >
                <ThumbsUp class="size-3" />
                <span class="tabular-nums">{r.upvotes}</span>
              </button>
            </div>
          </div>
        {/each}
      </CardContent>
    </Card>
  </div>
</Page>
