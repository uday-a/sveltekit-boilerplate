<script lang="ts">
  import { Check, Monitor, Moon, Palette, RotateCcw, Sun } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { COLOR_THEMES, RADIUS_OPTIONS } from '$lib/color-themes'
  import { colorThemeStore } from '$lib/color-theme.svelte'
  import { themeStore, type Theme } from '$lib/theme.svelte'
  import { t } from '$lib/i18n'
  import { cn } from '$lib/utils'

  // Header "Customize" panel — port of Nuxt `ThemeCustomizer.vue`
  // (itself a port of the uipkge.dev site customiser): primary colour,
  // corner radius and colour mode, with a reset. Icon-pack switching is
  // Nuxt-only (generated icon-pack layer) — skipped here, like the Next twin.
  const MODES = [
    { id: 'light', icon: Sun },
    { id: 'dark', icon: Moon },
    { id: 'system', icon: Monitor },
  ] as const

  function resetAll() {
    colorThemeStore.reset()
    themeStore.set('system' as Theme)
  }

  function optionClass(on: boolean): string {
    return cn(
      'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 rounded-md border text-xs font-medium transition-colors outline-none focus-visible:ring-[3px]',
      on ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border',
    )
  }
</script>

<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-foreground size-8"
        aria-label={$t('header.theme.aria')}
        title={$t('header.theme.aria')}
      >
        <Palette class="size-4" />
      </Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent align="end" class="w-[min(calc(100vw-2rem),22rem)] p-4">
    <div class="mb-4 border-b pb-3">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-sm font-semibold">{$t('header.theme.title')}</span>
        <span class="text-muted-foreground text-xs">{$t('header.theme.saved')}</span>
      </div>
      <div class="text-muted-foreground mt-0.5 truncate text-xs">{$t('header.theme.hint')}</div>
    </div>

    <div class="space-y-4">
      <fieldset>
        <legend class="mb-2 text-xs font-semibold">{$t('header.theme.primary')}</legend>
        <div class="grid grid-cols-3 gap-1.5">
          {#each COLOR_THEMES as c (c.id)}
            <button
              type="button"
              aria-pressed={colorThemeStore.colorTheme === c.id}
              class={cn(optionClass(colorThemeStore.colorTheme === c.id), 'flex items-center gap-2 px-2 py-1.5 text-left', colorThemeStore.colorTheme !== c.id && 'border-transparent')}
              onclick={() => colorThemeStore.setColorTheme(c.id)}
            >
              <span
                class="ring-border/60 relative flex size-3.5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset"
                style={`background: ${c.swatch}`}
              >
                {#if colorThemeStore.colorTheme === c.id}
                  <Check class="size-2.5 text-white" stroke-width={4} aria-hidden="true" />
                {/if}
              </span>
              <span class="truncate">{$t(`header.theme.names.${c.id}`)}</span>
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-2 text-xs font-semibold">{$t('header.theme.radius')}</legend>
        <div class="grid grid-cols-5 gap-1.5">
          {#each RADIUS_OPTIONS as r (r)}
            <button
              type="button"
              aria-pressed={colorThemeStore.radius === r}
              class={cn(optionClass(colorThemeStore.radius === r), 'px-1 py-1.5')}
              onclick={() => colorThemeStore.setRadius(r)}
            >
              {r}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-2 text-xs font-semibold">{$t('header.theme.mode')}</legend>
        <div class="grid grid-cols-3 gap-1.5">
          {#each MODES as m (m.id)}
            {@const ModeIcon = m.icon}
            <button
              type="button"
              aria-pressed={themeStore.current === m.id}
              class={cn(optionClass(themeStore.current === m.id), 'flex items-center justify-center gap-1.5 px-2 py-1.5')}
              onclick={() => themeStore.set(m.id)}
            >
              <ModeIcon class="size-3.5" aria-hidden="true" />
              {$t(`header.theme.modes.${m.id}`)}
            </button>
          {/each}
        </div>
      </fieldset>

      <Button variant="outline" size="sm" class="text-muted-foreground w-full gap-2 text-xs" onclick={resetAll}>
        <RotateCcw class="size-3.5" aria-hidden="true" />
        {$t('header.theme.reset')}
      </Button>
    </div>
  </PopoverContent>
</Popover>
