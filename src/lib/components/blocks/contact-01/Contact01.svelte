<script lang="ts" module>
  export interface Contact01Props {
    onSubmit?: (payload: { name: string; email: string; company: string; subject: string; message: string }) => void
  }
</script>

<script lang="ts">
  import { CheckCircle2, Mail, MapPin, Phone, Send } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Textarea } from '$lib/components/ui/textarea'

  let { onSubmit }: Contact01Props = $props()

  // Select items only register while the list is open, so the trigger
  // label is resolved here (same pattern as settings/team).
  const subjects: Record<string, string> = {
    sales: 'Talking to sales',
    support: 'Customer support',
    partnership: 'Partnerships',
    other: 'Something else',
  }

  let name = $state('')
  let email = $state('')
  let company = $state('')
  let subject = $state('sales')
  let message = $state('')
  let sent = $state(false)

  const canSubmit = $derived(!!name && !!email && !!message)

  function submit(e: SubmitEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({ name, email, company, subject, message })
    sent = true
  }
</script>

<section data-slot="contact-01" class="bg-background">
  <div class="mx-auto max-w-6xl px-6 py-24">
    <div class="grid gap-10 lg:grid-cols-2 lg:items-start">
      <div class="space-y-6">
        <p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">Contact</p>
        <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">Talk to a human</h2>
        <p class="text-muted-foreground text-lg">
          Tell us a bit about your team and we'll show you how we'd fit. Average reply: 4 hours.
        </p>

        <div class="space-y-3 pt-4">
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 text-primary rounded-lg p-2">
              <Mail class="size-4" />
            </div>
            <div>
              <p class="text-muted-foreground text-xs uppercase">Email</p>
              <a href="mailto:hello@acme.test" class="text-sm font-medium hover:underline"> hello@acme.test </a>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 text-primary rounded-lg p-2">
              <Phone class="size-4" />
            </div>
            <div>
              <p class="text-muted-foreground text-xs uppercase">Phone</p>
              <p class="text-sm font-medium">+1 (415) 555-0142</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="bg-primary/10 text-primary rounded-lg p-2">
              <MapPin class="size-4" />
            </div>
            <div>
              <p class="text-muted-foreground text-xs uppercase">Office</p>
              <p class="text-sm font-medium">120 Howard St, San Francisco</p>
            </div>
          </div>
        </div>

        <div class="bg-muted/40 mt-6 flex h-48 items-center justify-center rounded-lg border border-dashed">
          <p class="text-muted-foreground text-sm">Map placeholder</p>
        </div>
      </div>

      <Card>
        {#if !sent}
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>We reply during business hours (PT)</CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-4" onsubmit={submit}>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="grid gap-2">
                  <Label for="contact-name">Name</Label>
                  <Input id="contact-name" bind:value={name} autocomplete="off" required />
                </div>
                <div class="grid gap-2">
                  <Label for="contact-email">Work email</Label>
                  <Input id="contact-email" bind:value={email} type="email" autocomplete="off" required />
                </div>
              </div>
              <div class="grid gap-2">
                <Label for="contact-company">Company</Label>
                <Input id="contact-company" bind:value={company} />
              </div>
              <div class="grid gap-2">
                <Label for="contact-subject">I'm interested in</Label>
                <Select bind:value={subject}>
                  <SelectTrigger id="contact-subject">
                    <SelectValue>{subjects[subject]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {#each Object.entries(subjects) as [value, label] (value)}
                      <SelectItem {value}>{label}</SelectItem>
                    {/each}
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-2">
                <Label for="contact-message">Message</Label>
                <Textarea id="contact-message" bind:value={message} placeholder="How can we help?" required />
              </div>
              <Button type="submit" class="w-full" disabled={!canSubmit}>
                Send message
                <Send class="ml-2 size-4" />
              </Button>
            </form>
          </CardContent>
        {:else}
          <CardContent class="space-y-4 pt-8 text-center">
            <div
              class="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]"
            >
              <CheckCircle2 class="size-6" />
            </div>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">Message sent</h3>
              <p class="text-muted-foreground text-sm">Thanks {name}, we'll be in touch within a few hours.</p>
            </div>
            <Button variant="outline" onclick={() => (sent = false)}>Send another</Button>
          </CardContent>
        {/if}
      </Card>
    </div>
  </div>
</section>
