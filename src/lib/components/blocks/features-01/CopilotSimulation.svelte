<script lang="ts">
  import { Bot, RefreshCw } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'

  let copilotPrompt = $state('Generate quarterly SOC2 compliance audit report with automated PR proof attachments.')
  let copilotExecuting = $state(false)
  let copilotOutput = $state(
    'Audit summary generated. 14 evidence logs compiled across 4 AWS & Cloudflare regions. Zero critical findings.',
  )

  function triggerCopilot() {
    copilotExecuting = true
    copilotOutput = 'Analyzing real-time event bus and compiling cryptographically signed evidence bundle...'
    setTimeout(() => {
      copilotOutput =
        '✓ SOC 2 Type II bundle validated. 142 controls verified at 100% adherence. Ready for auditor download.'
      copilotExecuting = false
    }, 900)
  }
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <label class="text-foreground text-xs font-medium" for="copilot-prompt">Natural Language Workforce Assistant</label>
    <div class="flex gap-2">
      <Input
        id="copilot-prompt"
        bind:value={copilotPrompt}
        class="h-9 text-xs"
        placeholder="Ask copilot to run calculations or compliance checks..."
      />
      <Button
        size="sm"
        class="h-9 shrink-0 gap-1.5 px-4 text-xs font-semibold"
        disabled={copilotExecuting}
        onclick={triggerCopilot}
      >
        {#if copilotExecuting}
          <RefreshCw class="size-3.5 animate-spin" />
        {:else}
          <Bot class="size-3.5" />
        {/if}
        Run
      </Button>
    </div>
  </div>

  <div class="border-border bg-muted/20 space-y-2 rounded-lg border p-4">
    <div class="flex items-center justify-between text-xs">
      <span class="text-muted-foreground font-mono text-xs">Copilot Real-time Synthesis</span>
      <Badge variant="outline" class="font-mono text-xs">Claude 3.5 Sonnet</Badge>
    </div>
    <p class="text-foreground bg-background border-border rounded-md border p-3 font-mono text-xs leading-relaxed">
      {copilotOutput}
    </p>
  </div>
</div>
