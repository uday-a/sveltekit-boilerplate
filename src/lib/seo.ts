// SEO baseline (port of what @nuxtjs/seo gives the Nuxt reference):
// canonical + og/twitter tags in the root layout, robots.txt and a sitemap
// of the public routes. Authenticated surfaces stay out of the sitemap.

export const SITE_NAME = 'UIPKGE'

export const DEFAULT_DESCRIPTION
  = 'SvelteKit 2 SaaS boilerplate — auth, database, billing, email, analytics, and observability baked in.'

/** Public, indexable routes → page title (also the og:title source). */
export const PUBLIC_ROUTES: Record<string, string> = {
  '/': 'The workspace your team will actually use',
  '/pricing': 'Pricing',
  '/login': 'Sign in',
  '/sign-up': 'Create an account',
  '/forgot-password': 'Sign-in link',
  '/terms': 'Terms of Service',
  '/privacy': 'Privacy Policy',
}

/** Site origin without a trailing slash; env wins, request origin is the fallback. */
export function siteOrigin(envUrl: string | undefined, requestOrigin: string): string {
  return (envUrl || requestOrigin).replace(/\/+$/, '')
}

export function sitemapXml(origin: string): string {
  const urls = Object.keys(PUBLIC_ROUTES)
    .map(path => `  <url><loc>${origin}${path}</loc></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function robotsTxt(origin: string): string {
  return `User-agent: *\nDisallow:\n\nSitemap: ${origin}/sitemap.xml\n`
}
