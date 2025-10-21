# Slidev 后端集成技术方案

## 1. 项目概述

将现有的 Slidev 前端虚拟慕课系统改造为从后端 API 获取 PPT 内容，并在所有与 PPT 相关的路由前添加 PPT ID 参数，实现多 PPT 管理和访问功能。

## 2. 当前架构分析

### 2.1 现有路由结构
```typescript
// 当前路由 (setup/routes.ts)
/                    -> 重定向到 /1
/:no                -> 普通演示模式 (/1, /2, /3...)
/presenter/:no      -> 演示者模式
/export/:no         -> 导出模式
/print              -> 打印模式
/overview           -> 概览模式
/notes              -> 笔记模式
```

### 2.2 现有数据流
```typescript
// 数据来源 (logic/slides.ts)
import { slides } from '#slidev/slides'  // 本地编译生成的幻灯片数据

// 页面获取方式
export function getSlide(no: number | string) {
  return slides.value.find(s => s.no === +no || ...)
}
```

### 2.3 现有导航逻辑
```typescript
// 路径生成 (logic/slides.ts)
export function getSlidePath(route, presenter, exporting) {
  return exporting ? `/export/${no}` : presenter ? `/presenter/${no}` : `/${no}`
}
```

## 3. 新架构设计

### 3.1 新路由结构
```typescript
// 带 PPT ID 的路由结构
/manage                     -> PPT 管理列表页面
/:doc_id                   -> 普通演示模式 (/123, /456...)
/:doc_id/:no               -> 特定幻灯片页面 (/123/1, /123/2...)
/:doc_id/presenter         -> 演示者模式
/:doc_id/presenter/:no     -> 演示者模式特定页面
/:doc_id/export            -> 导出模式
/:doc_id/export/:no        -> 导出特定页面
/:doc_id/print             -> 打印模式
/:doc_id/overview          -> 概览模式
/:doc_id/notes             -> 笔记模式
```

### 3.2 URL 参数设计
```typescript
interface RouteParams {
  doc_id: string       // 文档的唯一标识符
  no?: string          // 幻灯片页码 (可选)
}

interface RouteQuery {
  clicks?: string     // 点击次数
  embedded?: string   // 嵌入模式
  password?: string   // 访问密码
  // ... 其他现有查询参数
}
```

## 4. 后端 API 集成方案

### 4.1 API 接口设计
```typescript
// PPT 相关 API
interface PPTAPI {
  // 获取 PPT 基本信息
  getPresentation(pptId: string): Promise<Presentation>

  // 获取 PPT 幻灯片数据
  getSlides(pptId: string): Promise<SlideData[]>

  // 获取单个幻灯片
  getSlide(pptId: string, slideNo: number): Promise<SlideData>

  // 获取 PPT 列表
  getPresentations(): Promise<Presentation[]>

  // 删除 PPT
  deletePresentation(pptId: string): Promise<void>
}

// 数据类型定义
interface Presentation {
  id: string
  title: string
  description?: string
  thumbnail?: string
  slideCount: number
  createdAt: string
  updatedAt: string
  lastOpened?: string
}

interface SlideData {
  no: number
  content: string        // Markdown 内容
  frontmatter: any       // Frontmatter 数据
  meta?: {
    layout?: string
    level?: number
    [key: string]: any
  }
}
```

### 4.2 API 客户端实现
```typescript
// api/presentation.ts
class PresentationAPI {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async getPresentation(pptId: string): Promise<Presentation> {
    const response = await fetch(`${this.baseURL}/api/documents/${pptId}`)
    if (!response.ok) throw new Error(`Failed to fetch presentation: ${pptId}`)
    return response.json()
  }

  async getSlides(pptId: string): Promise<SlideData[]> {
    const response = await fetch(`${this.baseURL}/api/documents/${pptId}/slides`)
    if (!response.ok) throw new Error(`Failed to fetch slides: ${pptId}`)
    return response.json()
  }

  async getPresentations(): Promise<Presentation[]> {
    const response = await fetch(`${this.baseURL}/api/documents`)
    if (!response.ok) throw new Error('Failed to fetch presentations')
    return response.json()
  }

  async deletePresentation(pptId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/documents/${pptId}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error(`Failed to delete presentation: ${pptId}`)
  }
}

// 全局 API 实例
export const presentationAPI = new PresentationAPI('/api')
```

## 5. 状态管理改造

