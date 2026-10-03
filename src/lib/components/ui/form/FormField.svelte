<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { TanstackFormApi } from './context'
  import type { FormFieldBinding } from './FormFieldInner.svelte'

  export interface FormFieldProps {
    form?: TanstackFormApi
    name: string
    validators?: Record<string, unknown>
    children?: Snippet<[FormFieldBinding]>
  }
</script>

<script lang="ts">
  import { getContext } from 'svelte'
  import FormFieldInner from './FormFieldInner.svelte'
  import { FORM_INSTANCE_CONTEXT_KEY } from './context'

  // Renamed (not `children`): the `{#snippet children}` blocks below shadow
  // a prop of the same name, so `{@render children}` would self-render
  // instead of rendering the caller's snippet.
  let { form, name, validators, children: childrenProp }: FormFieldProps = $props()

  const injected = getContext<TanstackFormApi | undefined>(FORM_INSTANCE_CONTEXT_KEY)

  const resolvedForm = $derived.by(() => {
    const f = form ?? injected
    if (!f) throw new Error('<FormField> requires a `form` prop or to be nested inside <Form form={...}>')
    return f
  })

  const Field = $derived(resolvedForm.Field)
</script>

<Field {name} {validators}>
  {#snippet children(field: any)}
    <FormFieldInner {field}>
      {#snippet children(binding)}
        {@render childrenProp?.(binding)}
      {/snippet}
    </FormFieldInner>
  {/snippet}
</Field>
