import { buildOrganizationJsonLd, serializeJsonLdGraph } from '~~/shared/utils/siteSeoJsonLd'

export default defineNuxtPlugin(() => {
  const siteUrl = useSiteUrl()

  useHead({
    script: () => serializeJsonLdGraph([buildOrganizationJsonLd(siteUrl.value)]).map((block, index) => ({
      key: `ld-organization-${index}`,
      type: 'application/ld+json',
      innerHTML: JSON.stringify(block),
    })),
  })
})
