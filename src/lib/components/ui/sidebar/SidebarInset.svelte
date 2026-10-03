<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export interface SidebarInsetProps extends HTMLAttributes<HTMLElement> {
    ref?: HTMLElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'

  let { class: className, children, ref = $bindable(null), ...restProps }: SidebarInsetProps = $props()
</script>

<!-- Single-landmark rule: the app shell's <main id="main-content"> inside
     DashboardLayout is the page landmark, so the inset itself is a plain
     wrapper (a <main> here would nest landmarks — same fix as the
     dashboard layout's inner container). -->
<div
  bind:this={ref}
  data-uipkge=""
  data-slot="sidebar-inset"
  class={cn(
    // min-w-0 is load-bearing: a flex-1 child without it inherits min-width: auto,
    // which means any single wide descendant (chart, table, code block) blows the
    // inset's width past its grid track. The upstream shadcn-ui sidebar omits this.
    'bg-background relative flex w-full min-w-0 flex-1 flex-col',
    'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
