import {
  SITE_BUSINESS_HOURS,
  SITE_FACEBOOK_URL,
  SITE_LINE_OA_URL,
  SITE_PHONES,
  SITE_TIKTOK_URL,
} from '~~/shared/utils/siteContact'
import { SITE_DEFAULT_DESCRIPTION, SITE_DEFAULT_OG_IMAGE, SITE_NAME, resolveSiteUrl } from '~~/shared/utils/siteSeo'

export type JsonLd = Record<string, unknown>

export type SchemaPageType = 'WebPage' | 'ContactPage' | 'CollectionPage' | 'AboutPage' | 'FAQPage'

export type BreadcrumbSchemaItem = { name: string, path?: string }

export function organizationId(siteUrl: string) {
  return `${siteUrl}/#organization`
}

export function websiteId(siteUrl: string) {
  return `${siteUrl}/#website`
}

export function webPageId(siteUrl: string, path: string) {
  return `${resolveSiteUrl(path, siteUrl)}#webpage`
}

function siteLogoUrl(siteUrl: string) {
  return resolveSiteUrl('/favicon-512x512.png', siteUrl)
}

function sitePostalAddress() {
  return {
    '@type': 'PostalAddress',
    streetAddress: 'เลขที่ 195 อาคารวัน แบงค็อก ทาวเวอร์ 4 ห้องเลขที่ 2301-2314 ชั้น 23 ถนนวิทยุ',
    addressLocality: 'ลุมพินี',
    addressRegion: 'กรุงเทพมหานคร',
    postalCode: '10330',
    addressCountry: 'TH',
  }
}

function siteOpeningHours() {
  return [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '00:00',
    closes: '23:59',
  }]
}

export function buildOrganizationJsonLd(siteUrl: string): JsonLd {
  return {
    '@type': 'Organization',
    '@id': organizationId(siteUrl),
    name: SITE_NAME,
    alternateName: ['LG Subscribe Official', 'LG Subscription Thailand'],
    url: siteUrl,
    description: SITE_DEFAULT_DESCRIPTION,
    logo: {
      '@type': 'ImageObject',
      url: siteLogoUrl(siteUrl),
    },
    image: siteLogoUrl(siteUrl),
    telephone: SITE_PHONES.map(phone => `+66-${phone.tel.slice(1)}`),
    address: sitePostalAddress(),
    contactPoint: SITE_PHONES.map(phone => ({
      '@type': 'ContactPoint',
      telephone: `+66-${phone.tel.slice(1)}`,
      contactType: 'customer service',
      areaServed: 'TH',
      availableLanguage: ['Thai', 'English'],
      hoursAvailable: siteOpeningHours(),
    })),
    sameAs: [
      SITE_FACEBOOK_URL,
      SITE_TIKTOK_URL,
      SITE_LINE_OA_URL,
    ].filter(Boolean),
  }
}

export function buildWebSiteJsonLd(siteUrl: string): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': websiteId(siteUrl),
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DEFAULT_DESCRIPTION,
    inLanguage: 'th-TH',
    publisher: { '@id': organizationId(siteUrl) },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildServiceJsonLd(siteUrl: string, options: {
  name?: string
  description?: string
  path?: string
  audience?: string
} = {}): JsonLd {
  return {
    '@type': 'Service',
    '@id': `${resolveSiteUrl(options.path ?? '/', siteUrl)}#service`,
    name: options.name ?? 'LG Subscribe',
    description: options.description ?? 'บริการสมัครใช้เครื่องใช้ไฟฟ้า LG แบบรายเดือน ผ่อนสบาย รับประกันครบ บริการดูแลโดยมืออาชีพ',
    provider: { '@id': organizationId(siteUrl) },
    brand: {
      '@type': 'Brand',
      name: 'LG',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Thailand',
    },
    serviceType: 'Home appliance subscription',
    audience: options.audience
      ? { '@type': 'Audience', audienceType: options.audience }
      : undefined,
    url: resolveSiteUrl(options.path ?? '/', siteUrl),
  }
}

export function buildLocalBusinessJsonLd(siteUrl: string): JsonLd {
  return {
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/contact#localbusiness`,
    name: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    url: `${siteUrl}/contact`,
    image: siteLogoUrl(siteUrl),
    telephone: SITE_PHONES.map(phone => `+66-${phone.tel.slice(1)}`),
    address: sitePostalAddress(),
    openingHoursSpecification: siteOpeningHours(),
    parentOrganization: { '@id': organizationId(siteUrl) },
    sameAs: [
      SITE_FACEBOOK_URL,
      SITE_TIKTOK_URL,
      SITE_LINE_OA_URL,
    ].filter(Boolean),
    priceRange: '฿฿',
    areaServed: {
      '@type': 'Country',
      name: 'Thailand',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: `+66-${SITE_PHONES[0]!.tel.slice(1)}`,
      availableLanguage: ['Thai'],
      hoursAvailable: siteOpeningHours(),
      url: SITE_LINE_OA_URL,
    },
    // ข้อความเวลาทำการสำหรับ human-readable fallback
    openingHours: SITE_BUSINESS_HOURS,
  }
}

