import { describe, expect, it } from 'vitest'
import { robotsTxt, siteOrigin, sitemapXml } from './seo'

describe('seo', () => {
  it('prefers the env site URL and strips trailing slashes', () => {
    expect(siteOrigin('https://example.com/', 'http://localhost:5173')).toBe('https://example.com')
    expect(siteOrigin(undefined, 'http://localhost:5173')).toBe('http://localhost:5173')
  })

  it('lists only public routes in the sitemap', () => {
    const xml = sitemapXml('https://example.com')
    expect(xml).toContain('<loc>https://example.com/pricing</loc>')
    expect(xml).not.toMatch(/dashboard|settings|feedback|support|admin/)
  })

  it('points robots.txt at the sitemap', () => {
    expect(robotsTxt('https://example.com')).toContain('Sitemap: https://example.com/sitemap.xml')
  })
})
