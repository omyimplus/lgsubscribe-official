import type { Ref } from 'vue'

const GAP_PX = 16
const MAX_SLIDER_TRACK_PX = 10000
const MAX_SLIDE_WIDTH_PX = 800

export type IndexHorizontalSliderOptions = {
  /** เลื่อนอัตโนมัติเมื่อมีรายการมากกว่าที่แสดงในจอ */
  autoPlay?: boolean
  autoPlayIntervalMs?: number
  /** ระยะห่างระหว่าง slide (px) — ต้องตรงกับ gap ใน CSS */
  gapPx?: number
}

export function useIndexHorizontalSlider(
  itemCount: Ref<number>,
  getVisibleCount: (forSsr?: boolean) => number = defaultVisibleCount,
  options?: IndexHorizontalSliderOptions,
) {
  const scrollerRef = ref<HTMLElement | null>(null)
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const slideWidthPx = ref<number | null>(null)
  /** ค่าเริ่มต้นต้องตรง SSR — อย่าใช้ window ก่อน mount */
  const visibleSlots = ref(getVisibleCount(true))
  const autoPlayPaused = ref(false)
  const gapPx = options?.gapPx ?? GAP_PX

  const showArrows = computed(() => itemCount.value > visibleSlots.value)

  const canAutoPlay = computed(() =>
    Boolean(options?.autoPlay)
    && itemCount.value > visibleSlots.value
    && !autoPlayPaused.value,
  )

  const slideStyle = computed(() => {
    if (!slideWidthPx.value) return undefined
    return { width: `${slideWidthPx.value}px`, flexShrink: '0' as const }
  })

  let autoPlayTimer: ReturnType<typeof setInterval> | null = null
  let resumeTimer: ReturnType<typeof setTimeout> | null = null

  function measureSlides() {
    const el = scrollerRef.value
    if (!el) {
      slideWidthPx.value = null
      return
    }
    visibleSlots.value = getVisibleCount(false)
    const width = el.clientWidth
    if (width <= 0 || width > MAX_SLIDER_TRACK_PX) {
      slideWidthPx.value = null
      return
    }
    const slots = visibleSlots.value
    const gapCount = Math.max(0, Math.ceil(slots) - 1)
    const next = Math.min(
      MAX_SLIDE_WIDTH_PX,
      Math.floor(
        (width - gapPx * gapCount) / slots,
      ),
    )
    if (next > 0) {
      slideWidthPx.value = next
    }
    else {
      slideWidthPx.value = null
    }
  }

  async function scheduleLayoutRefresh() {
    await nextTick()
    refreshLayout()
    if (!import.meta.client) return
    requestAnimationFrame(() => {
      refreshLayout()
    })
  }

  function updateScrollState() {
    const el = scrollerRef.value
    if (!el) {
      canScrollLeft.value = false
      canScrollRight.value = false
      return
    }
    canScrollLeft.value = el.scrollLeft > 4
    canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
  }

  function refreshLayout() {
    measureSlides()
    updateScrollState()
  }

  function scrollBy(direction: -1 | 1) {
    const el = scrollerRef.value
    if (!el || !slideWidthPx.value) return
    const step = (slideWidthPx.value + gapPx) * visibleSlots.value
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  function prefersReducedMotion() {
    return import.meta.client
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function tickAutoPlay() {
    if (!canAutoPlay.value) return
    const el = scrollerRef.value
    if (!el || !slideWidthPx.value) return

    if (!canScrollRight.value) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }
    scrollBy(1)
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer)
      autoPlayTimer = null
    }
  }

  function startAutoPlay() {
    stopAutoPlay()
    if (!import.meta.client || prefersReducedMotion() || !options?.autoPlay) return
    if (itemCount.value <= visibleSlots.value) return

    autoPlayTimer = setInterval(tickAutoPlay, options.autoPlayIntervalMs ?? 5000)
  }

  function pauseAutoPlay() {
    autoPlayPaused.value = true
    stopAutoPlay()
  }

  function resumeAutoPlay() {
    autoPlayPaused.value = false
    startAutoPlay()
  }

  /** หยุดชั่วคราวหลังผู้ใช้เลื่อนเอง แล้วเล่นต่อ */
  function pauseAutoPlayTemporarily(ms = 8000) {
    pauseAutoPlay()
    if (resumeTimer) clearTimeout(resumeTimer)
    resumeTimer = setTimeout(() => {
      resumeTimer = null
      resumeAutoPlay()
    }, ms)
  }

  function onUserScroll() {
    updateScrollState()
    if (options?.autoPlay) pauseAutoPlayTemporarily()
  }

  let resizeObserver: ResizeObserver | null = null

  function bindScroller(el: HTMLElement | null) {
    resizeObserver?.disconnect()
    resizeObserver = null
    scrollerRef.value?.removeEventListener('scroll', onUserScroll)

    if (!el || !import.meta.client) return

    el.addEventListener('scroll', onUserScroll, { passive: true })
    resizeObserver = new ResizeObserver(() => {
      refreshLayout()
    })
    resizeObserver.observe(el)
  }

  onMounted(() => {
    visibleSlots.value = getVisibleCount(false)
    scheduleLayoutRefresh()
    bindScroller(scrollerRef.value)
    window.addEventListener('resize', refreshLayout)
    startAutoPlay()
  })

  onActivated(() => {
    scheduleLayoutRefresh()
    bindScroller(scrollerRef.value)
    startAutoPlay()
  })

  onUnmounted(() => {
    stopAutoPlay()
    if (resumeTimer) clearTimeout(resumeTimer)
    bindScroller(null)
    window.removeEventListener('resize', refreshLayout)
  })

  watch(scrollerRef, async (el) => {
    bindScroller(el)
    if (el) {
      await scheduleLayoutRefresh()
    }
  })

  watch(itemCount, async () => {
    await scheduleLayoutRefresh()
    startAutoPlay()
  })

  watch(canAutoPlay, (enabled) => {
    if (enabled) startAutoPlay()
    else stopAutoPlay()
  })

  return {
    scrollerRef,
    canScrollLeft,
    canScrollRight,
    slideStyle,
    showArrows,
    visibleSlots,
    refreshLayout,
    scrollBy,
    pauseAutoPlay,
    resumeAutoPlay,
  }
}