### 5.1 PPT 数据状态管理
```typescript
// stores/presentation.ts
export const usePresentationStore = defineStore('presentation', () => {
  // 当前 PPT 相关状态
  const currentDocId = ref<string | null>(null)
  const currentPresentation = ref<Presentation | null>(null)
  const currentSlides = ref<SlideData[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // PPT 列表状态
  const presentations = ref<Presentation[]>([])
  const listLoading = ref(false)
  const listError = ref<string | null>(null)

  // 加载当前 PPT
  async function loadPresentation(docId: string) {
    if (currentDocId.value === docId && currentPresentation.value) {
      return // 已加载，直接返回
    }

    loading.value = true
    error.value = null

    try {
      // 并行加载 PPT 信息和幻灯片数据
      const [presentation, slides] = await Promise.all([
        presentationAPI.getPresentation(docId),
        presentationAPI.getSlides(docId)
      ])

      currentDocId.value = docId
      currentPresentation.value = presentation
      currentSlides.value = slides
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 加载 PPT 列表
  async function loadPresentations() {
    listLoading.value = true
    listError.value = null

    try {
      presentations.value = await presentationAPI.getPresentations()
    } catch (err) {
      listError.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      listLoading.value = false
    }
  }

  // 删除 PPT
  async function deletePresentation(docId: string) {
    try {
      await presentationAPI.deletePresentation(docId)

      // 从列表中移除
      presentations.value = presentations.value.filter(p => p.id !== docId)

      // 如果删除的是当前 PPT，清空状态
      if (currentDocId.value === docId) {
        currentDocId.value = null
        currentPresentation.value = null
        currentSlides.value = []
      }
    } catch (err) {
      throw err
    }
  }

  return {
    // 状态
    currentDocId: readonly(currentDocId),
    currentPresentation: readonly(currentPresentation),
    currentSlides: readonly(currentSlides),
    presentations: readonly(presentations),
    loading: readonly(loading),
    error: readonly(error),
    listLoading: readonly(listLoading),
    listError: readonly(listError),

    // 方法
    loadPresentation,
    loadPresentations,
    deletePresentation
  }
})
```

### 5.2 幻灯片数据处理
```typescript
// composables/useSlidesData.ts
export function useSlidesData() {
  const route = useRoute()
  const store = usePresentationStore()

  // 从路由参数获取文档 ID
  const docId = computed(() => route.params.doc_id as string)

  // 转换后端数据为前端需要的格式
  const slides = computed(() => {
    return store.currentSlides.map((slide, index) => ({
      no: index + 1,
      ...slide,
      // 兼容现有格式
      meta: {
        ...slide.meta,
        slide: {
          frontmatter: slide.frontmatter,
          start: 0, // 需要根据实际情况计算
          end: 0   // 需要根据实际情况计算
        }
      }
    }))
  })

  // 当文档 ID 改变时重新加载数据
  watch(docId, (newId) => {
    if (newId) {
      store.loadPresentation(newId)
    }
  }, { immediate: true })

  return {
    docId,
    slides,
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    currentPresentation: computed(() => store.currentPresentation)
  }
}
```

## 6. 路由改造方案

### 6.1 路由配置修改
```typescript
// setup/routes.ts (修改版)
export default function setupRoutes() {
  const routes: RouteRecordRaw[] = []

  // PPT 管理页面
  routes.push({
    name: 'manage',
    path: '/manage',
    component: () => import('../pages/manage.vue')
  })

  // PPT 相关路由 (需要 doc_id 参数)
  const pptRoutes = [
    // 普通演示模式
    {
      name: 'slide',
      path: '/:doc_id/:no?',
      component: () => import('../pages/play.vue')
    },
    // 演示者模式
    {
      name: 'presenter',
      path: '/:doc_id/presenter/:no?',
      component: () => import('../pages/presenter.vue')
    },
    // 概览模式
    {
      name: 'overview',
      path: '/:doc_id/overview',
      component: () => import('../pages/overview.vue')
    },
    // 笔记模式
    {
      name: 'notes',
      path: '/:doc_id/notes',
      component: () => import('../pages/notes.vue')
    },
    // 导出模式
    {
      name: 'export',
      path: '/:doc_id/export/:no?',
      component: () => import('../pages/export.vue')
    },
    // 打印模式
    {
      name: 'print',
      path: '/:doc_id/print',
      component: () => import('../pages/print.vue')
    }
  ]

  routes.push(...pptRoutes)

  // 默认重定向到管理页面
  routes.push({
    path: '/',
    redirect: '/manage'
  })

  // 404 页面
  routes.push({
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/404.vue')
  })

  return routes
}
```

