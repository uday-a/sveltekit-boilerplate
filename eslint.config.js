// @ts-check
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.vercel/**',
      '.svelte-kit/**',
      'build/**',
      'dist/**',
      'drizzle/**',
      'test-results/**',
      'playwright-report/**',
      'blob-report/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    // Let the svelte parser delegate <script lang="ts"> blocks (and .svelte.ts
    // / .svelte.js rune modules) to the TS parser. Without the extra
    // extensions every .svelte.ts file fails with `Parsing error` because the
    // svelte parser falls back to espree for the script content.
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    // The base `no-undef` rule can't see TypeScript type positions, so it
    // false-positives on DOM/SvelteKit types used in Svelte scripts
    // (`EventListener`, the `App.*` namespace). typescript-eslint already
    // disables it for plain .ts for the same reason; for .svelte files
    // svelte-check (tsc) is the undefined-name checker (typecheck gate).
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    rules: {
      'no-undef': 'off'
    }
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/indent': ['error', 2],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Our `svelte-ignore` comments target the Svelte compiler (the
      // typecheck gate's warning surface), which tolerates `: explanation`
      // / `-- explanation` suffixes — but this rule parses every word of
      // the suffix as an extra code AND can't reproduce compiler-only
      // warnings (a11y_*, state_referenced_locally), so it false-positives
      // on every documented suppression. svelte-check stays the authority
      // on whether an ignore is stale.
      'svelte/no-unused-svelte-ignore': 'off',
      // No `paths.base` is configured, so `resolve()` from $app/paths is a
      // pure identity here — and it THROWS on non-absolute hrefs
      // (external URLs, `#` placeholders like AuthMfa's default
      // recoveryHref, relative links), which our dynamic hrefs (sidebar
      // item urls, block href props) legitimately carry. Adopt `resolve()`
      // if/when a base path is configured — not as drive-by churn.
      'svelte/no-navigation-without-resolve': 'off'
    }
  }
)