export function buildWebPageJsonLd(input: {
  siteUrl: string
  path: string
  name: string
  description: string
  pageType?: SchemaPageType
  image?: string | null
}): JsonLd {
  const url = resolveSiteUrl(input.path, input.siteUrl)
  const image = input.image ? resolveSiteUrl(input.image, input.siteUrl) : siteLogoUrl(input.siteUrl)

  return {
    '@type': input.pageType ?? 'WebPage',
    '@id': webPageId(input.siteUrl, input.path),
    url,
    name: input.name,
    description: input.description,
    inLanguage: 'th-TH',
    isPartOf: { '@id': websiteId(input.siteUrl) },
    about: { '@id': organizationId(input.siteUrl) },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: image,
    },
    publisher: { '@id': organizationId(input.siteUrl) },
  }
}

export function buildItemListJsonLd(items: Array<{ name: string, url: string }>): JsonLd {
  return {
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  }
}

export function buildProductJsonLd(input: {
  siteUrl: string
  path: string
  name: string
  description?: string | null
  image?: string | null
  sku?: string | null
  brand?: string
  category?: string | null
  price?: number | null
  currency?: string
}): JsonLd {
  const url = resolveSiteUrl(input.path, input.siteUrl)
  const image = input.image ? resolveSiteUrl(input.image, input.siteUrl) : undefined
  const offers = typeof input.price === 'number' && input.price > 0
    ? {
        '@type': 'Offer',
        priceCurrency: input.currency ?? 'THB',
        price: input.price,
        availability: 'https://schema.org/InStock',
        url,
        seller: { '@id': organizationId(input.siteUrl) },
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: input.price,
          priceCurrency: input.currency ?? 'THB',
          unitText: 'MONTH',
        },
      }
    : undefined

  return {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: input.name,
    description: input.description || input.name,
    sku: input.sku || undefined,
    image,
    brand: {
      '@type': 'Brand',
      name: input.brand ?? 'LG',
    },
    category: input.category || undefined,
    url,
    offers,
  }
}

export function buildArticleJsonLd(input: {
  siteUrl: string
  path: string
  headline: string
  description?: string | null
  image?: string | null
  datePublished?: string | null
  dateModified?: string | null
  section?: string | null
}): JsonLd {
  const url = resolveSiteUrl(input.path, input.siteUrl)
  const image = input.image ? resolveSiteUrl(input.image, input.siteUrl) : undefined

  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: input.headline,
    description: input.description || input.headline,
    image,
    datePublished: input.datePublished || undefined,
    dateModified: input.dateModified || input.datePublished || undefined,
    author: { '@id': organizationId(input.siteUrl) },
    publisher: { '@id': organizationId(input.siteUrl) },
    mainEntityOfPage: { '@id': webPageId(input.siteUrl, input.path) },
    articleSection: input.section || undefined,
    inLanguage: 'th-TH',
  }
}

export function buildBreadcrumbJsonLd(
  siteUrl: string,
  items: BreadcrumbSchemaItem[],
): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path ? resolveSiteUrl(item.path, siteUrl) : undefined,
    })),
  }
}

export function buildFaqPageJsonLd(
  items: Array<{ question: string, answer: string }>,
): JsonLd {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function mergeJsonLd(
  ...blocks: Array<JsonLd | JsonLd[] | undefined | null>
): JsonLd[] {
  const merged: JsonLd[] = []
  for (const block of blocks) {
    if (!block) continue
    if (Array.isArray(block)) merged.push(...block)
    else merged.push(block)
  }
  return merged
}

/** รวมหลาย node เป็น @graph เดียว (หรือ node เดียวถ้ามีแค่อันเดียว) */
export function serializeJsonLdGraph(nodes: JsonLd[]): JsonLd[] {
  const clean = nodes.filter(node => Object.keys(node).length > 0)
  if (!clean.length) return []
  if (clean.length === 1) {
    return [{ '@context': 'https://schema.org', ...clean[0]! }]
  }
  return [{ '@context': 'https://schema.org', '@graph': clean }]
}
