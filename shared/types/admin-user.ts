export type AdminUserRole = 'admin' | 'employee'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: AdminUserRole
  created_at: string
  last_sign_in_at: string | null
}

export interface AdminUserInput {
  email: string
  password: string
  full_name: string
  role: AdminUserRole
}

export interface AdminUserUpdateInput {
  full_name?: string
  role?: AdminUserRole
  password?: string
}
