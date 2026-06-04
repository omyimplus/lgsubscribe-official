import type { Article, ArticleCategory } from '~~/shared/types/article'

/** หมวดที่แสดงบนหน้าแรก (section บทความ) */
export const HOME_ARTICLES_CATEGORY: ArticleCategory = 'knowledge'

export const HOME_ARTICLES_LIMIT = 4

/** คอลัมน์ `articles.is_featured` — ติ๊กในหลังบ้านว่า «แสดงบนหน้าแรก» */
export const HOME_ARTICLE_FEATURE_LABEL = 'แสดงบนหน้าแรก'

export const ARTICLE_CATEGORIES: { slug: ArticleCategory, label: string }[] = [
  { slug: 'why-subscribe', label: 'ทำไมต้อง LG Subscribe?' },
  { slug: 'how-to-order', label: 'วิธีสั่งซื้อสินค้า LG Subscribe' },
  { slug: 'knowledge', label: 'สาระน่ารู้ LG Subscribe' },
]

export const ARTICLE_CATEGORY_SLUGS = ARTICLE_CATEGORIES.map(c => c.slug)

export function isArticleCategorySlug(value: string): value is ArticleCategory {
  return (ARTICLE_CATEGORY_SLUGS as string[]).includes(value)
}

export function articleCategoryPath(slug: ArticleCategory) {
  return `/articles/${slug}`
}

/** เมนู dropdown บทความใน header */
export const ARTICLE_SECTION_NAV = [
  ...ARTICLE_CATEGORIES.map(c => ({
    label: c.label,
    to: articleCategoryPath(c.slug),
    kind: 'article' as const,
  })),
  { label: 'FAQ — ถามตอบ', to: '/faq', kind: 'faq' as const },
]

export function isArticlesSectionPath(path: string) {
  if (path === '/faq' || path.startsWith('/faq/')) return true
  if (path === '/articles') return true
  if (!path.startsWith('/articles/')) return false
  const segment = path.slice('/articles/'.length).split('/')[0] ?? ''
  if (!segment) return true
  if (isArticleCategorySlug(segment)) return true
  return false
}

export function isArticlesMenuActive(path: string) {
  return isArticlesSectionPath(path)
}

export function articleCategoryLabel(slug: ArticleCategory | string | null | undefined) {
  return ARTICLE_CATEGORIES.find(c => c.slug === slug)?.label ?? slug ?? ''
}

type ArticleVisibility = Pick<Article, 'status' | 'is_active'>

export function isArticlePublic(a: ArticleVisibility) {
  return a.status === 'published' && a.is_active
}

export type ArticlePublicStatus = {
  live: boolean
  reasons: string[]
}

export function getArticlePublicStatus(a: ArticleVisibility): ArticlePublicStatus {
  const reasons: string[] = []
  if (a.status !== 'published') reasons.push('สถานะเป็นแบบร่าง')
  if (!a.is_active) reasons.push('ปิดใช้งาน')
  return { live: isArticlePublic(a), reasons }
}

export function articleCoverSrc(
  imageUrl: string | null | undefined,
  version?: string | null,
) {
  const url = imageUrl?.trim()
  if (!url) return ''
  const v = version ? new Date(version).getTime() : Date.now()
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${v}`
}
