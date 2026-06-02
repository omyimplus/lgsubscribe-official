import { getImportableLgSubscriptionSources } from '~~/server/utils/lgSubscriptionSources'

export default defineEventHandler(() => {
  const sources = getImportableLgSubscriptionSources().map(s => ({
    lgSlug: s.lgSlug,
    label: s.label,
    categorySlug: s.categorySlug,
    listUrl: s.listUrl,
    variantAxis: s.variantAxis,
  }))
  return { sources }
})
