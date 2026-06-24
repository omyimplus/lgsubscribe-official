import { getPublicSiteUrl } from '~~/server/utils/siteUrl'

export default defineEventHandler((event) => {
  const siteUrl = getPublicSiteUrl(event)

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')

  return [
    'User-Agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /auth',
    'Disallow: /account',
    'Disallow: /subscribe/inquiry',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
  ].join('\n')
})
