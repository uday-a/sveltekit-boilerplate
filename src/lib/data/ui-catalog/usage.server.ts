// Server-only (the `.server` suffix keeps route sources out of client code):
// feed the app's own sources to the usage scan. Vite inlines the globs at
// build time, so the finder always reflects what the app actually imports.
import { CURATED, CURATED_BLOCKS } from './curated'
import { scanUsage, type UsageData } from './usage'

const routes = import.meta.glob<string>('/src/routes/**/*.svelte', { query: '?raw', import: 'default', eager: true })
const blocks = import.meta.glob<string>('/src/lib/components/blocks/**/*.{svelte,ts}', { query: '?raw', import: 'default', eager: true })

// Installed dirs come from the curated lists; the catalog test keeps those
// in lockstep with src/lib/components/{ui,blocks}.
export const usage: UsageData = scanUsage({
  routes,
  blocks,
  uiDirs: CURATED.map(c => c.name),
  blockDirs: CURATED_BLOCKS.map(c => c.name),
})
