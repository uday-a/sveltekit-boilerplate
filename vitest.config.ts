import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,js}'],
    // $lib/server/env.ts fail-fasts at import when SESSION_PASSWORD is
    // missing/short — provide a test-only secret so server-module unit
    // tests can import. (Real boot still fail-fasts; this never ships.)
    env: {
      SESSION_PASSWORD: 'vitest-test-session-password-min-32-chars-0123456789',
    },
  },
  resolve: {
    alias: {
      $lib: resolve(__dirname, './src/lib')
    }
  }
})
