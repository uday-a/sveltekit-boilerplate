<script lang="ts">
  import { Check, ChevronDown, Globe } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { locale, locales, setLocale, t } from '$lib/i18n'

  // Header control: switch UI language. setLocale() persists the choice in
  // the `uipkge-locale` cookie, so it survives reloads (same mechanism as
  // Settings → Forms). Port of Nuxt `LocaleSwitcher.vue`.
  const current = $derived(locales.find(o => o.code === $locale)?.name ?? $locale)
</script>

<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="sm"
        class="text-muted-foreground hover:text-foreground h-8 max-w-40 gap-1.5 px-2.5 text-xs font-medium"
        aria-label={$t('header.language.label')}
        title={$t('header.language.label')}
      >
        <Globe class="size-3.5 shrink-0" aria-hidden="true" />
        <span class="truncate">{current}</span>
        <ChevronDown class="size-3 shrink-0" aria-hidden="true" />
      </Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" class="w-40">
    <DropdownMenuLabel class="text-muted-foreground text-xs font-medium">
      {$t('header.language.label')}
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    {#each locales as o (o.code)}
      <DropdownMenuItem onSelect={() => setLocale(o.code)}>
        {o.name}
        {#if o.code === $locale}
          <Check class="ml-auto size-4" aria-hidden="true" />
        {/if}
      </DropdownMenuItem>
    {/each}
  </DropdownMenuContent>
</DropdownMenu>
