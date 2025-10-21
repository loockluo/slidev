import type {
  CreateDocumentRequest,
  DuplicateDocumentRequest,
  Presentation,
  PresentationDetail,
  PresentationsQuery,
  SlideData,
  SlidePatch,
  UpdateDocumentRequest,
  UpdateSlidesRequest,
} from '../types/presentation'
import { defineStore } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { presentationAPI } from '../api/presentation'
import { useErrorHandler } from '../composables/useErrorHandler'

export const usePresentationStore = defineStore('presentation', () => {
  const { handlePresentationError, handleSlideError, createRetryWrapper } = useErrorHandler()

  // 当前PPT相关状态
  const currentDocId = ref<string | null>(null)
  const currentPresentation = ref<PresentationDetail | null>(null)
  const currentSlides = ref<SlideData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // PPT列表状态
  const presentations = ref<Presentation[]>([])
  const presentationsTotal = ref(0)
  const listLoading = ref(false)
  const listError = ref<string | null>(null)

  // 计算属性
  const currentSlideCount = computed(() => currentSlides.value.length)
  const hasPresentations = computed(() => presentations.value.length > 0)
  const currentTitle = computed(() => currentPresentation.value?.title || 'Untitled Presentation')

  // 加载当前PPT
  const loadPresentation = createRetryWrapper(async (docId: string) => {
    if (currentDocId.value === docId && currentPresentation.value) {
      return // 已加载，直接返回
    }

    loading.value = true
    error.value = null

    try {
      // 并行加载PPT信息和幻灯片数据
      const [presentation, slides] = await Promise.all([
        presentationAPI.getPresentation(docId),
        presentationAPI.getSlides(docId),
      ])

      currentDocId.value = docId
      currentPresentation.value = presentation
      currentSlides.value = slides

      // 记录打开时间（不阻塞主流程）
      presentationAPI.recordDocumentOpen(docId).catch(console.error)
    }
    catch (err) {
      handlePresentationError(err, docId)
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
    finally {
      loading.value = false
    }
  }, 3)

  // 加载PPT列表
  const loadPresentations = createRetryWrapper(async (query?: PresentationsQuery) => {
    listLoading.value = true
    listError.value = null

    try {
      const response = await presentationAPI.getPresentations(query)
      presentations.value = response.presentations
      presentationsTotal.value = response.total
    }
    catch (err) {
      handlePresentationError(err)
      listError.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    }
    finally {
      listLoading.value = false
    }
  }, 2)

  // 创建新PPT
  const createPresentation = createRetryWrapper(async (data: CreateDocumentRequest): Promise<Presentation> => {
    try {
      const presentation = await presentationAPI.createDocument(data)
      presentations.value.unshift(presentation)
      return presentation
    }
    catch (err) {
      handlePresentationError(err)
      throw new Error(err instanceof Error ? err.message : 'Failed to create presentation')
    }
  }, 1) // Don't retry create operations automatically

  // 更新PPT信息
  async function updatePresentationInfo(docId: string, data: UpdateDocumentRequest): Promise<void> {
    try {
      await presentationAPI.updateDocument(docId, data)

      // 更新当前PPT信息
      if (currentPresentation.value && currentPresentation.value.id === docId) {
        currentPresentation.value = {
          ...currentPresentation.value,
          ...data,
        }
      }

      // 更新列表中的PPT信息
      const index = presentations.value.findIndex(p => p.id === docId)
      if (index !== -1) {
        presentations.value[index] = {
          ...presentations.value[index],
          ...data,
        }
      }
    }
    catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update presentation')
    }
  }

  // 复制PPT
  async function duplicatePresentation(docId: string, data: DuplicateDocumentRequest): Promise<Presentation> {
    try {
      const presentation = await presentationAPI.duplicateDocument(docId, data)
      presentations.value.unshift(presentation)
      return presentation
    }
    catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to duplicate presentation')
    }
  }

  // 删除PPT
  async function deletePresentation(docId: string): Promise<void> {
    try {
      await presentationAPI.deletePresentation(docId)

      // 从列表中移除
      presentations.value = presentations.value.filter(p => p.id !== docId)

      // 如果删除的是当前PPT，清空状态
      if (currentDocId.value === docId) {
        currentDocId.value = null
        currentPresentation.value = null
        currentSlides.value = []
      }
    }
    catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete presentation')
    }
  }

  // 更新单个幻灯片
  const updateSlide = createRetryWrapper(async (docId: string, slideNo: number, patch: SlidePatch): Promise<SlideData> => {
    try {
      const updatedSlide = await presentationAPI.updateSlide(docId, slideNo, patch)

      // 更新当前幻灯片列表
      const slideIndex = currentSlides.value.findIndex(s => s.no === slideNo)
      if (slideIndex !== -1) {
        currentSlides.value[slideIndex] = updatedSlide
      }

      // 更新当前PPT详情中的幻灯片
      if (currentPresentation.value?.slides) {
        const detailSlideIndex = currentPresentation.value.slides.findIndex(s => s.no === slideNo)
        if (detailSlideIndex !== -1) {
          currentPresentation.value.slides[detailSlideIndex] = updatedSlide
        }
      }

      return updatedSlide
    }
    catch (err) {
      handleSlideError(err)
      throw new Error(err instanceof Error ? err.message : 'Failed to update slide')
    }
  }, 3)

  // 批量更新幻灯片
  const updateSlides = createRetryWrapper(async (docId: string, data: UpdateSlidesRequest): Promise<SlideData[]> => {
    try {
      const updatedSlides = await presentationAPI.updateSlides(docId, data)

      // 更新当前幻灯片列表
      currentSlides.value = updatedSlides

      // 更新当前PPT详情
      if (currentPresentation.value) {
        currentPresentation.value.slides = updatedSlides
        currentPresentation.value.revision = data.revision
      }

      return updatedSlides
    }
    catch (err) {
      handleSlideError(err)
      throw new Error(err instanceof Error ? err.message : 'Failed to update slides')
    }
  }, 2)

  // 清空当前PPT状态
  function clearCurrentPresentation() {
    currentDocId.value = null
    currentPresentation.value = null
    currentSlides.value = []
    error.value = null
  }

  // 清空列表状态
  function clearPresentationsList() {
    presentations.value = []
    presentationsTotal.value = 0
    listError.value = null
  }

  // 重置所有状态
  function reset() {
    clearCurrentPresentation()
    clearPresentationsList()
  }

  return {
    // 状态
    currentDocId: readonly(currentDocId),
    currentPresentation: readonly(currentPresentation),
    currentSlides: readonly(currentSlides),
    presentations: readonly(presentations),
    presentationsTotal: readonly(presentationsTotal),
    loading: readonly(loading),
    error: readonly(error),
    listLoading: readonly(listLoading),
    listError: readonly(listError),

    // 计算属性
    currentSlideCount,
    hasPresentations,
    currentTitle,

    // 方法
    loadPresentation,
    loadPresentations,
    createPresentation,
    updatePresentationInfo,
    duplicatePresentation,
    deletePresentation,
    updateSlide,
    updateSlides,
    clearCurrentPresentation,
    clearPresentationsList,
    reset,
  }
})
