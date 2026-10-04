<script lang="ts">
  import { Check, Loader2 } from '@lucide/svelte'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Switch } from '$lib/components/ui/switch'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group'
  import { Slider } from '$lib/components/ui/slider'
  import { Separator } from '$lib/components/ui/separator'
  import { Page, PageHeader, PageHeaderHeading, PageBody } from '$lib/components/ui/page'
  import { page } from '$app/state'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { locale, locales, setLocale, t, type Locale } from '$lib/i18n'
  import { formatMoney } from '$lib/utils'
  import { SvelteSet } from 'svelte/reactivity'

  // Port of nuxt `app/pages/dashboard/forms.vue` — plain bind:value settings
  // form. Language preference is owned by the i18n module (`$lib/i18n`):
  // switching persists to the `uipkge-locale` cookie immediately, no Save
  // needed.

  const title = $derived(routeLabel(page.url.pathname, $t))

  // Single bundled form for the demo. State lives in plain $state -- swap
  // for @tanstack/svelte-form when validation logic gets non-trivial (see
  // /dashboard/form-example for the validated pattern).
  let profile = $state({
    name: 'Alex Morgan',
    email: 'alex@acme.example',
    bio: 'Eng lead. Owns the platform team. Coffee → code → repeat.',
  })

  let account = $state({
    password: '',
    timezone: 'utc',
    visibility: 'team' as 'private' | 'team' | 'public',
  })

  const languageOptions = $derived(locales.map((l) => ({ code: l.code, label: l.name || l.code.toUpperCase() })))

  async function onLocaleChange(next: string) {
    await setLocale(next as Locale)
  }

  let notifications = $state({
    email: true,
    push: false,
    weekly: ['product', 'security'] as string[],
  })

  const NOTIFICATION_OPTIONS = [
    { value: 'product', label: 'Product updates' },
    { value: 'security', label: 'Security alerts' },
    { value: 'billing', label: 'Billing & receipts' },
    { value: 'marketing', label: 'Marketing & promotions' },
  ]

  let billing = $state({ seats: 12 })

  let submitting = $state(false)
  let savedAt = $state<string | null>(null)

  function toggleNotification(value: string, checked: boolean) {
    const next = new SvelteSet(notifications.weekly)
    if (checked) next.add(value)
    else next.delete(value)
    notifications.weekly = Array.from(next)
  }

  async function onSubmit(e: Event) {
    e.preventDefault()
    submitting = true
    // Fake latency so the loading state is visible.
    await new Promise((r) => setTimeout(r, 700))
    submitting = false
    savedAt = new Date().toLocaleTimeString()
  }
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<!-- method="post": before hydration a native submit must never put the
     password field into a GET query string. -->
