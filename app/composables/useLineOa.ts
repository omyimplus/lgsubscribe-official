import { formatLineOaIdDisplay, resolveLineOaUrl } from '~~/shared/utils/lineOa'

export function useLineOa() {
  const config = useRuntimeConfig()

  const lineOaUrl = computed(() =>
    resolveLineOaUrl(config.public.lineOaUrl, config.public.lineOaId),
  )

  const lineOaIdDisplay = computed(() =>
    formatLineOaIdDisplay(config.public.lineOaId),
  )

  return { lineOaUrl, lineOaIdDisplay }
}

/** สร้าง QR จากลิงก์เพิ่มเพื่อน Line (client-only) */
export function useLineOaQr() {
  const { lineOaUrl, lineOaIdDisplay } = useLineOa()
  const config = useRuntimeConfig()

  const staticQrImage = computed(() => String(config.public.lineOaQrImage || '').trim())
  const useStaticQr = computed(() => !!staticQrImage.value)

  const qrDataUrl = ref('')
  const qrLoading = ref(false)
  const qrError = ref(false)

  async function generateQr() {
    if (!import.meta.client || useStaticQr.value) return
    const url = lineOaUrl.value
    if (!url) return

    qrLoading.value = true
    qrError.value = false
    try {
      const QRCode = await import('qrcode')
      qrDataUrl.value = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
    }
    catch {
      qrDataUrl.value = ''
      qrError.value = true
    }
    finally {
      qrLoading.value = false
    }
  }

  watch([lineOaUrl, useStaticQr], generateQr, { immediate: true })

  return {
    lineOaUrl,
    lineOaIdDisplay,
    staticQrImage,
    useStaticQr,
    qrDataUrl,
    qrLoading,
    qrError,
  }
}
