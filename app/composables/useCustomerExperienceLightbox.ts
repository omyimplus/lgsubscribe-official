import type { CustomerExperiencePublic } from '~~/shared/types/customerExperience'

export function useCustomerExperienceLightbox(options?: {
  onOpen?: () => void
  onClose?: () => void
}) {
  const lightboxOpen = ref(false)
  const lightboxItem = ref<CustomerExperiencePublic | null>(null)
  const lightboxImageIndex = ref(0)

  function openLightbox(payload: { item: CustomerExperiencePublic, imageIndex: number }) {
    lightboxItem.value = payload.item
    lightboxImageIndex.value = payload.imageIndex
    lightboxOpen.value = true
    options?.onOpen?.()
  }

  watch(lightboxOpen, (open) => {
    if (!open) options?.onClose?.()
  })

  return {
    lightboxOpen,
    lightboxItem,
    lightboxImageIndex,
    openLightbox,
  }
}
