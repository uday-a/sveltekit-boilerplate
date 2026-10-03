<script lang="ts">
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { getInitials } from '$lib/composables/useKanban'
  import { cn } from '$lib/utils'

  interface UserAvatarProps {
    name: string
    color: string
    size?: 'xs' | 'sm' | 'md'
    class?: string
  }

  let { name, color, size = 'sm', class: className }: UserAvatarProps = $props()

  const sizeMap = {
    xs: { avatar: 'size-6', text: 'text-xs' },
    sm: { avatar: 'size-7', text: 'text-xs' },
    md: { avatar: 'size-8', text: 'text-xs' },
  }
</script>

<Avatar data-slot="kanban-board" class={cn(sizeMap[size].avatar, 'shrink-0', className)}>
  <AvatarFallback class={[sizeMap[size].text, 'font-semibold', color]}>
    {getInitials(name)}
  </AvatarFallback>
</Avatar>
