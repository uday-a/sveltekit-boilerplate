<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export interface PageHeaderHeadingProps extends HTMLAttributes<HTMLDivElement> {
    title: string
    description?: string
    ref?: HTMLDivElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let { class: className, title, description, ref = $bindable(null), ...restProps }: PageHeaderHeadingProps = $props()
</script>

<div bind:this={ref} data-uipkge data-slot="page-header-heading" class={cn('', className)} {...restProps}>
  <h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
  {#if description}
    <p class="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
  {/if}
</div>
