// Vitest stand-in for SvelteKit's `$app/environment` (vitest.config.ts runs
// without the SvelteKit plugin). `building: false` keeps env.ts on its real
// runtime validation path in tests.
export const building = false
export const browser = false
export const dev = true
export const version = 'test'
