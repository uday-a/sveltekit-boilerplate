// Drift guard for the /dashboard/ui-kit finder. Adding a component under
// src/lib/components/{ui,blocks} without cataloguing it must fail here,
// naming it, so the finder never silently falls behind what the app ships.
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildCatalog, demoNameFor, searchCatalog, type SnapshotItem } from './catalog'
import { CURATED, CURATED_BLOCKS } from './curated'
import snapshot from './registry.snapshot.json'
import { routeKey } from './usage'
import { usage } from './usage.server'

const ROOT = resolve(__dirname, '../../../..')
const dirsIn = (rel: string) => readdirSync(join(ROOT, rel), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort()
const items = snapshot.items as SnapshotItem[]
const entries = buildCatalog({ snapshot: items, curated: CURATED, curatedBlocks: CURATED_BLOCKS, usage })

describe('ui catalog drift guard', () => {
  const uiDirs = dirsIn('src/lib/components/ui')
  const blockDirs = dirsIn('src/lib/components/blocks')

  it('has exactly one curated entry per installed ui component', () => {
    expect(CURATED.map(c => c.name).sort(), 'sync src/lib/data/ui-catalog/curated.ts with src/lib/components/ui').toEqual(uiDirs)
  })

  it('has exactly one curated entry per local block', () => {
    expect(CURATED_BLOCKS.map(c => c.name).sort(), 'sync CURATED_BLOCKS with src/lib/components/blocks').toEqual(blockDirs)
  })

  it('has a demo for every installed ui component', () => {
    const missing = uiDirs
      .map(d => `src/lib/components/ui-kit/demos/${demoNameFor(d)}.svelte`)
      .filter(f => !existsSync(join(ROOT, f)))
    expect(missing, `create these demos: ${missing.join(', ')}`).toEqual([])
  })

  it('only curates ui names that exist in the registry snapshot', () => {
    const registry = new Set(items.filter(i => i.type === 'registry:ui').map(i => i.name))
    const unknown = CURATED.map(c => c.name).filter(n => !registry.has(n))
    expect(unknown, `not in registry.snapshot.json: ${unknown.join(', ')}`).toEqual([])
  })
})

describe('ui catalog usage scan', () => {
  it('maps route files to route keys', () => {
    expect(routeKey('/src/routes/+page.svelte')).toBe('/')
    expect(routeKey('/src/routes/dashboard/kanban/+page.svelte')).toBe('/dashboard/kanban')
    expect(routeKey('/src/routes/dashboard/+layout.svelte')).toBe('layout:dashboard')
    expect(routeKey('/src/routes/+layout.svelte')).toBe('app:root')
    expect(routeKey('/src/routes/+error.svelte')).toBe('app:error')
    expect(routeKey('/src/routes/(marketing)/pricing/+page.svelte')).toBe('/pricing')
  })

  it('derives usage from imports, not hand lists', () => {
    // Button is on nearly every page; a scan that finds only a handful is broken.
    expect(usage.ui.button!.length).toBeGreaterThanOrEqual(20)
    // Blocks follow up to the pages that render them.
    expect(usage.blocks['stat-tile']).toContain('/dashboard')
    // ui used inside a block counts for the routes rendering the block.
    expect(usage.ui.sidebar).toContain('layout:dashboard')
  })

  it('marks installed-but-unused components as demo-only, and the rest as available', () => {
    const byName = new Map(entries.filter(e => e.kind === 'ui').map(e => [e.name, e]))
    for (const [name, routes] of Object.entries(usage.ui)) {
      expect(byName.get(name)!.status, name).toBe(routes.length ? 'installed' : 'demo-only')
    }
    const notInstalled = entries.filter(e => e.kind === 'ui' && !(e.name in usage.ui))
    expect(notInstalled.length).toBeGreaterThan(100)
    expect(notInstalled.every(e => e.status === 'available')).toBe(true)
  })

  it('lists a registry ui item installed as a local block only once', () => {
    expect(entries.filter(e => e.name === 'tour').map(e => e.kind)).toEqual(['block'])
  })

  it('gives every entry a svelte install command, except local-only blocks', () => {
    for (const e of entries) {
      if (e.kind === 'ui') expect(e.installCmd).toBe(`npx shadcn-svelte@latest add @uipkge/${e.name}`)
    }
    expect(entries.find(e => e.name === 'stat-tile')!.installCmd).toBeNull()
  })
})

describe('ui catalog search', () => {
  const top = (q: string, n = 3) => searchCatalog(entries, { q }).slice(0, n).map(e => e.name)

  it('finds components by use case, not only by name', () => {
    expect(top('date range', 1)).toEqual(['range-calendar'])
    expect(top('confirm delete')).toContain('dialog')
    expect(top('upload')).toContain('file-upload')
    expect(top('otp')).toContain('pin-input')
  })

  it('ranks a name match above a description match', () => {
    expect(top('button', 1)).toEqual(['button'])
  })

  it('ranks installed components above available ones at equal relevance', () => {
    const names = searchCatalog(entries, { q: 'calendar' }).map(e => e.name)
    expect(names[0]).toBe('calendar')
    expect(names.indexOf('range-calendar')).toBeLessThan(names.indexOf('event-calendar'))
  })

  it('filters by status and category', () => {
    const available = searchCatalog(entries, { status: 'available' })
    expect(available.length).toBeGreaterThan(0)
    expect(available.every(e => e.status === 'available')).toBe(true)
    const blocks = searchCatalog(entries, { category: 'blocks' })
    expect(blocks.length).toBe(CURATED_BLOCKS.length)
    expect(blocks.every(e => e.kind === 'block')).toBe(true)
  })

  it('returns nothing for gibberish', () => {
    expect(searchCatalog(entries, { q: 'zzqqxx' })).toEqual([])
  })
})
