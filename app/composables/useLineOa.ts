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
