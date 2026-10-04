<script lang="ts">
  import { onMount } from 'svelte'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { Button } from '$lib/components/ui/button'
  import { Skeleton } from '$lib/components/ui/skeleton'

  let loading = $state(true)
  let timer: ReturnType<typeof setTimeout> | undefined

  function replay() {
    loading = true
    clearTimeout(timer)
    timer = setTimeout(() => (loading = false), 2000)
  }

  onMount(() => {
    replay()
    return () => clearTimeout(timer)
  })
</script>

<div class="space-y-4">
  {#if loading}
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <Skeleton class="size-10 rounded-full" />
        <div class="space-y-1">
          <Skeleton class="h-2 w-24" />
          <Skeleton class="h-2 w-32" />
        </div>
      </div>
      <Skeleton class="h-2 w-full" />
      <Skeleton class="h-2 w-3/4" />
    </div>
  {:else}
    <div class="space-y-2 text-sm">
      <div class="flex items-center gap-2">
        <Avatar class="size-10">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <p class="font-medium">John Doe</p>
          <p class="text-muted-foreground text-xs">john.doe@example.com</p>
        </div>
      </div>
      <p class="text-muted-foreground">Content loaded.</p>
    </div>
  {/if}
  <Button variant="outline" size="sm" onclick={replay}>Replay</Button>
</div>
