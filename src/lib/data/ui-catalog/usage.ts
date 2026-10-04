// Usage scan for the /dashboard/ui-kit finder: which routes import which
// ui primitives and blocks. Pure (sources in, map out) so the page's server
// load runs it over an `import.meta.glob` of the sources and the test runs
// it over the same files — no generated JSON to drift.

export interface UsageData {
  /** ui dir -> route keys that render it (directly or through a block). */
  ui: Record<string, string[]>
  /** block dir -> route keys that render it (directly or through another block). */
  blocks: Record<string, string[]>
}

const IMPORT_RE = /\$lib\/components\/(ui|blocks)\/([a-z0-9-]+)/g

function importsOf(source: string) {
  const ui = new Set<string>()
  const blocks = new Set<string>()
  for (const [, kind, name] of source.matchAll(IMPORT_RE)) (kind === 'ui' ? ui : blocks).add(name!)
  return { ui, blocks }
}

/**
 * Route key for a file under src/routes: '/dashboard/kanban',
 * 'layout:dashboard', 'app:root' (root layout), 'app:error' (root error page).
 * Route groups are dropped; dynamic segments stay as written ('/projects/[id]').
 */
export function routeKey(file: string): string {
  const parts = file.replace(/^.*?\/routes\//, '').split('/')
  const base = parts.pop()!
  const dirs = parts.filter(p => !/^\(.*\)$/.test(p))
  const path = `/${dirs.join('/')}`
  if (base.startsWith('+layout')) return dirs.length ? `layout:${dirs.at(-1)}` : 'app:root'
  if (base.startsWith('+error') && !dirs.length) return 'app:error'
  return path
}

export interface ScanInput {
  /** Route .svelte sources keyed by path ('/src/routes/dashboard/+page.svelte'). */
  routes: Record<string, string>
  /** Block sources keyed by path ('/src/lib/components/blocks/stat-tile/StatTile.svelte'). */
  blocks: Record<string, string>
  uiDirs: string[]
  blockDirs: string[]
}

export function scanUsage({ routes, blocks, uiDirs, blockDirs }: ScanInput): UsageData {
  // What each block imports, across all of its files.
  const blockDeps = new Map<string, { ui: Set<string>, blocks: Set<string> }>()
  for (const [file, source] of Object.entries(blocks)) {
    const name = file.match(/\/blocks\/([^/]+)\//)?.[1]
    if (!name) continue
    const deps = blockDeps.get(name) ?? { ui: new Set(), blocks: new Set() }
    const found = importsOf(source)
    found.ui.forEach(u => deps.ui.add(u))
    found.blocks.forEach(b => b !== name && deps.blocks.add(b))
    blockDeps.set(name, deps)
  }

  const ui = new Map(uiDirs.map(d => [d, new Set<string>()]))
  const used = new Map(blockDirs.map(d => [d, new Set<string>()]))

  for (const [file, source] of Object.entries(routes)) {
    const key = routeKey(file)
    const direct = importsOf(source)
    // Follow blocks into the blocks they render.
    const seen = new Set<string>()
    const queue = [...direct.blocks]
    while (queue.length) {
      const b = queue.pop()!
      if (seen.has(b)) continue
      seen.add(b)
      queue.push(...(blockDeps.get(b)?.blocks ?? []))
    }
    const uiNames = new Set(direct.ui)
    for (const b of seen) {
      used.get(b)?.add(key)
      blockDeps.get(b)?.ui.forEach(u => uiNames.add(u))
    }
    for (const u of uiNames) ui.get(u)?.add(key)
  }

  const sorted = (m: Map<string, Set<string>>) =>
    Object.fromEntries([...m].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, [...v].sort()]))
  return { ui: sorted(ui), blocks: sorted(used) }
}
