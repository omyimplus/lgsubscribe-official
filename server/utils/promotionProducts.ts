import type {
  PromotionOfferGift,
  PromotionOfferGiftEnriched,
  PromotionProductOffer,
  PromotionProductOfferEnriched,
  PromotionProductOfferInput,
  PromotionWithProducts,
} from '~~/shared/types/promotion'
import { mapProduct, productSelect } from '~~/server/utils/productDb'
import { mapPromotionRow } from '~~/server/utils/promotionDb'

type PromotionProductRow = {
  id: string
  product_id: string
  sort_order: number
  title_override: string | null
  description: string | null
  has_gift: boolean
  installment_monthly: number | null
  installment_total: number | null
}

type PromotionOfferGiftRow = {
  offer_id: string
  product_id: string
  label: string | null
  sort_order: number
}

function toNumber(value: number | null | undefined) {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function mapGiftRow(row: PromotionOfferGiftRow): PromotionOfferGift {
  return {
    product_id: row.product_id,
    label: row.label,
    sort_order: row.sort_order,
  }
}

function mapOfferRow(row: PromotionProductRow, gifts: PromotionOfferGift[]): PromotionProductOffer {
  return {
    id: row.id,
    product_id: row.product_id,
    sort_order: row.sort_order,
    title_override: row.title_override,
    description: row.description,
    has_gift: Boolean(row.has_gift),
    gift_items: gifts,
    installment_monthly: toNumber(row.installment_monthly),
    installment_total: toNumber(row.installment_total),
  }
}

function offerSelect() {
  return `
    id,
    product_id,
    sort_order,
    title_override,
    description,
    has_gift,
    installment_monthly,
    installment_total
  `
}

export async function fetchPromotionWithProducts(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  promotionId: string,
) {
  const { data: promotionRow, error: promoErr } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', promotionId)
    .maybeSingle()

  if (promoErr) throw promoErr
  if (!promotionRow) return null

  const { data: linkRows, error: linkErr } = await supabase
    .from('promotion_products')
    .select(offerSelect())
    .eq('promotion_id', promotionId)
    .order('sort_order', { ascending: true })

  if (linkErr) throw linkErr

  const offerRows = (linkRows ?? []) as PromotionProductRow[]
  const offerIds = offerRows.map(row => row.id)

  let giftRows: PromotionOfferGiftRow[] = []
  if (offerIds.length) {
    const { data, error: giftErr } = await supabase
      .from('promotion_offer_gifts')
      .select('offer_id, product_id, label, sort_order')
      .in('offer_id', offerIds)
      .order('sort_order', { ascending: true })

    if (giftErr) throw giftErr
    giftRows = (data ?? []) as PromotionOfferGiftRow[]
  }

  const giftsByOfferId = new Map<string, PromotionOfferGift[]>()
  for (const row of giftRows) {
    const list = giftsByOfferId.get(row.offer_id) ?? []
    list.push(mapGiftRow(row))
    giftsByOfferId.set(row.offer_id, list)
  }

  const offers = offerRows.map(row =>
    mapOfferRow(row, giftsByOfferId.get(row.id) ?? []),
  )

  const productIds = [...new Set([
    ...offers.map(o => o.product_id),
    ...offers.flatMap(o => o.gift_items.map(g => g.product_id)),
  ])]

  const productById = new Map<string, ReturnType<typeof mapProduct>>()
  if (productIds.length) {
    const { data: productRows, error: prodErr } = await supabase
      .from('products')
      .select(productSelect)
      .in('id', productIds)

    if (prodErr) throw prodErr

    for (const row of productRows ?? []) {
      const mapped = mapProduct(row)
      productById.set(mapped.id, mapped)
    }
  }

  const enrichedOffers: PromotionProductOfferEnriched[] = offers.map((offer) => {
    const gift_items: PromotionOfferGiftEnriched[] = offer.gift_items.map(gift => ({
      ...gift,
      product: productById.get(gift.product_id),
    }))
    return {
      ...offer,
      product: productById.get(offer.product_id),
      gift_items,
    }
  })

  const products = enrichedOffers
    .map(o => o.product)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  return {
    ...mapPromotionRow(promotionRow as Record<string, unknown>),
    product_ids: offers.map(o => o.product_id),
    offers: enrichedOffers,
    products,
  } satisfies PromotionWithProducts
}

function normalizeOfferInput(offer: PromotionProductOfferInput, index: number) {
  const hasGift = Boolean(offer.has_gift)
  const giftItems = hasGift
    ? (offer.gift_items ?? []).filter(g => g.product_id)
    : []

  return {
    product_id: offer.product_id,
    sort_order: offer.sort_order ?? index,
    title_override: offer.title_override?.trim() || null,
    description: offer.description?.trim() || null,
    has_gift: hasGift,
    installment_monthly: toNumber(offer.installment_monthly),
    installment_total: toNumber(offer.installment_total),
    gift_items: giftItems.map((gift, giftIndex) => ({
      product_id: gift.product_id,
      label: gift.label?.trim() || null,
      sort_order: gift.sort_order ?? giftIndex,
    })),
  }
}

export async function syncPromotionProducts(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  promotionId: string,
  productIds: string[],
) {
  const offers: PromotionProductOfferInput[] = productIds.map((product_id, index) => ({
    product_id,
    sort_order: index,
    title_override: null,
    description: null,
    has_gift: false,
    gift_items: [],
    installment_monthly: null,
    installment_total: null,
  }))
  await syncPromotionOffers(supabase, promotionId, offers)
}

export async function syncPromotionOffers(
  supabase: ReturnType<typeof useSupabaseAdmin>,
  promotionId: string,
  offers: PromotionProductOfferInput[],
) {
  const { error: deleteErr } = await supabase
    .from('promotion_products')
    .delete()
    .eq('promotion_id', promotionId)

  if (deleteErr) throw deleteErr
  if (!offers.length) return

  const normalized = offers
    .filter(o => o.product_id)
    .map((offer, index) => normalizeOfferInput(offer, index))

  const { data: insertedOffers, error: insertErr } = await supabase
    .from('promotion_products')
    .insert(normalized.map(({ gift_items, ...row }) => ({
      promotion_id: promotionId,
      ...row,
    })))
    .select('id')

  if (insertErr) throw insertErr

  const giftRows = (insertedOffers ?? []).flatMap((inserted, index) => {
    const gifts = normalized[index]?.gift_items ?? []
    return gifts.map(gift => ({
      offer_id: inserted.id as string,
      product_id: gift.product_id,
      label: gift.label,
      sort_order: gift.sort_order,
    }))
  })

  if (giftRows.length) {
    const { error: giftErr } = await supabase.from('promotion_offer_gifts').insert(giftRows)
    if (giftErr) throw giftErr
  }
}
