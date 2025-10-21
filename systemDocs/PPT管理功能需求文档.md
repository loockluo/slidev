# Slidev PPT 管理功能需求文档

## 1. 项目背景

Slidev 是一个基于 Vue 3 和 Markdown 的演示文稿工具。目前用户可以通过命令行工具创建和管理演示文稿，但缺少一个可视化的管理界面。为了提升用户体验，需要在客户端添加一个 PPT 管理功能，允许用户查看、管理和快速访问他们的演示文稿。

## 2. 功能需求概述

### 2.1 核心功能
- **演示文稿列表展示** - 以卡片或列表形式展示所有可用的演示文稿
- **演示文稿信息查看** - 显示标题、描述、创建时间、修改时间、幻灯片数量等基本信息
- **快速跳转** - 点击演示文稿直接进入演示模式
- **删除功能** - 删除不需要的演示文稿（需确认）
- **搜索过滤** - 按标题或路径搜索演示文稿

### 2.2 高级功能
- **最近使用** - 显示最近打开的演示文稿
- **预览功能** - 快速预览演示文稿的第一页或缩略图

## 3. 用户界面设计

### 3.1 入口位置
在 `entry.vue` 页面添加一个新的管理入口：
- 新增 "管理" 或 "我的演示文稿" 按钮
- 使用现有的设计风格和图标

### 3.2 管理页面布局
```
┌─────────────────────────────────────────────────┐
│  搜索框                           [视图切换]     │
├─────────────────────────────────────────────────┤
│  [筛选器: 全部 | 最近]                          │
├─────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ 缩略图  │ │ 缩略图  │ │ 缩略图  │ │ ...   │ │
│  │ 标题    │ │ 标题    │ │ 标题    │ │       │ │
│  │ 信息    │ │ 信息    │ │ 信息    │ │       │ │
│  │ [操作]  │ │ [操作]  │ │ [操作]  │ │       │ │
│  └─────────┘ └─────────┘ └─────────┘ └───────┘ │
└─────────────────────────────────────────────────┘
```

### 3.3 卡片设计
每个演示文稿卡片包含：
- **缩略图** - 第一页预览或默认图标
- **标题** - 演示文稿标题
- **基本信息** - 幻灯片数量、修改时间
- **操作按钮** - [打开] [删除] [预览]

## 4. 数据结构设计

### 4.1 演示文稿对象接口
```typescript
interface Presentation {
  id: string                    // 唯一标识符
  title: string                 // 标题（从 frontmatter 或文件名提取）
  description?: string          // 描述
  thumbnail?: string            // 缩略图URL
  slideCount: number            // 幻灯片数量
  createdAt: string             // 创建时间 (ISO 8601 格式)
  updatedAt: string             // 修改时间 (ISO 8601 格式)
  lastOpened?: string           // 最后打开时间 (ISO 8601 格式)
}
```

### 4.2 管理状态接口
```typescript
interface PresentationManager {
  presentations: Presentation[]    // 所有演示文稿
  filteredPresentations: Presentation[] // 过滤后的演示文稿
  searchQuery: string              // 搜索关键词
  filterType: 'all' | 'recent'    // 过滤类型：全部或最近
  viewMode: 'grid' | 'list'       // 视图模式
  sortBy: 'title' | 'updated' | 'created' | 'opened' // 排序方式
  sortOrder: 'asc' | 'desc'       // 排序顺序
}
```

## 5. API 接口设计（Mock 数据）

### 5.1 获取演示文稿列表
```typescript
// GET /api/documents
interface PresentationsResponse {
  success: boolean
  data: Presentation[]
  total: number
}
```

### 5.2 删除演示文稿
```typescript
// DELETE /api/documents/:id
interface DeleteResponse {
  success: boolean
  message?: string
}
```

### 5.3 Mock 数据示例
```typescript
const mockPresentations: Presentation[] = [
  {
    id: '1',
    title: 'Vue 3 最佳实践',
    description: '关于 Vue 3 开发的最佳实践分享',
    slideCount: 15,
    thumbnail: '/api/documents/1/thumbnail',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    lastOpened: '2024-01-25T00:00:00Z'
  },
  {
    id: '2',
    title: 'TypeScript 入门指南',
    description: 'TypeScript 基础语法和高级特性',
    slideCount: 20,
    thumbnail: '/api/documents/2/thumbnail',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
    lastOpened: '2024-01-22T00:00:00Z'
  },
  // 更多 mock 数据...
]
```

## 6. 技术实现方案

### 6.1 新增文件结构
```
packages/client/
├── pages/
│   └── manage.vue              # 管理页面主组件
├── components/
│   └── presentation/
│       ├── PresentationCard.vue     # 演示文稿卡片
│       ├── PresentationList.vue     # 演示文稿列表
│       ├── PresentationGrid.vue     # 演示文稿网格视图
│       ├── SearchBar.vue           # 搜索栏
│       ├── FilterBar.vue           # 过滤栏
│       └── PreviewModal.vue        # 预览模态框
├── composables/
│   └── usePresentationManager.ts    # 管理功能的主要逻辑
├── stores/
│   └── presentation.ts              # 演示文稿状态管理
├── types/
│   └── presentation.ts              # 类型定义
└── api/
    └── presentation.ts              # API 接口
```

### 6.2 状态管理
使用 Vue 3 的响应式 API 或 Pinia 进行状态管理：

```typescript
// stores/presentation.ts
export const usePresentationStore = defineStore('presentation', () => {
  const presentations = ref<Presentation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchPresentations = async () => { /* ... */ }
  const deletePresentation = async (id: string) => { /* ... */ }

  return {
    presentations,
    loading,
    error,
    fetchPresentations,
    deletePresentation
  }
})
```

### 6.3 路由配置
在现有路由中添加管理页面路由：
```typescript
// router 配置
{
  path: '/manage',
  name: 'manage',
  component: () => import('./pages/manage.vue')
}
```

## 7. 交互流程

### 7.1 页面加载流程
1. 用户进入管理页面
2. 自动加载演示文稿列表
3. 显示加载状态
4. 渲染演示文稿卡片/列表
5. 错误处理和重试机制

### 7.2 删除流程
1. 用户点击删除按钮
2. 显示确认对话框
3. 用户确认后调用删除 API
4. 更新本地状态和界面
5. 显示删除成功提示

### 7.3 搜索和过滤流程
1. 用户输入搜索关键词或选择过滤器
2. 实时过滤演示文稿列表
3. 更新界面显示
4. 保存搜索状态到 URL 参数



## 8. 风险和依赖

### 8.1 技术风险
- 文件系统权限限制（浏览器环境）
- 大量数据时的性能问题
- 浏览器兼容性问题

### 8.2 依赖项
- Vue 3 Composition API
- Vue Router
- 图标库（现有 UnoCSS 图标）
- 状态管理（Pinia 或 Vue 3 响应式）

---

**备注**：此需求文档为初步设计，具体实现细节可能会根据开发过程中的实际情况进行调整。