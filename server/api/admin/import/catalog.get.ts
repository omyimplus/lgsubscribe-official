import { runImportCatalogScan } from '~~/server/utils/importCatalogScan'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lgSlug = String(query.lgSlug ?? query.category ?? 'tvs').trim().toLowerCase()
  const supabase = useSupabaseAdmin()
  return runImportCatalogScan(supabase, lgSlug)
})
