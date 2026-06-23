import type { MaybeRefOrGetter } from 'vue'
import type { SiteSeoPreset } from '~~/shared/utils/siteSeoPresets'
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_OG_IMAGE,
  SITE_NAME,
  formatSiteTitle,
  joinKeywords,
  resolveSiteUrl,
} from '~~/shared/utils/siteSeo'
import type { BreadcrumbSchemaItem, JsonLd, SchemaPageType } from '~~/shared/utils/siteSeoJsonLd'
import { buildBreadcrumbJsonLd, buildWebPageJsonLd, serializeJsonLdGraph } from '~~/shared/utils/siteSeoJsonLd'

export type SiteSeoOptions = {
  title: MaybeRefOrGetter<string>
  description?: MaybeRefOrGetter<string | undefined>
  keywords?: MaybeRefOrGetter<string | string[] | undefined>
  image?: MaybeRefOrGetter<string | undefined>
  imageAlt?: MaybeRefOrGetter<string | undefined>
  type?: 'website' | 'article' | 'product'
  noindex?: boolean
  jsonLd?: MaybeRefOrGetter<JsonLd | JsonLd[] | undefined>
  schema?: {
    pageType?: SchemaPageType
    breadcrumbs?: MaybeRefOrGetter<BreadcrumbSchemaItem[] | undefined>
    skipWebPage?: boolean
  }
  article?: {
    publishedTime?: MaybeRefOrGetter<string | undefined>
    modifiedTime?: MaybeRefOrGetter<string | undefined>
    section?: MaybeRefOrGetter<string | undefined>
    tags?: MaybeRefOrGetter<string[] | undefined>
  }
}

export function useSiteUrl() {
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()

  return computed(() => {
    const configured = String(config.public.siteUrl || '').replace(/\/$/, '')
    if (configured) return configured
    if (import.meta.server) return `${requestUrl.protocol}//${requestUrl.host}`
    return typeof window !== 'undefined' ? window.location.origin : ''
  })
}

export function useSiteSeoFromPreset(preset: SiteSeoPreset, overrides: Omit<SiteSeoOptions, 'title' | 'description' | 'keywords' | 'noindex'> & {
  title?: MaybeRefOrGetter<string>
  description?: MaybeRefOrGetter<string | undefined>
  keywords?: MaybeRefOrGetter<string | string[] | undefined>
  noindex?: boolean
} = {}) {
  return useSiteSeo({
    ...overrides,
    title: overrides.title ?? preset.title,
    description: overrides.description ?? preset.description,
    keywords: overrides.keywords ?? preset.keywords,
    noindex: overrides.noindex ?? preset.noindex,
  })
}

export function useSiteSeo(options: SiteSeoOptions) {
  const route = useRoute()
  const config = useRuntimeConfig()
  const siteUrl = useSiteUrl()

  const title = computed(() => formatSiteTitle(toValue(options.title)))
  const description = computed(() => toValue(options.description) || SITE_DEFAULT_DESCRIPTION)
  const keywords = computed(() => {
    const raw = toValue(options.keywords)
    if (!raw) return joinKeywords(SITE_NAME, 'LG ผ่อน', 'LG Subscribe')
    return Array.isArray(raw) ? joinKeywords(raw) : joinKeywords(raw)
  })
  const image = computed(() => resolveSiteUrl(toValue(options.image) || SITE_DEFAULT_OG_IMAGE, siteUrl.value))
  const imageAlt = computed(() => toValue(options.imageAlt) || title.value)
  const pageUrl = computed(() => `${siteUrl.value}${route.path}`)
  const robots = computed(() => (options.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'))

  const schemaScripts = computed(() => {
    if (options.noindex) return []

    const nodes: JsonLd[] = []
    const pageType = options.schema?.pageType ?? 'WebPage'

    if (!options.schema?.skipWebPage && pageType !== 'FAQPage') {
      nodes.push(buildWebPageJsonLd({
        siteUrl: siteUrl.value,
        path: route.path,
        name: title.value,
        description: description.value,
        pageType,
        image: image.value,
      }))
    }

    const crumbs = toValue(options.schema?.breadcrumbs)
    if (crumbs?.length) {
      nodes.push(buildBreadcrumbJsonLd(siteUrl.value, crumbs))
    }

    const extra = toValue(options.jsonLd)
    if (extra) {
      nodes.push(...(Array.isArray(extra) ? extra : [extra]))
    }

    return serializeJsonLdGraph(nodes)
  })

  const articlePublished = computed(() => toValue(options.article?.publishedTime))
  const articleModified = computed(() => toValue(options.article?.modifiedTime))
  const articleSection = computed(() => toValue(options.article?.section))
  const articleTags = computed(() => toValue(options.article?.tags))

  useSeoMeta({
    title,
    description,
    keywords,
    author: SITE_NAME,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogImageAlt: imageAlt,
    ogUrl: pageUrl,
    ogType: options.type ?? 'website',
    ogSiteName: SITE_NAME,
    ogLocale: 'th_TH',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
    twitterImageAlt: imageAlt,
    robots,
    ...(options.type === 'article'
      ? {
          articlePublishedTime: articlePublished,
          articleModifiedTime: articleModified,
          articleAuthor: SITE_NAME,
          articleSection,
          articleTag: articleTags,
        }
      : {}),
  })

  useHead({
    link: () => [{ rel: 'canonical', href: pageUrl.value }],
    meta: () => {
      const tags: Array<Record<string, string>> = [
        { name: 'application-name', content: SITE_NAME },
        { property: 'og:image:secure_url', content: image.value },
      ]
      const verification = String(config.public.googleSiteVerification || '').trim()
      if (verification) {
        tags.push({ name: 'google-site-verification', content: verification })
      }
      return tags
    },
    script: () => schemaScripts.value.map((block, index) => ({
      key: `site-jsonld-${index}`,
      type: 'application/ld+json',
      innerHTML: JSON.stringify(block),
    })),
  })
}
