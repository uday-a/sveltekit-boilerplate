<script lang="ts">
  import type { Component } from 'svelte'
  // NOTE: lucide removed brand icons (Github, Slack) — GitBranch and
  // MessagesSquare are the closest available glyphs. Copy stays 1:1.
  import { ExternalLink, GitBranch, MessagesSquare, Plug, Plus, Webhook } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Separator } from '$lib/components/ui/separator'
  import { Page, PageBody, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { page } from '$app/state'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'

  const title = $derived(routeLabel(page.url.pathname, $t))

  interface Integration {
    id: string
    name: string
    description: string
    icon: Component
    connected: boolean
    account?: string
  }

  const integrations: Integration[] = [
    { id: 'github', name: 'GitHub', description: 'Link repositories and surface PR activity in the workspace.', icon: GitBranch, connected: true, account: 'acme-inc' },
    { id: 'slack', name: 'Slack', description: 'Send notifications and command shortcuts into a Slack workspace.', icon: MessagesSquare, connected: false },
    { id: 'webhook', name: 'Webhooks', description: 'POST workspace events to a URL you control.', icon: Webhook, connected: false },
  ]
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description="Connect external services and configure webhooks." />
  </PageHeader>

  <PageBody class="max-w-3xl space-y-4">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Available</CardTitle>
        <CardDescription>OAuth apps and event sinks.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        {#each integrations as item, idx (item.id)}
          {@const ItemIcon = item.icon}
          <div>
            <div class="flex flex-wrap items-start justify-between gap-4 py-2">
              <div class="flex items-start gap-3">
                <div class="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                  <ItemIcon class="size-5" />
                </div>
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">{item.name}</p>
                    {#if item.connected}
                      <Badge variant="secondary">
                        Connected{item.account ? ` · ${item.account}` : ''}
                      </Badge>
                    {/if}
                  </div>
                  <p class="text-muted-foreground text-xs">{item.description}</p>
                </div>
              </div>
              {#if item.connected}
                <Button variant="outline" size="sm">Disconnect</Button>
              {:else}
                <Button variant="outline" size="sm">
                  <Plug class="size-4" />
                  Connect
                </Button>
              {/if}
            </div>
            {#if idx < integrations.length - 1}
              <Separator />
            {/if}
          </div>
        {/each}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Webhooks</CardTitle>
        <CardDescription>POST workspace events as JSON to your endpoint.</CardDescription>
        <CardAction>
          <Button size="sm">
            <Plus class="size-4" />
            Add webhook
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div class="text-muted-foreground flex items-center gap-2 text-sm">
          No webhooks configured.
          <a href="#" class="text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline">
            Read the docs <ExternalLink class="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </CardContent>
    </Card>
  </PageBody>
</Page>
