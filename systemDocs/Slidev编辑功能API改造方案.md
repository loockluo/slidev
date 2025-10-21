# Slidev 编辑功能 API 改造方案

## 需求分析

### 核心诉求
- **保持现有前端功能不变** - 所有编辑界面和交互逻辑保持原样
- **编辑操作改为 API 调用** - 将现有的文件系统操作改为后端 API 调用
- **无额外功能需求** - 不需要协作编辑、权限管理等复杂功能

## 技术方案

### 现有架构分析
```typescript
// 当前数据流
useSlideInfo -> update() -> POST /__slidev/slides/${no}.json
                ↓
        本地文件系统更新
                ↓
        HMR 热更新到前端
```

### 改造后数据流
```typescript
// 新数据流
useSlideInfo -> update() -> PUT /api/documents/${doc_id}/slides/${no}
                ↓
        后端数据库更新
                ↓
        API 响应更新前端状态
```

## 具体实现

### 修改 useSlideInfo.ts

**目标**：将现有的 API 端点改为包含 doc_id 的新端点

```typescript
// packages/client/composables/useSlideInfo.ts (修改版)
import type { SlideInfo, SlidePatch } from '@slidev/types'
import type { MaybeRef } from '@vueuse/core'
import type { Ref } from 'vue'
import { useFetch } from '@vueuse/core'
import { computed, ref, unref } from 'vue'
import { useRoute } from 'vue-router'
import { getSlide } from '../logic/slides'

export function useSlideInfo(no: number): UseSlideInfo {
  const route = useRoute()
  const docId = route.params.doc_id as string

  // 如果没有服务器或没有 doc_id，使用本地模式
  if (!__SLIDEV_HAS_SERVER__ || !docId) {
    return {
      info: ref(getSlide(no)?.meta.slide ?? null) as Ref<SlideInfo | null>,
      update: async () => {},
    }
  }

  // 修改 API 端点，包含 doc_id 参数
  const url = `/api/documents/${docId}/slides/${no}`
  const { data: info, execute, error } = useFetch(url).json<SlideInfo>().get()

  execute()

  // 修改 update 函数，使用新的 API 端点
  const update = async (data: SlidePatch) => {
    try {
      const response = await fetch(url, {
        method: 'PUT',  // 使用 PUT 方法更新资源
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`)
      }

      const result = await response.json()

      // 更新本地状态
      if (result && info.value) {
        info.value = { ...info.value, ...result }
      }

      return result
    } catch (err) {
      console.error('Failed to update slide:', err)
      throw err
    }
  }

  // 保持 HMR 热更新逻辑不变
  if (__DEV__) {
    import.meta.hot?.on('slidev:update-slide', (payload) => {
      if (payload.no === no)
        info.value = payload.data
    })
    import.meta.hot?.on('slidev:update-note', (payload) => {
      if (payload.no === no && info.value && info.value.note?.trim() !== payload.note?.trim())
        info.value = { ...info.value, ...payload }
    })
  }

  return {
    info,
    update,
  }
}

// useDynamicSlideInfo 函数保持完全不变
const map: Record<number, UseSlideInfo> = {}

export function useDynamicSlideInfo(no: MaybeRef<number>) {
  function get(no: number) {
    return map[no] ??= useSlideInfo(no)
  }

  return {
    info: computed({
      get() {
        return get(unref(no)).info.value
      },
      set(newInfo) {
        get(unref(no)).info.value = newInfo
      },
    }),
    update: async (data: SlidePatch, newId?: number) => {
      const info = get(newId ?? unref(no))
      const newData = await info.update(data)
      if (newData)
        info.info.value = newData
      return newData
    },
  }
}
```

### 后端 API 接口设计

**需要后端实现的接口**：

```typescript
// GET /api/documents/{doc_id}/slides/{slide_no}
// 获取单个幻灯片信息
interface SlideInfoResponse {
  success: boolean
  data: {
    index: number
    no: number
    content: string
    note?: string
    frontmatter?: object
    frontmatterRaw?: string
    revision: string
  }
}

// PUT /api/documents/{doc_id}/slides/{slide_no}
// 更新幻灯片内容
interface SlideUpdateRequest {
  content?: string
  note?: string
  frontmatterRaw?: string
  frontmatter?: object
}

interface SlideUpdateResponse {
  success: boolean
  data: {
    index: number
    no: number
    content: string
    note?: string
    frontmatter?: object
    revision: string
  }
  message?: string
}
```

### 路由配置修改

确保所有编辑相关页面都能获取到 `doc_id`：

```typescript
// setup/routes.ts (修改要点)
export default function setupRoutes() {
  const routes: RouteRecordRaw[] = []

  // 确保编辑相关路由包含 doc_id 参数
  routes.push({
    name: 'notes-edit',
    path: '/:doc_id/notes-edit',  // 添加 doc_id 参数
    component: () => import('../pages/notes-edit.vue')
  })

  // 其他现有路由保持不变，但需要确保都有 doc_id 参数
  // /:doc_id/:no - 普通演示模式
  // /:doc_id/presenter/:no - 演示者模式
  // etc.

  return routes
}
```

## 错误处理

### 网络错误处理

```typescript
// 在 useSlideInfo 中添加错误处理
const update = async (data: SlidePatch) => {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Update failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    if (result && info.value) {
      info.value = { ...info.value, ...result }
    }

    return result
  } catch (err) {
    console.error('Failed to update slide:', err)

    // 可以显示用户友好的错误提示
    if (err instanceof Error) {
      // 显示错误消息（可选）
      showErrorMessage(`保存失败: ${err.message}`)
    }

    throw err
  }
}
```


## 总结

### 改造要点
1. **只修改 useSlideInfo.ts** - 更改 API 端点，添加 doc_id 参数
2. **保持所有组件不变** - SideEditor、notes-edit、NoteEditable 等无需修改
3. **保持用户交互不变** - 所有编辑功能、快捷键、自动保存等保持原样

### 实施步骤
1. **修改 useSlideInfo.ts** - 更新 API 端点
2. **实现后端 API** - 提供对应的接口
3. **更新路由配置** - 确保所有页面都有 doc_id 参数
4. **测试验证** - 确保所有编辑功能正常工作

### 优势
- **最小改动** - 只修改一个核心函数
- **零学习成本** - 用户界面和交互完全不变
- **易于维护** - 逻辑集中，便于调试