<script lang="ts">
  import { Avatar, AvatarFallback, AvatarGroup } from '$lib/components/ui/avatar'

  const people = ['Emma Wilson', 'Liam Carter', 'Olivia Brooks', 'Noah Bennett']
  const initials = (name: string) => name.split(' ').map(p => p[0]).join('')
</script>

<div class="flex flex-wrap items-center gap-4">
  <div class="flex items-center gap-2">
    <Avatar class="size-10">
      <AvatarFallback>EW</AvatarFallback>
    </Avatar>
    <div>
      <p class="text-sm font-medium">Emma Wilson</p>
      <p class="text-muted-foreground text-xs">emma.wilson@example.com</p>
    </div>
  </div>
  <AvatarGroup>
    {#each people as p (p)}
      <Avatar>
        <AvatarFallback>{initials(p)}</AvatarFallback>
      </Avatar>
    {/each}
  </AvatarGroup>
</div>
