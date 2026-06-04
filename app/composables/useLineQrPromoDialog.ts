import { LINE_QR_PROMO_DELAY_MS, LINE_QR_PROMO_DISMISS_KEY } from '~~/shared/utils/lineQrPromo'

export function useLineQrPromoDialog() {
  const open = ref(false)
  let showTimer: ReturnType<typeof setTimeout> | null = null

  function clearShowTimer() {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
  }

  function scheduleShow() {
    if (!import.meta.client) return
    if (localStorage.getItem(LINE_QR_PROMO_DISMISS_KEY) === '1') return

    clearShowTimer()
    showTimer = setTimeout(() => {
      showTimer = null
      if (localStorage.getItem(LINE_QR_PROMO_DISMISS_KEY) === '1') return
      open.value = true
    }, LINE_QR_PROMO_DELAY_MS)
  }

  function dismiss() {
    if (!import.meta.client) return
    localStorage.setItem(LINE_QR_PROMO_DISMISS_KEY, '1')
    open.value = false
    clearShowTimer()
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open.value) dismiss()
  }

  onMounted(() => {
    if (document.readyState === 'complete') {
      scheduleShow()
    }
    else {
      window.addEventListener('load', scheduleShow, { once: true })
    }
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    clearShowTimer()
    window.removeEventListener('load', scheduleShow)
    window.removeEventListener('keydown', onKeydown)
    if (import.meta.client) {
      document.body.style.overflow = ''
    }
  })

  watch(open, (isOpen) => {
    if (!import.meta.client) return
    document.body.style.overflow = isOpen ? 'hidden' : ''
  })

  return { open, dismiss }
}