### 6.2 路由守卫
```typescript
// setup/routes.ts (添加路由守卫)
function setupRouteGuards() {
  router.beforeEach(async (to, from, next) => {
    // 如果是 PPT 相关路由，验证文档 ID 并加载数据
    if (to.params.doc_id) {
      const store = usePresentationStore()

      try {
        // 确保当前 PPT 已加载
        if (store.currentDocId.value !== to.params.doc_id) {
          await store.loadPresentation(to.params.doc_id as string)
        }
        next()
      } catch (error) {
        // 加载失败，重定向到管理页面或错误页面
        console.error('Failed to load presentation:', error)
        next('/manage')
      }
    } else {
      next()
    }
  })
}
```

## 7. 现有组件改造

### 7.1 useNav Hook 改造
```typescript
// composables/useNav.ts (关键修改)
export function useNav(): SlidevContextNavFull {
  const route = useRoute()
  const router = useRouter()
  const { slides, docId } = useSlidesData()

  // 获取当前幻灯片编号
  const currentSlideNo = computed(() => {
    const no = route.params.no as string
    return no ? +no : 1
  })

  // 修改路径生成函数以支持文档 ID
  function getSlidePath(no: number | string, presenter = false, exporting = false) {
    const basePath = `/${docId.value}`
    if (exporting) {
      return `${basePath}/export/${no}`
    } else if (presenter) {
      return `${basePath}/presenter/${no}`
    } else {
      return `${basePath}/${no}`
    }
  }

  // 修改导航函数
  async function go(no: number | string, clicks = 0, force = false) {
    const path = getSlidePath(no, route.name === 'presenter', route.name === 'export')
    await router.push({
      path,
      query: {
        ...route.query,
        clicks: clicks === 0 ? undefined : clicks.toString()
      }
    })
  }

  // ... 其他导航逻辑保持不变

  return {
    // 返回与之前相同的接口，内部实现适配新的路由结构
    slides,
    currentSlideNo,
    // ... 其他属性和方法
    go,
    // ... 其他方法
  }
}
```

### 7.2 页面组件改造
```typescript
// pages/play.vue (修改示例)
<script setup lang="ts">
import { useSlidesData } from '../composables/useSlidesData'
import { useNav } from '../composables/useNav'

// 使用新的数据 Hook
const { slides, loading, error } = useSlidesData()
const nav = useNav()

// 错误处理
if (error.value) {
  // 显示错误信息或重定向
}

// 原有的组件逻辑保持不变
</script>

<template>
  <!-- 加载状态 -->
  <div v-if="loading" class="flex items-center justify-center h-screen">
    <div class="text-xl">加载中...</div>
  </div>

  <!-- 错误状态 -->
  <div v-else-if="error" class="flex items-center justify-center h-screen">
    <div class="text-red-500">加载失败: {{ error }}</div>
  </div>

  <!-- 正常内容 -->
  <div v-else>
    <!-- 原有的模板内容 -->
    <SlideContainer>
      <SlidesShow render-context="slide" />
      <PresenterMouse />
    </SlideContainer>
    <!-- ... 其他内容 -->
  </div>
</template>
```

## 8. 数据兼容性处理

### 8.1 响应式数据适配
```typescript
// logic/slides.ts (兼容性修改)
import { useSlidesData } from '../composables/useSlidesData'

// 保持向后兼容的导出
export function useSlides() {
  const { slides } = useSlidesData()
  return slides
}

// 修改 getSlide 函数
export function getSlide(no: number | string) {
  const { slides } = useSlidesData()
  return slides.value.find(
    s => (s.no === +no || s.meta?.slide?.frontmatter?.routeAlias === no),
  )
}

// 修改 getSlidePath 函数以支持新的路由结构
export function getSlidePath(
  route: SlideRoute | number | string,
  presenter: boolean,
  exporting: boolean = false,
) {
  const currentRoute = useRoute()
  const docId = currentRoute.params.doc_id as string

  if (typeof route === 'number' || typeof route === 'string')
    route = getSlide(route)!

  const no = route.meta?.slide?.frontmatter?.routeAlias ?? route.no
  const basePath = `/${docId}`

  if (exporting) {
    return `${basePath}/export/${no}`
  } else if (presenter) {
    return `${basePath}/presenter/${no}`
  } else {
    return `${basePath}/${no}`
  }
}
```

