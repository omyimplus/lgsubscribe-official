import type { InjectionKey } from 'vue'
import type { useAdminImportItemForm } from '~/composables/useAdminImportItemForm'

export const IMPORT_ITEM_FORM_KEY: InjectionKey<ReturnType<typeof useAdminImportItemForm>>
  = Symbol('import-item-form')
