import type { Ref } from 'vue'

const GAP_PX = 16

export type IndexHorizontalSliderOptions = {
  /** เลื่อนอัตโนมัติเมื่อมีรายการมากกว่าที่แสดงในจอ */
  autoPlay?: boolean
  autoPlayIntervalMs?: number
}

export function useIndexHorizontalSlider(
  itemCount: Ref<number>,
  getVisibleCount: () => number = defaultVisibleCount,
  options?: IndexHorizontalSliderOptions,
) {
  const scrollerRef = ref<HTMLElement | null>(null)
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const slideWidthPx = ref<number | null>(null)
  const visibleSlots = ref(getVisibleCount())
  const autoPlayPaused = ref(false)

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
    visibleSlots.value = getVisibleCount()
    const width = el.clientWidth
    if (width <= 0) {
      return
    }
    const next = Math.floor(
      (width - GAP_PX * (visibleSlots.value - 1)) / visibleSlots.value,
    )
    if (next > 0) {
      slideWidthPx.value = next
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
    const step = (slideWidthPx.value + GAP_PX) * visibleSlots.value
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

function defaultVisibleCount() {
  if (!import.meta.client) return 2
  if (window.innerWidth >= 1024) return 2
  if (window.innerWidth >= 640) return 2
  return 1
}

/** สินค้าแนะนำ — 4 ชิ้นต่อแถวบนจอใหญ่ */
export function featuredProductsVisibleCount() {
  if (!import.meta.client) return 4
  if (window.innerWidth >= 1024) return 4
  if (window.innerWidth >= 640) return 2
  return 1
}

/** โปรโมชั่น — 2 ใบต่อแถวบนจอใหญ่ (ตาม mockup) */
export function promotionsVisibleCount() {
  if (!import.meta.client) return 2
  if (window.innerWidth >= 640) return 2
  return 1
}

/** Customer Experiences — 4 การ์ดต่อแถวบนจอใหญ่ */
export function experiencesVisibleCount() {
  if (!import.meta.client) return 4
  if (window.innerWidth >= 1024) return 4
  if (window.innerWidth >= 640) return 2
  return 1
}
