import type { FaqItem } from '~~/shared/types/faqItem'

export function mapFaqItemRow<T extends Record<string, unknown>>(row: T) {
  return row as T & FaqItem
}
