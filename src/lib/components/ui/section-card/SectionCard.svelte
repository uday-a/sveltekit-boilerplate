<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'

  export interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
    contentClass?: string
    /** Trailing header content (icon buttons, badges, switches). */
    headerAction?: Snippet
    /** Full-width footer below the content (save/cancel actions). */
    footer?: Snippet
    children?: Snippet
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'
  import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'

  let {
    class: className,
    title,
    description,
    contentClass,
    headerAction,
    footer,
    children,
    ...restProps
  }: SectionCardProps = $props()
</script>

<Card class={cn('flex flex-col', className)} {...restProps}>
  <CardHeader class="pb-4">
    <CardTitle class="text-base font-semibold">{title}</CardTitle>
    {#if description}
      <CardDescription>{description}</CardDescription>
    {/if}
    {#if headerAction}
      <CardAction>{@render headerAction()}</CardAction>
    {/if}
  </CardHeader>
  <CardContent class={cn('flex-1', contentClass)}>
    {@render children?.()}
  </CardContent>
  {@render footer?.()}
</Card>