<form method="post" onsubmit={onSubmit}>
  <Page>
    <PageHeader>
      <PageHeaderHeading {title} description="Profile, account, notification and billing form patterns." />
    </PageHeader>

    <PageBody class="max-w-3xl space-y-4">
      <!-- Profile -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Profile</CardTitle>
          <CardDescription>Public information shown alongside your activity.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="name">Full name</Label>
            <Input id="name" bind:value={profile.name} placeholder="Jane Doe" />
          </div>
          <div class="space-y-2">
            <Label for="email">Work email</Label>
            <Input id="email" bind:value={profile.email} type="email" placeholder="you@company.com" />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label for="bio">Short bio</Label>
            <Textarea id="bio" bind:value={profile.bio} rows={3} maxLength={280} placeholder="Tell people what you work on…" />
            <p class="text-muted-foreground text-xs tabular-nums">{profile.bio.length} / 280</p>
          </div>
        </CardContent>
      </Card>

      <!-- Account -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Account</CardTitle>
          <CardDescription>Security and visibility settings.</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="password">New password</Label>
            <Input
              id="password"
              bind:value={account.password}
              type="password"
              placeholder="Leave blank to keep current"
              showPasswordToggle
            />
          </div>
          <div class="space-y-2">
            <Label for="tz">Timezone</Label>
            <Select value={account.timezone} onValueChange={(v) => (account.timezone = v)}>
              <SelectTrigger id="tz">
                <SelectValue placeholder="Pick a timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utc">UTC · Coordinated Universal Time</SelectItem>
                <SelectItem value="pst">PST · Pacific (UTC−8)</SelectItem>
                <SelectItem value="est">EST · Eastern (UTC−5)</SelectItem>
                <SelectItem value="cet">CET · Central European (UTC+1)</SelectItem>
                <SelectItem value="jst">JST · Japan (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label for="language">Language</Label>
            <Select value={$locale ?? 'en'} onValueChange={(v) => void onLocaleChange(v)}>
              <SelectTrigger id="language" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {#each languageOptions as opt (opt.code)}
                  <SelectItem value={opt.code}>{opt.label}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
            <p class="text-muted-foreground text-xs">Applies right away — no need to save.</p>
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label>Profile visibility</Label>
            <RadioGroup value={account.visibility} onValueChange={(v) => (account.visibility = v)} class="sm:grid-cols-3">
              <label
                class="hover:bg-muted/50 has-[[data-state=checked]]:border-primary flex w-full cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              >
                <RadioGroupItem value="private" class="mt-0.5" />
                <div class="flex-1 space-y-0.5">
                  <div class="text-sm leading-none font-medium">Private</div>
                  <div class="text-muted-foreground text-xs">Only you can see this profile.</div>
                </div>
              </label>
              <label
                class="hover:bg-muted/50 has-[[data-state=checked]]:border-primary flex w-full cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              >
                <RadioGroupItem value="team" class="mt-0.5" />
                <div class="flex-1 space-y-0.5">
                  <div class="text-sm leading-none font-medium">Team</div>
                  <div class="text-muted-foreground text-xs">Anyone in your workspace.</div>
                </div>
              </label>
              <label
                class="hover:bg-muted/50 has-[[data-state=checked]]:border-primary flex w-full cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors"
              >
                <RadioGroupItem value="public" class="mt-0.5" />
                <div class="flex-1 space-y-0.5">
                  <div class="text-sm leading-none font-medium">Public</div>
                  <div class="text-muted-foreground text-xs">Anyone with the link.</div>
                </div>
              </label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <!-- Notifications -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Notifications</CardTitle>
          <CardDescription>Pick the channels and topics you want to hear about.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div class="space-y-0.5">
              <Label for="notify-email">Email notifications</Label>
              <p class="text-muted-foreground text-xs">Daily digest of activity in your workspace.</p>
            </div>
            <Switch id="notify-email" bind:checked={notifications.email} />
          </div>
          <Separator />
          <div class="flex items-center justify-between gap-4">
            <div class="space-y-0.5">
              <Label for="notify-push">Push notifications</Label>
              <p class="text-muted-foreground text-xs">Real-time on mobile when something needs your attention.</p>
            </div>
            <Switch id="notify-push" bind:checked={notifications.push} />
          </div>
          <Separator />
          <div class="space-y-2">
            <Label>Weekly digest topics</Label>
            <div class="grid gap-2 sm:grid-cols-2">
              {#each NOTIFICATION_OPTIONS as opt (opt.value)}
                <label
                  class="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors"
                >
                  <Checkbox
                    checked={notifications.weekly.includes(opt.value)}
                    onCheckedChange={(v) => toggleNotification(opt.value, v === true)}
                  />
                  {opt.label}
                </label>
              {/each}
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Billing -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Billing</CardTitle>
          <CardDescription>Seats and plan size. Charged monthly at $12/seat.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <div class="flex items-baseline justify-between">
              <Label for="billing-seats">Team seats</Label>
              <!-- WHY (Rule15/28): billing math formats through the shared
                   helper and the /mo unit sits muted so the figure scans. -->
              <span class="text-sm tabular-nums">{billing.seats} seats · {formatMoney(billing.seats * 12)}<span class="text-muted-foreground">/mo</span></span>
            </div>
            <Slider
              id="billing-seats"
              value={billing.seats}
              onValueChange={(v) => (billing.seats = Array.isArray(v) ? (v[0] ?? 1) : v)}
              min={1}
              max={50}
              step={1}
              aria-label="Team seats"
            />
            <div class="text-muted-foreground flex justify-between text-xs tabular-nums">
              <span>1</span>
              <span>50</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="flex items-center justify-end gap-2">
        {#if savedAt}
          <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs" role="status">
            <Check class="text-success size-3.5" aria-hidden="true" />Saved at {savedAt}
          </span>
        {/if}
        <Button type="submit" disabled={submitting}>
          {#if submitting}
            <Loader2 class="size-4 animate-spin" aria-hidden="true" />
          {/if}
          {submitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </PageBody>
  </Page>
</form>
