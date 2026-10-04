<script lang="ts">
  import { Check, Copy } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { t } from '$lib/i18n'

  let { command }: { command: string } = $props()

  let copied = $state(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
    } catch {
      return
    }
    copied = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied = false), 1500)
  }
</script>

<div class="bg-muted flex items-center gap-2 rounded-md py-1 pr-1 pl-3">
  <code class="text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs">{command}</code>
  <Button
    variant="ghost"
    size="icon-sm"
    class="shrink-0"
    aria-label={copied ? $t('uiKit.card.copied') : $t('uiKit.card.copy')}
    onclick={copy}
  >
    {#if copied}
      <Check class="text-success size-4" aria-hidden="true" />
    {:else}
      <Copy class="size-4" aria-hidden="true" />
    {/if}
  </Button>
  <span class="sr-only" aria-live="polite">{copied ? $t('uiKit.card.copied') : ''}</span>
</div>
