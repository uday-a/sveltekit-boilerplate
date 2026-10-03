<script lang="ts">
  import { Boxes } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Separator } from '$lib/components/ui/separator'

  const REPO_URL = 'https://github.com/uday-a/sveltekit-boilerplate'

  let newsletter = $state('')
  let subscribed = $state(false)

  function subscribe() {
    if (!newsletter) return
    subscribed = true
    newsletter = ''
  }
</script>

<!-- Brand icons are not in @lucide/svelte (Lucide ships no brand glyphs), so
     the social mark is an inline SVG — same path as the React twin. -->

{#snippet githubIcon(className: string)}
  <svg class={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0C17 4.7 18 5 18 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
    />
  </svg>
{/snippet}

<footer data-slot="footer-01" class="bg-background border-t">
  <div class="mx-auto max-w-6xl px-4 py-4">
    <div class="grid gap-4 lg:grid-cols-12">
      <div class="space-y-4 lg:col-span-4">
        <div class="flex items-center gap-2">
          <div class="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <Boxes class="size-4" />
          </div>
          <span class="text-base font-semibold">Acme</span>
        </div>
        <p class="text-muted-foreground max-w-sm text-sm">Projects, billing and permissions for growing teams. Product updates once a month.</p>
        <form
          class="flex max-w-sm gap-2"
          onsubmit={(e) => {
            e.preventDefault()
            subscribe()
          }}
        >
          <Input bind:value={newsletter} type="email" placeholder="you@company.com" required class="flex-1" />
          <Button type="submit">Subscribe</Button>
        </form>
        {#if subscribed}
          <p class="text-success text-xs">Thanks — check your inbox to confirm.</p>
        {/if}
      </div>

      <!-- Real destinations only: a boilerplate footer full of href="#" teaches
           dead links. Add columns back as the pages exist. -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-8">
        <div class="space-y-3">
          <h3 class="text-sm font-semibold">Product</h3>
          <ul class="space-y-2">
            <li>
              <a href="/#features" class="text-muted-foreground hover:text-foreground text-sm transition-colors">Features</a>
            </li>
            <li>
              <a href="/pricing" class="text-muted-foreground hover:text-foreground text-sm transition-colors">Pricing</a>
            </li>
            <li>
              <a href="/login" class="text-muted-foreground hover:text-foreground text-sm transition-colors">Sign in</a>
            </li>
          </ul>
        </div>
        <div class="space-y-3">
          <h3 class="text-sm font-semibold">Resources</h3>
          <ul class="space-y-2">
            <li>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground text-sm transition-colors">Documentation</a>
            </li>
            <li>
              <a href="/support" class="text-muted-foreground hover:text-foreground text-sm transition-colors">Help center</a>
            </li>
            <li>
              <a href="/feedback" class="text-muted-foreground hover:text-foreground text-sm transition-colors">Feedback</a>
            </li>
          </ul>
        </div>
        <div class="space-y-3">
          <h3 class="text-sm font-semibold">Legal</h3>
          <ul class="space-y-2">
            <li>
              <a href="/terms" class="text-muted-foreground hover:text-foreground text-sm transition-colors">Terms</a>
            </li>
            <li>
              <a href="/privacy" class="text-muted-foreground hover:text-foreground text-sm transition-colors">Privacy</a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <Separator class="my-4" />

    <div class="flex flex-wrap items-center justify-between gap-4">
      <p class="text-muted-foreground text-xs">© 2026 Acme. All rights reserved.</p>
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="text-muted-foreground hover:text-foreground transition-colors">
        {@render githubIcon('size-4')}
      </a>
    </div>
  </div>
</footer>
