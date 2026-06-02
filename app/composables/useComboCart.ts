import type { ComboCustomerSegment, PublicComboProgram } from '~~/shared/types/comboProgram'
import type { ComboQuoteResult } from '~~/shared/utils/comboPricing'
import { pickBestComboProgram } from '~~/shared/utils/comboProgramPick'
import {
  buildComboQuote,
  buildComboTimelineSteps,
  nextComboTierHint,
} from '~~/shared/utils/comboPricing'
import { comboSegmentLabels } from '~~/shared/utils/comboProgramDisplay'

const SEGMENT_STORAGE_KEY = 'lg-combo-customer-segment'

function loadSegment(): ComboCustomerSegment {
  if (!import.meta.client) return 'new'
  try {
    const raw = localStorage.getItem(SEGMENT_STORAGE_KEY)
    if (raw === 'existing' || raw === 'new') return raw
  }
  catch { /* ignore */ }
  return 'new'
}

export function useComboCart() {
  const cart = useInterestCart()

  const segment = useState<ComboCustomerSegment>('combo-cart-segment', () => 'new')

  onMounted(() => {
    segment.value = loadSegment()
  })

  watch(segment, (value) => {
    if (!import.meta.client) return
    localStorage.setItem(SEGMENT_STORAGE_KEY, value)
  })

  const { data, pending, error, refresh } = useFetch<{ programs: PublicComboProgram[] }>(
    '/api/public/combo-programs',
    { key: 'public-combo-programs', default: () => ({ programs: [] }) },
  )

  const publishedPrograms = computed(() => data.value?.programs ?? [])

  const activeProgram = computed(() =>
    pickBestComboProgram(publishedPrograms.value, segment.value, cart.count.value),
  )

  const quote = computed<ComboQuoteResult>(() =>
    buildComboQuote(cart.items.value, activeProgram.value, segment.value),
  )

  const timelineSteps = computed(() =>
    activeProgram.value
      ? buildComboTimelineSteps(activeProgram.value.tiers)
      : [],
  )

  const nextTierHint = computed(() => {
    if (!activeProgram.value) return null
    return nextComboTierHint(activeProgram.value.tiers, cart.count.value)
  })

  const hasComboProgram = computed(() => Boolean(activeProgram.value?.tiers.length))

  function setSegment(value: ComboCustomerSegment) {
    segment.value = value
  }

  return {
    segment,
    segmentLabels: comboSegmentLabels,
    publishedPrograms,
    activeProgram,
    quote,
    timelineSteps,
    nextTierHint,
    hasComboProgram,
    pending,
    error,
    refresh,
    setSegment,
  }
}
