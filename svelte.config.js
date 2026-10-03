import nodeAdapter from '@sveltejs/adapter-node'
import vercelAdapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Vercel sets VERCEL=1 during its build, so the same repo deploys there
// unchanged while a plain `npm run build` still emits a self-hostable
// `node build` server.
/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: process.env.VERCEL
      ? vercelAdapter({ runtime: 'nodejs22.x' })
      : nodeAdapter()
  }
}

export default config
