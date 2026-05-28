import type { User } from '@supabase/supabase-js'
import type { AdminUser, AdminUserRole } from '~~/shared/types/admin-user'

export function parseAdminUserRole(value: unknown): AdminUserRole {
  return value === 'admin' ? 'admin' : 'employee'
}

export function mapAuthUserToAdminUser(user: User): AdminUser {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: typeof meta.full_name === 'string' ? meta.full_name : '',
    role: parseAdminUserRole(meta.role),
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
  }
}

export async function listAllAuthUsers(supabase: ReturnType<typeof useSupabaseAdmin>) {
  const users: User[] = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < perPage) break
    page += 1
  }

  return users
}
