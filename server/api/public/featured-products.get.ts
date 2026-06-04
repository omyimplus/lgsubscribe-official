import { fetchHomeFeaturedStorefrontProducts } from '~~/server/utils/homeFeaturedProducts'

export default defineEventHandler(async () => {
  const supabase = useSupabaseAdmin()
  try {
    return await fetchHomeFeaturedStorefrontProducts(supabase)
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'โหลดสินค้าแนะนำไม่สำเร็จ'
    throw createError({ statusCode: 500, message })
  }
})
