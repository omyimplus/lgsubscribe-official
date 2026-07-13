import { formatLineOaIdDisplay, resolveLineOaUrl } from '~~/shared/utils/lineOa'
import { SITE_LINE_OA_ID, SITE_LINE_QR_IMAGE } from '~~/shared/utils/siteContact'

function useLineOaConfig() {
  const config = useRuntimeConfig()

  const lineOaUrl = computed(() =>
    resolveLineOaUrl(config.public.lineOaUrl, SITE_LINE_OA_ID),
  )

  const lineOaIdDisplay = computed(() => formatLineOaIdDisplay(SITE_LINE_OA_ID))

  return { lineOaUrl, lineOaIdDisplay, config }
}

/** สร้าง QR จากลิงก์เพิ่มเพื่อน Line (client-only) */
export function useLineOaQr() {
  const { lineOaUrl, lineOaIdDisplay, config } = useLineOaConfig()

  const staticQrImage = computed(() =>
    String(config.public.lineOaQrImage || '').trim() || SITE_LINE_QR_IMAGE,
  )
  const useStaticQr = computed(() => !!staticQrImage.value)

  const qrDataUrl = ref('')
  const qrLoading = ref(false)
  const qrError = ref(false)

  async function generateQr() {
    if (useStaticQr.value) return
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
