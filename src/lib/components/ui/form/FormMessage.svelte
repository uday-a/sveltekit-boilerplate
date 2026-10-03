<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements'

  export interface FormMessageProps extends HTMLAttributes<HTMLParagraphElement> {
    ref?: HTMLParagraphElement | null
  }
</script>

<script lang="ts">
  import { cn } from '$lib/utils'
  import { useFormField } from './useFormField'

  // `children` is destructured out (not spread onto the <p>) but this
  // message always renders the field error — callers use <FormMessage />
  // self-closed. Kept in the destructure so a stray child never lands in
  // restProps and becomes an invalid DOM attribute.
  let { class: className, children: _children, ref = $bindable(null), ...restProps }: FormMessageProps = $props()

  const { error, formMessageId } = useFormField()
</script>

{#if error()}
  <p
    bind:this={ref}
    id={formMessageId()}
    data-uipkge
    data-slot="form-message"
    role="alert"
    class={cn('text-destructive text-sm', className)}
    {...restProps}
  >
    {error()}
  </p>
{/if}
