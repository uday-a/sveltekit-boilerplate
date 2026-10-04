<script lang="ts">
  import { z } from 'zod'
  import { createForm } from '@tanstack/svelte-form'
  import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from '$lib/components/ui/form'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Button } from '$lib/components/ui/button'
  import { Page, PageHeader, PageHeaderHeading, PageBody } from '$lib/components/ui/page'
  import { page } from '$app/state'
  import { routeLabel } from '$lib/breadcrumb-labels'
  import { t } from '$lib/i18n'
  import FieldTextarea from './FieldTextarea.svelte'

  const title = $derived(routeLabel(page.url.pathname, $t))

  // Port of nuxt `app/pages/dashboard/form-example.vue`.
  //
  // Form library decision: nuxt uses @tanstack/vue-form; the Svelte
  // equivalent is @tanstack/svelte-form (NOT sveltekit-superforms) — it is
  // what the registry's <Form>/<FormField> components are built against
  // (see components/ui/form/context.ts TanstackFormApi), so the validated
  // pattern stays identical across frameworks. Added to package.json by
  // the dashboard worker.
  //
  // Canonical form pattern: zod schema defines shape + validation, TanStack
  // Form drives state, and the registry's <FormField> wires error messages
  // into <FormMessage>. zod 4 implements Standard Schema, so the schema
  // plugs straight into TanStack's `validators` slot without an adapter.
  //
  // Wiring note: the registry Input/Textarea hardwire oninput/onblur to
  // internal handlers (explicit attrs after their rest spread), so the
  // `componentField` spread documented on FormFieldInner can't reach the
  // form for THESE controls (it targets native inputs). Fields below wire
  // `field.handleChange` manually per that same docblock — Input via its
  // onValueChange callback, Textarea via the FieldTextarea bridge.

  const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Enter a valid email'),
    bio: z.string().max(280, 'Bio must be 280 characters or fewer'),
  })

  let submitted = $state<z.infer<typeof profileSchema> | null>(null)

  const form = createForm(() => ({
    defaultValues: {
      name: '',
      email: '',
      bio: '',
    },
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit({ value }) {
      submitted = value
    },
  }))
</script>

<svelte:head>
  <title>{title} | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading {title} description="A profile form that checks every field before it saves." />
  </PageHeader>

  <PageBody class="max-w-3xl space-y-4">

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Profile</CardTitle>
        <CardDescription>Validates on submit. Edit and click Save.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {form} class="space-y-4">
          <FormField name="name">
            {#snippet children({ field })}
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  {#snippet children(props)}
                    <Input
                      name={field.name}
                      value={(field.state.value as string) ?? ''}
                      onValueChange={(v) => field.handleChange(v)}
                      id={props.id}
                      aria-invalid={props['aria-invalid']}
                      aria-describedby={props['aria-describedby']}
                    />
                  {/snippet}
                </FormControl>
                <FormDescription>Shown to other workspace members.</FormDescription>
                <FormMessage />
              </FormItem>
            {/snippet}
          </FormField>

          <FormField name="email">
            {#snippet children({ field })}
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  {#snippet children(props)}
                    <Input
                      name={field.name}
                      value={(field.state.value as string) ?? ''}
                      onValueChange={(v) => field.handleChange(v)}
                      id={props.id}
                      aria-invalid={props['aria-invalid']}
                      aria-describedby={props['aria-describedby']}
                      type="email"
                    />
                  {/snippet}
                </FormControl>
                <FormMessage />
              </FormItem>
            {/snippet}
          </FormField>

          <FormField name="bio">
            {#snippet children({ field })}
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FieldTextarea {field} rows={3} />
                <FormDescription>280 characters max.</FormDescription>
                <FormMessage />
              </FormItem>
            {/snippet}
          </FormField>

          <div class="flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </Form>
      </CardContent>
    </Card>

    {#if submitted}
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Saved profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt class="text-muted-foreground">Name</dt>
            <dd>{submitted.name}</dd>
            <dt class="text-muted-foreground">Email</dt>
            <dd>{submitted.email}</dd>
            <dt class="text-muted-foreground">Bio</dt>
            <dd>{submitted.bio || '—'}</dd>
          </dl>
        </CardContent>
      </Card>
    {/if}
  </PageBody>
</Page>
