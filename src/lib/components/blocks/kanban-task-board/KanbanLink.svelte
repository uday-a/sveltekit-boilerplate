<script lang="ts">
  import type { Snippet } from 'svelte'
  import { getKanbanLinkContext } from './link-context'

  interface KanbanLinkProps {
    href: string
    /** Router-style destination (passed to custom link components; defaults to `href`). */
    to?: string
    class?: string
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  }

  let { href, to, class: className, onclick, children }: KanbanLinkProps = $props()

  const linkCtx = getKanbanLinkContext()
</script>

{#if typeof linkCtx.current === 'string'}
  <a {href} class={className} {onclick}>{@render children?.()}</a>
{:else}
  {@const Link = linkCtx.current}
  <Link {href} to={to ?? href} class={className} {onclick}>{@render children?.()}</Link>
{/if}
