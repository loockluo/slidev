import type { SlidevSlide } from '@slidev/types'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePresentationStore } from '../stores/presentation'

export function useSlidesData() {
  const route = useRoute()
  const store = usePresentationStore()

  // 从路由参数获取文档 ID
  const docId = computed(() => route.params.doc_id as string)

  // 转换后端数据为前端需要的格式
  const slides = computed(() => {
    return store.currentSlides.map((slide, index) => {
      // 兼容现有的 SlidevSlide 格式
      const slidevSlide: SlidevSlide = {
        no: slide.no,
        frontmatter: slide.frontmatter,
        title: slide.title || `Slide ${slide.no}`,
        content: slide.content,
        note: slide.note || '',
        // 添加兼容性字段
        meta: {
          layout: slide.frontmatter.layout || 'default',
          level: slide.frontmatter.level || 1,
          slide: {
            frontmatter: slide.frontmatter,
            start: index * 1000, // 简单的开始时间计算
            end: (index + 1) * 1000 - 1, // 简单的结束时间计算
            ...slide.frontmatter,
          },
          ...slide.frontmatter,
        },
      }

      return slidevSlide
    })
  })

  // 计算当前幻灯片编号
  const currentSlideNo = computed(() => {
    const no = route.params.no as string
    return no ? Number.parseInt(no) : 1
  })

  // 获取当前幻灯片
  const currentSlide = computed(() => {
    return slides.value.find(s => s.no === currentSlideNo.value)
  })

  // 获取下一个幻灯片
  const nextSlide = computed(() => {
    const currentIndex = slides.value.findIndex(s => s.no === currentSlideNo.value)
    return slides.value[currentIndex + 1]
  })

  // 获取上一个幻灯片
  const prevSlide = computed(() => {
    const currentIndex = slides.value.findIndex(s => s.no === currentSlideNo.value)
    return slides.value[currentIndex - 1]
  })

  // 是否有下一张幻灯片
  const hasNextSlide = computed(() => !!nextSlide.value)

  // 是否有上一张幻灯片
  const hasPrevSlide = computed(() => !!prevSlide.value)

  // 当文档 ID 改变时重新加载数据
  watch(docId, async (newId, oldId) => {
    if (newId && newId !== oldId) {
      try {
        await store.loadPresentation(newId)
      }
      catch (error) {
        console.error('Failed to load presentation:', error)
        // 可以在这里添加错误处理逻辑，比如重定向到错误页面
      }
    }
  }, { immediate: true })

  return {
    // 数据
    docId,
    slides,
    currentSlide,
    nextSlide,
    prevSlide,
    currentSlideNo,

    // 状态
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    currentPresentation: computed(() => store.currentPresentation),

    // 布尔状态
    hasNextSlide,
    hasPrevSlide,

    // 其他有用的计算属性
    currentTitle: computed(() => store.currentTitle),
    currentSlideCount: computed(() => store.currentSlideCount),

    // 方法
    refresh: () => store.loadPresentation(docId.value),
    clearError: () => store.error = null,
  }
}

// 兼容现有代码的函数
export function useSlides() {
  const { slides } = useSlidesData()
  return slides
}

export function getSlide(no: number | string) {
  const { slides } = useSlidesData()
  return slides.value.find(s =>
    s.no === +no
    || s.meta?.slide?.frontmatter?.routeAlias === no,
  )
}