function defaultVisibleCount(forSsr = false) {
  if (!import.meta.client || forSsr) return 2
  if (window.innerWidth >= 1024) return 2
  if (window.innerWidth >= 640) return 2
  return 1
}

/** สินค้าแนะนำ — 4 ชิ้นต่อแถวบนจอใหญ่ */
export function featuredProductsVisibleCount(forSsr = false) {
  if (!import.meta.client || forSsr) return 4
  if (window.innerWidth >= 1024) return 4
  if (window.innerWidth >= 640) return 2
  return 1
}

/** โปรโมชั่น — 2 ใบต่อแถวบนจอใหญ่ (ตาม mockup) */
export function promotionsVisibleCount(forSsr = false) {
  if (!import.meta.client || forSsr) return 2
  if (window.innerWidth >= 640) return 2
  return 1
}

/** Customer Experiences — 4 การ์ดต่อแถวบนจอใหญ่ */
export function experiencesVisibleCount(forSsr = false) {
  if (!import.meta.client || forSsr) return 4
  if (window.innerWidth >= 1024) return 4
  if (window.innerWidth >= 640) return 2
  return 1
}

/** รีวิวลูกค้าบน PDP — 3 การ์ดต่อแถว */
export function pdpCustomerReviewsVisibleCount(forSsr = false) {
  if (!import.meta.client || forSsr) return 3
  if (window.innerWidth >= 640) return 3
  return 1
}

/** แกลอรี่รูปย่อบน PDP (มือถือ) — 3.5 รูปให้เห็นขอบรูปถัดไป */
export function pdpGalleryThumbnailsVisibleCount(_forSsr = false) {
  return 3.5
}
