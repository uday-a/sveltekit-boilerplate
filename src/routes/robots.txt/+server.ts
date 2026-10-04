import { env } from '$env/dynamic/public'
import { robotsTxt, siteOrigin } from '$lib/seo'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ url }) =>
  new Response(robotsTxt(siteOrigin(env.PUBLIC_SITE_URL, url.origin)), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
