import { getPublicSiteUrl } from '~~/server/utils/siteUrl'
import { SITE_PUBLIC_ROUTES } from '~~/shared/utils/siteSeo'
import { SUBSCRIBE_TERMS_DOCS } from '~~/shared/utils/subscribeTermsContent'

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function urlEntry(loc: string, lastmod?: string): string {
  const lastmodTag = lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : ''
  return `<url><loc>${xmlEscape(loc)}</loc>${lastmodTag}</url>`
}

export default defineEventHandler(async (event) => {
  const siteUrl = getPublicSiteUrl(event)
  const today = new Date().toISOString().slice(0, 10)
  const urls: string[] = SITE_PUBLIC_ROUTES.map(path => urlEntry(`${siteUrl}${path}`, today))

  for (const doc of SUBSCRIBE_TERMS_DOCS) {
    urls.push(urlEntry(`${siteUrl}/installment/${doc.slug}`, today))
  }

  try {
    const supabase = useSupabaseAdmin()

    const [{ data: products }, { data: articles }, { data: promotions }, { data: experiences }] = await Promise.all([
      supabase
        .from('products')
        .select('id, updated_at')
        .eq('status', 'published')
        .eq('is_active', true),
      supabase
        .from('articles')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .eq('is_active', true),
      supabase
        .from('promotions')
        .select('slug, updated_at')
        .eq('status', 'published')
        .eq('is_active', true),
      supabase
        .from('customer_experiences')
        .select('id, updated_at')
        .eq('is_active', true),
    ])

    for (const row of products ?? []) {
      const lastmod = (row.updated_at as string | null)?.slice(0, 10) || today
      urls.push(urlEntry(`${siteUrl}/products/${row.id}`, lastmod))
    }
    for (const row of articles ?? []) {
      const lastmod = (row.updated_at as string | null)?.slice(0, 10)
        || (row.published_at as string | null)?.slice(0, 10)
        || today
      urls.push(urlEntry(`${siteUrl}/articles/${row.slug}`, lastmod))
    }
    for (const row of promotions ?? []) {
      const lastmod = (row.updated_at as string | null)?.slice(0, 10) || today
      urls.push(urlEntry(`${siteUrl}/promotions/${row.slug}`, lastmod))
    }
    for (const row of experiences ?? []) {
      const lastmod = (row.updated_at as string | null)?.slice(0, 10) || today
      urls.push(urlEntry(`${siteUrl}/experiences/${row.id}`, lastmod))
    }
  }
  catch {
    // ยังคืน sitemap หน้าคงที่ได้แม้ DB ล้มเหลว
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=3600')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    + urls.join('')
    + `</urlset>`

  if (event.method === 'HEAD') {
    return null
  }

  return xml
})
