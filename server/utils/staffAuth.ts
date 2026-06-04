import type { User } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export type AppRole = 'admin' | 'employee' | 'customer'

export function getUserRole(user: User): AppRole {
  const rawRole = user.user_metadata?.role ?? user.app_metadata?.role
  const role = typeof rawRole === 'string' ? rawRole.trim().toLowerCase() : ''
  if (role === 'admin') return 'admin'
  if (role === 'employee') return 'employee'
  return 'customer'
}

export function isStaffRole(role: AppRole): boolean {
  return role === 'admin' || role === 'employee'
}

/** admin หรือ employee เท่านั้น */
export async function requireStaffUser(event: H3Event): Promise<User> {
  const user = await getAuthUserFromEvent(event)
  const role = getUserRole(user)
  if (!isStaffRole(role)) {
    throw createError({ statusCode: 403, message: 'ไม่มีสิทธิ์เข้าถึงระบบหลังบ้าน' })
  }
  return user
}

/** admin เท่านั้น */
export async function requireAdminUser(event: H3Event): Promise<User> {
  const user = await getAuthUserFromEvent(event)
  if (getUserRole(user) !== 'admin') {
    throw createError({ statusCode: 403, message: 'ต้องเป็นผู้ดูแลระบบ (admin) เท่านั้น' })
  }
  return user
}

const PUBLIC_API_PREFIXES = [
  '/api/public/',
  '/api/auth/',
  '/api/line/',
]

const STAFF_API_PREFIXES = [
  '/api/admin/',
  '/api/products',
  '/api/categories',
  '/api/tags',
  '/api/main-categories',
  '/api/product-groups',
  '/api/promotions',
  '/api/articles',
  '/api/faq-items',
  '/api/customer-experiences',
  '/api/editor/',
]

const ADMIN_ONLY_API_PREFIXES = [
  '/api/admin/users',
  '/api/admin/customers',
]

export function isPublicProductPlansPath(pathname: string, method: string): boolean {
  if (method !== 'GET') return false
  return /^\/api\/products\/[^/]+\/plans\/?$/.test(pathname)
}

export function isPublicApiPath(pathname: string, method = 'GET'): boolean {
  if (isPublicProductPlansPath(pathname, method)) return true
  return PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export function isStaffApiPath(pathname: string): boolean {
  return STAFF_API_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export function isAdminOnlyApiPath(pathname: string): boolean {
  return ADMIN_ONLY_API_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export async function enforceStaffApiAuth(event: H3Event): Promise<void> {
  const pathname = getRequestURL(event).pathname

  if (!pathname.startsWith('/api/')) return
  if (isPublicApiPath(pathname, event.method)) return
  if (!isStaffApiPath(pathname)) return

  if (isAdminOnlyApiPath(pathname)) {
    await requireAdminUser(event)
    return
  }

  await requireStaffUser(event)
}
