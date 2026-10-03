<script lang="ts">
  import { Send } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { RichTextEditor } from '$lib/components/ui/rich-text-editor'
  import UserAvatar from './UserAvatar.svelte'
  import type { CommentItem } from '$lib/composables/useKanban'

  interface CommentListProps {
    comments: CommentItem[]
    compact?: boolean
    onAdd?: (text: string) => void
  }

  let { comments, compact = false, onAdd }: CommentListProps = $props()

  let newComment = $state('')

  const stripped = $derived(newComment.replace(/<[^>]*>/g, '').trim())

  function submit() {
    if (!stripped) return
    onAdd?.(newComment)
    newComment = ''
  }
</script>

{#if comments.length}
  <div data-slot="kanban-board" class={compact ? 'space-y-3' : 'space-y-4'}>
    {#each comments as comment (comment.id)}
      <div class={compact ? 'flex gap-2.5' : 'flex gap-3'}>
        <UserAvatar name={comment.author} color={comment.authorColor} size={compact ? 'xs' : 'sm'} />
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-2">
            <span class={compact ? 'text-xs font-semibold' : 'text-sm font-semibold'}>
              {compact ? comment.author.split(' ')[0] : comment.author}
            </span>
            <span class="text-muted-foreground text-xs">
              {comment.time}
            </span>
          </div>
          <div
            class={[
              'rich-text-content prose prose-sm dark:prose-invert mt-0.5 max-w-none',
              compact ? 'text-muted-foreground text-xs leading-relaxed' : 'text-muted-foreground text-sm leading-relaxed',
            ]}
          >
            <!-- Renders HTML produced by this block's own RichTextEditor (tiptap). Sanitize (e.g. DOMPurify) before rendering untrusted stored HTML. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html comment.text}
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <p class={compact ? 'text-muted-foreground text-xs' : 'text-muted-foreground text-sm'}>No comments yet.</p>
{/if}

<div class={compact ? 'mt-3 flex gap-2' : 'mt-4 flex gap-3 border-t pt-4'}>
  <div class={compact ? 'mt-1' : 'mt-1.5'}>
    <UserAvatar name="Admin User" color="bg-chart-1/15 text-chart-1" size={compact ? 'xs' : 'sm'} />
  </div>
  <div class="min-w-0 flex-1 space-y-2">
    <RichTextEditor
      bind:value={newComment}
      placeholder="Write a comment..."
      minHeight={compact ? '60px' : '80px'}
      class={compact ? 'text-xs' : 'text-sm'}
    />
    <div class="flex justify-end">
      <Button size="sm" class={compact ? 'h-7 gap-1 text-xs' : 'h-8 gap-1.5 text-xs'} disabled={!stripped} onclick={submit}>
        <Send class="size-3" />
        Comment
      </Button>
    </div>
  </div>
</div>
