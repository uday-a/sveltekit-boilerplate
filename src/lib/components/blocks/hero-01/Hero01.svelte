<script lang="ts">
  import { ArrowRight, PlayCircle } from '@lucide/svelte'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
</script>

<section data-slot="hero-01" class="bg-background relative overflow-hidden">
  <div class="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
    <div class="grid gap-12 lg:grid-cols-2 lg:items-center">
      <div class="space-y-6">
        <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          The platform your team will actually use.
        </h1>
        <p class="text-muted-foreground max-w-xl text-lg">
          One workspace for everything your team needs. Built on shadcn-svelte primitives — fast, accessible, easy to
          customise.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <Button size="lg">
            Start free trial
            <ArrowRight class="ml-2 size-4" />
          </Button>
          <!-- The login page has a one-click demo workspace; send people there
               rather than to a video that doesn't exist. -->
          <Button size="lg" variant="outline">
            {#snippet child({ props })}
              <a href="/login" {...props}>
                <PlayCircle class="mr-2 size-4" />
                Try the live demo
              </a>
            {/snippet}
          </Button>
        </div>
        <div class="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>★★★★★ 4.9 on G2</span>
          <span>14-day free trial</span>
          <span>No credit card required</span>
        </div>
      </div>

      <!-- Floating stats are in-flow stacked cards on mobile (no overlap
           by construction) and absolute accents on lg. The main card's
           lg:mt-32 clears the Active-users float; the Uptime float sits
           bottom-left where the right-aligned main card never reaches. -->
      <div class="relative mx-auto w-full max-w-sm space-y-4 lg:mx-0 lg:max-w-none lg:space-y-0">
        <!-- WHY (Rule7): flat system -- shadow-sm only. Cards sit on
             borders, not elevation. -->
        <Card class="w-full shadow-sm lg:absolute lg:top-0 lg:right-0 lg:w-56 lg:rotate-2">
          <CardContent class="space-y-1 p-4">
            <p class="text-muted-foreground text-xs uppercase">Active users</p>
            <p class="text-2xl font-semibold">1,284</p>
            <p class="text-success text-xs">+8.2% MoM</p>
          </CardContent>
        </Card>
        <Card class="ml-auto w-72 max-w-full shadow-sm lg:mt-32">
          <CardHeader>
            <CardTitle class="text-base">Onboarding queue</CardTitle>
            <CardDescription>3 starting Monday</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex items-center gap-3">
              <Avatar class="size-8">
                <AvatarFallback>LW</AvatarFallback>
              </Avatar>
              <div class="flex-1">
                <p class="text-sm font-medium">Lena Wei</p>
                <p class="text-muted-foreground text-xs">Engineering</p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
            <div class="flex items-center gap-3">
              <Avatar class="size-8">
                <AvatarFallback>JR</AvatarFallback>
              </Avatar>
              <div class="flex-1">
                <p class="text-sm font-medium">Joaquín Reyes</p>
                <p class="text-muted-foreground text-xs">Engineering</p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
            <div class="flex items-center gap-3">
              <Avatar class="size-8">
                <AvatarFallback>PS</AvatarFallback>
              </Avatar>
              <div class="flex-1">
                <p class="text-sm font-medium">Priya Shah</p>
                <p class="text-muted-foreground text-xs">Engineering</p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </CardContent>
        </Card>
        <Card class="w-full shadow-sm lg:absolute lg:bottom-0 lg:-left-2 lg:w-52 lg:-rotate-3">
          <CardContent class="space-y-1 p-4">
            <p class="text-muted-foreground text-xs uppercase">Uptime</p>
            <p class="text-2xl font-semibold">100%</p>
            <p class="text-muted-foreground text-xs">12 cycles, 0 misses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</section>