### 8.2 全局状态修改
```typescript
// env.ts (环境变量适配)
export function useSlidesContext() {
  const { slides, currentPresentation } = useSlidesData()

  return {
    // 保持与原有接口的兼容性
    slides,
    config: readonly(computed(() => ({
      // ... 配置项
      title: currentPresentation.value?.title || 'Slidev Presentation',
      // ... 其他配置
    }))),
    // ... 其他上下文数据
  }
}
```

## 9. 错误处理和加载状态

### 9.1 全局错误处理
```typescript
// composables/useErrorHandler.ts
export function useErrorHandler() {
  const route = useRouter()

  function handlePresentationError(error: Error) {
    console.error('Presentation error:', error)

    // 根据错误类型进行不同处理
    if (error.message.includes('404')) {
      // PPT 不存在，重定向到管理页面
      route.push('/manage')
    } else if (error.message.includes('403')) {
      // 权限不足，显示密码输入框
      // ... 处理逻辑
    } else {
      // 其他错误，显示错误页面
      route.push('/error')
    }
  }

  return {
    handlePresentationError
  }
}
```

### 9.2 加载状态管理
```typescript
// composables/useLoadingState.ts
export function useLoadingState() {
  const loading = ref(false)
  const loadingText = ref('加载中...')

  function setLoading(isLoading: boolean, text = '加载中...') {
    loading.value = isLoading
    loadingText.value = text
  }

  return {
    loading: readonly(loading),
    loadingText: readonly(loadingText),
    setLoading
  }
}
```

## 10. 迁移策略

### 10.1 渐进式迁移
1. **第一阶段**：保持现有路由结构，添加新的 PPT 管理页面
2. **第二阶段**：逐步迁移现有页面到新的路由结构
3. **第三阶段**：完全移除旧的路由结构

### 10.2 向后兼容
```typescript
// 兼容旧路由的重定向
routes.push({
  path: '/:no',
  redirect: to => {
    // 如果路径看起来像数字但没有文档 ID，重定向到管理页面
    if (/^\d+$/.test(to.params.no as string)) {
      return '/manage'
    }
    // 保留 404 处理
    return { path: '/404' }
  }
})

routes.push({
  path: '/presenter/:no',
  redirect: to => {
    return '/manage'
  }
})
```

## 11. 测试策略

### 11.1 单元测试
- API 客户端测试
- 状态管理测试
- 路由逻辑测试

### 11.2 集成测试
- 端到端路由测试
- 数据加载流程测试
- 错误处理测试

### 11.3 Mock 数据
```typescript
// mocks/presentation.ts
export const mockPresentation: Presentation = {
  id: 'test-ppt-1',
  title: '测试演示文稿',
  description: '这是一个测试演示文稿',
  slideCount: 3,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

export const mockSlides: SlideData[] = [
  {
    no: 1,
    content: '# 第一页\n\n这是第一页的内容',
    frontmatter: { layout: 'cover' },
    meta: { layout: 'cover' }
  },
  // ... 更多幻灯片
]
```

## 12. 性能优化

### 12.1 数据缓存
```typescript
// 使用 Vue 的响应式系统进行缓存
const presentationCache = new Map<string, Presentation>()
const slidesCache = new Map<string, SlideData[]>()

async function getCachedPresentation(docId: string) {
  if (presentationCache.has(docId)) {
    return presentationCache.get(docId)!
  }

  const presentation = await presentationAPI.getPresentation(docId)
  presentationCache.set(docId, presentation)
  return presentation
}
```

### 12.2 懒加载
```typescript
// 幻灯片内容懒加载
async function loadSlideContent(docId: string, slideNo: number) {
  const cacheKey = `${docId}-${slideNo}`
  if (slideContentCache.has(cacheKey)) {
    return slideContentCache.get(cacheKey)!
  }

  const content = await presentationAPI.getSlide(docId, slideNo)
  slideContentCache.set(cacheKey, content)
  return content
}
```

## 13. 总结

这个技术方案提供了将 Slidev 从本地数据模式改造为后端 API 数据模式的完整解决方案。主要特点包括：

1. **完整的路由改造**：所有 PPT 相关路由都包含 PPT ID 参数
2. **状态管理升级**：使用 Pinia 管理多 PPT 状态
3. **API 集成**：完整的后端 API 客户端实现
4. **向后兼容**：保持现有组件接口的兼容性
5. **错误处理**：完善的错误处理和加载状态管理
6. **性能优化**：缓存和懒加载策略

通过这个方案，可以实现多 PPT 管理、在线访问、权限控制等企业级功能。