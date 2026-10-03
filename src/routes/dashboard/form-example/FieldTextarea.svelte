<script lang="ts">
  import { untrack } from 'svelte'
  import { Textarea } from '$lib/components/ui/textarea'
  import type { FieldApi } from '$lib/components/ui/form'

  // TanStack-bound textarea bridge (route-local). The registry Textarea
  // hardwires oninput/onblur to internal handlers with no change callback,
  // so `componentField` spread can't reach the form — this wrapper bridges
  // a bindable local mirror into field.handleChange instead.

  interface Props {
    field: FieldApi
    rows?: number
  }

  let { field, rows = 3 }: Props = $props()

  let local = $state('')

  // Pull: seed from the field's initial value and follow external resets.
  $effect(() => {
    const v = typeof field.state.value === 'string' ? field.state.value : ''
    if (v !== local) local = v
  })

  // Push edits into TanStack (mount is a no-op via the equality guard).
  $effect(() => {
    const v = local
    untrack(() => {
      if (field.state.value !== v) field.handleChange(v)
    })
  })
</script>

<Textarea name={field.name} bind:value={local} {rows} />
