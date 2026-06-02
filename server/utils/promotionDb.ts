import { isPromotionLive } from '~~/shared/utils/promotionDisplay'

export { isPromotionLive }

export function mapPromotionRow<T extends Record<string, unknown>>(row: T) {
  return row as T & Promotion
}
