import type { useAdminProductForm } from '~/composables/useAdminProductForm'

export const PRODUCT_FORM_KEY = Symbol('productForm') as InjectionKey<ReturnType<typeof useAdminProductForm>>
