<script lang="ts" module>
  import type { CatalogCategory, CatalogStatus } from '$lib/data/ui-catalog/catalog'

  export interface FinderFilters {
    q: string
    category: CatalogCategory | 'all'
    status: CatalogStatus | 'all'
  }
</script>

<script lang="ts">
  import { Search } from '@lucide/svelte'
  import { Input } from '$lib/components/ui/input'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'
  import { CATALOG_CATEGORIES, categoryKey } from '$lib/data/ui-catalog/catalog'
  import { t } from '$lib/i18n'

  let {
    q,
    category,
    status,
    count,
    onChange,
  }: FinderFilters & { count: number, onChange: (patch: Partial<FinderFilters>) => void } = $props()

  // Type into a local draft; push to the URL once typing pauses.
  let draft = $derived(q)
  let timer: ReturnType<typeof setTimeout> | undefined
  function onInput(value: string) {
    draft = value
    clearTimeout(timer)
    timer = setTimeout(() => onChange({ q: value.trim() }), 200)
  }

  const statusOptions: { value: CatalogStatus | 'all', key: string }[] = [
    { value: 'all', key: 'all' },
    { value: 'installed', key: 'installed' },
    { value: 'available', key: 'available' },
    { value: 'demo-only', key: 'demoOnly' },
  ]
</script>

<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
  <div class="min-w-0 flex-1">
    <Input
      value={draft}
      onValueChange={onInput}
      type="search"
      prefixIcon={Search}
      placeholder={$t('uiKit.toolbar.searchPlaceholder')}
      aria-label={$t('uiKit.toolbar.searchLabel')}
      allowClear
    />
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <Select value={category} onValueChange={v => onChange({ category: v as CatalogCategory | 'all' })}>
      <SelectTrigger class="w-full sm:w-48" aria-label={$t('uiKit.toolbar.category')}>
        <!-- Explicit label: a closed Select doesn't know its items' text yet. -->
        <SelectValue>{$t(`uiKit.category.${categoryKey(category)}`)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{$t('uiKit.category.all')}</SelectItem>
        {#each CATALOG_CATEGORIES as c (c)}
          <SelectItem value={c}>{$t(`uiKit.category.${categoryKey(c)}`)}</SelectItem>
        {/each}
      </SelectContent>
    </Select>
    <!-- Function binding: clicking the pressed item emits ''; ignore it so one stays selected. -->
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      bind:value={() => status, v => v && onChange({ status: v as CatalogStatus | 'all' })}
      aria-label={$t('uiKit.toolbar.status')}
    >
      {#each statusOptions as opt (opt.value)}
        <ToggleGroupItem value={opt.value} class="px-3 text-xs">{$t(`uiKit.status.${opt.key}`)}</ToggleGroupItem>
      {/each}
    </ToggleGroup>
    <p class="text-muted-foreground text-xs tabular-nums" aria-live="polite">
      {$t('uiKit.toolbar.results', { count })}
    </p>
  </div>
</div>
