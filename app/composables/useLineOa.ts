import { formatLineOaIdDisplay, resolveLineOaUrl } from '~~/shared/utils/lineOa'
import { SITE_LINE_OA_ID } from '~~/shared/utils/siteContact'

/** Line OA หน้าร้าน (@LGSub.Official) — ไม่ใช้ OA หลังบ้าน @subhome */
export function useLineOa() {
  const config = useRuntimeConfig()

  const lineOaUrl = computed(() =>
    resolveLineOaUrl(config.public.lineOaUrl, SITE_LINE_OA_ID),
  )

  const lineOaIdDisplay = computed(() => formatLineOaIdDisplay(SITE_LINE_OA_ID))

  return { lineOaUrl, lineOaIdDisplay }
}
