import { env } from '$env/dynamic/public'
import { siteOrigin, sitemapXml } from '$lib/seo'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ url }) =>
  new Response(sitemapXml(siteOrigin(env.PUBLIC_SITE_URL, url.origin)), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
