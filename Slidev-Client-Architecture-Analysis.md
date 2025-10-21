# Slidev Client 包架构分析

基于对 Slidev client 包代码的详细分析，本文档提供其架构设计的全面解析。

## 1. 目录结构与组织

```
packages/client/
├── builtin/          # 内置组件库 (28个组件)
├── composables/      # Vue 组合式函数 (13个核心函数)
├── internals/        # 内部组件 (55个内部组件)
├── layouts/          # 布局系统 (22个预定义布局)
├── logic/           # 业务逻辑模块 (15个逻辑模块)
├── modules/         # 功能模块 (6个核心模块)
├── pages/           # 页面组件 (9个页面)
├── scripts/         # 工具脚本
├── setup/           # 初始化配置
├── state/           # 状态管理 (7个状态模块)
└── styles/          # 样式系统 (8个样式文件)
```

### 目录功能说明

- **builtin/**: 提供给用户使用的内置组件，如 `VClick`、`CodeGroup`、`Toc` 等 (28个组件)
- **composables/**: Vue 3 组合式函数，封装核心业务逻辑
- **internals/**: 应用内部组件，不直接暴露给用户
- **layouts/**: 预定义的幻灯片布局模板
- **logic/**: 纯业务逻辑，与 Vue 组件解耦
- **modules/**: 功能模块，主要包含 Vue 指令等
- **pages/**: 路由页面组件
- **state/**: 状态管理相关模块

## 2. 核心架构特点

### 入口与初始化

#### main.ts - 应用启动入口
```typescript
import { createApp } from 'vue'
import App from './App.vue'
import setupMain from './setup/main'

async function main() {
  const app = createApp(App)
  await setupMain(app)
  app.mount('#app')
}
```

#### App.vue - 根组件
```vue
<script setup lang="ts">
import { watchEffect } from 'vue'
import { themeVars } from './env'
import setupRoot from './setup/root'

setupRoot()

watchEffect(() => {
  for (const [key, value] of Object.entries(themeVars.value))
    document.body.style.setProperty(key, value.toString())
})
</script>

<template>
  <RouterView />
</template>
```

#### setup/main.ts - 主初始化流程
负责配置路由、Head 管理器、Vue 指令等核心功能：

```typescript
export default async function setupMain(app: App) {
  // 设置视口高度
  function setMaxHeight() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  }

  // 创建路由器
  const router = createRouter({
    history: __SLIDEV_HASH_ROUTE__ ? createWebHashHistory() : createWebHistory(),
    routes: setupRoutes(),
  })

  // 安装插件
  app.use(router)
  app.use(createHead())
  app.use(createVClickDirectives())
  app.use(createVMarkDirective())
  app.use(createVDragDirective())
  app.use(createVMotionDirectives())
}
```

## 3. 路由系统架构

基于 Vue Router 的多页面架构，支持密码保护和功能特性控制：

### 路由配置
- `/play/:no` - 主要演示页面
- `/presenter/:no` - 演示者模式，需要密码验证
- `/overview` - 幻灯片概览页面
- `/notes` - 笔记查看器
- `/export/:no` - 导出功能页面
- `/print` - 打印页面

### 密码保护机制
```typescript
function passwordGuard(to: RouteLocationNormalized) {
  if (!configs.remote || configs.remote === to.query.password)
    return true
  if (configs.remote && to.query.password === undefined) {
    const password = prompt('Enter password')
    if (configs.remote === password)
      return true
  }
  return { path: '' }
}
```

## 4. 组合式函数 (Composables)

### 导航与控制

#### useNav.ts - 核心导航逻辑
负责幻灯片切换、点击控制、路由管理：

```typescript
export interface SlidevContextNav {
  slides: Ref<SlideRoute[]>
  total: ComputedRef<number>
  currentSlideNo: ComputedRef<number>
  clicksContext: ComputedRef<ClicksContext>
  next: () => Promise<void>
  prev: () => Promise<void>
  go: (no: number | string, clicks?: number, force?: boolean) => Promise<void>
  // ... 其他导航方法
}
```

#### useClicks.ts - 点击动画上下文
管理复杂的点击序列和动画效果：

```typescript
export function createClicksContextBase(
  current: Ref<number>,
  clicksStart = 0,
  clicksTotalOverrides?: number,
): ClicksContext {
  const context: ClicksContext = {
    get current() {
      return clamp(+current.value, clicksStart, context.total)
    },
    calculateSince(rawAt, size = 1) {
      // 计算单个点击的开始、结束状态
    },
    calculateRange(rawAt) {
      // 计算范围点击的状态
    },
    register(el, info) {
      // 注册点击元素
    }
  }
  return context
}
```

### 功能增强

#### 其他重要 Composables
- **useDrawings.ts**: 绘图功能管理，支持绘图状态持久化
- **useDarkMode.ts**: 深色模式切换，基于系统偏好和用户设置
- **useTimer.ts**: 计时器功能，支持暂停、继续、重置
- **useWakeLock.ts**: 屏幕唤醒锁定，防止演示期间屏幕休眠
- **useSwipeControls.ts**: 触摸手势支持，移动端友好
- **useTocTree.ts**: 目录树生成，支持嵌套结构

## 5. 状态管理系统

采用分层状态管理架构，确保状态的可预测性和一致性。

### 共享状态 (shared.ts)
```typescript
export interface SharedState {
  page: number
  clicks: number
  clicksTotal: number
  cursor?: {
    x: number
    y: number
  }
  lastUpdate?: {
    id: string
    type: 'presenter' | 'viewer'
    time: number
  }
}

const { init, onPatch, onUpdate, patch, state } = createSyncState<SharedState>(serverState, {
  page: 1,
  clicks: 0,
  clicksTotal: 0,
})
```

### 绘图状态 (drawings.ts)
管理绘图相关的状态和数据持久化：
- 绘图数据序列化/反序列化
- 撤销/重做功能
- 跨设备同步

### 快照状态 (snapshot.ts)
处理幻灯片快照功能，支持：
- 手动/自动快照
- 快照管理和清理
- 深色模式适配

### 同步状态 (syncState.ts)
实现演示者模式与查看器之间的状态同步：
- 基于 WebSocket 的实时通信
- 冲突解决机制
- 状态一致性保证

## 6. 组件架构

### 内置组件 (builtin/)
提供丰富的演示组件，增强幻灯片表现力：

#### VClick.ts - 点击动画组件
```typescript
export default defineComponent({
  props: {
    at: { type: [Number, String], default: '+1' },
    hide: { type: Boolean, default: false },
    fade: { type: Boolean, default: false },
  },
  render() {
    return h(VClicks, {
      every: CLICKS_MAX,
      at: this.at,
      hide: this.hide,
      fade: this.fade,
    })
  }
})
```

#### 其他重要内置组件
- **CodeGroup.vue**: 代码块分组，支持标签切换
- **Toc.vue**: 目录组件，支持导航和展开/折叠
- **Mermaid.vue**: 图表渲染，集成 Mermaid.js
- **Monaco.vue**: 代码编辑器，基于 Monaco Editor
- **KaTexBlockWrapper.vue**: 数学公式渲染，集成 KaTeX
- **ShikiMagicMove.vue**: 代码动画，支持平滑过渡

### 内部组件 (internals/)
应用核心组件，构成幻灯片的基础框架：

#### SlidesShow.vue - 幻灯片展示容器
```vue
<template>
  <component
    :is="hasViewTransition ? 'div' : TransitionGroup"
    v-bind="currentTransition"
    id="slideshow"
    :class="{
      'slidev-nav-go-forward': clicksDirection > 0,
      'slidev-nav-go-backward': clicksDirection < 0,
    }"
  >
    <SlideWrapper
      v-for="route of loadedRoutes"
      :key="route.no"
      v-show="route === currentSlideRoute"
      :clicks-context="getPrimaryClicks(route)"
      :route="route"
      :render-context="renderContext"
    />
  </component>
</template>
```

#### SlideContainer.vue - 单个幻灯片容器
负责缩放计算和布局适配：
```typescript
const scale = computed(() => {
  if (slideScale.value && !isPrintMode.value)
    return +slideScale.value
  return Math.min(width.value / slideWidth.value, height.value / slideHeight.value)
})
```

#### 其他核心内部组件
- **SlideWrapper.vue**: 幻灯片包装器，处理上下文注入
- **NavControls.vue**: 导航控件，支持键盘和鼠标操作
- **DrawingLayer.vue**: 绘图层，处理绘图交互
- **PresenterMouse.vue**: 演示者鼠标，支持光标同步

## 7. 布局系统

22个预定义布局，满足不同的演示需求：

### 基础布局
- **default.vue**: 默认布局，全屏展示
- **cover.vue**: 封面布局，居中显示
- **center.vue**: 居中布局，内容垂直水平居中
- **full.vue**: 全屏布局，占满整个容器

### 内容布局
- **two-cols.vue**: 双列布局，支持左右分栏
- **image-left.vue**: 左图右文布局
- **image-right.vue**: 右图左文布局
- **iframe.vue**: 嵌入式布局，支持外部内容

### 特殊布局
- **quote.vue**: 引用布局，突出引用内容
- **fact.vue**: 事实布局，强调重要信息
- **section.vue**: 章节布局，标记章节开始
- **end.vue**: 结束布局，用于演示结束

## 8. 指令系统 (modules/)

### v-click 系统
支持多种点击动画指令，提供丰富的交互效果：

#### v-click 指令
```typescript
app.directive<HTMLElement, RawAtValue>('click', {
  mounted(el, dir) {
    const resolved = resolveClick(el, dir, dir.value)
    el.classList.toggle(CLASS_VCLICK_TARGET, true)

    el.watchStopHandle = watchEffect(() => {
      const active = resolved.isActive.value
      const current = resolved.isCurrent.value

      if (resolved.flagHide) {
        el.classList.toggle(resolved.flagFade ? CLASS_VCLICK_FADE : CLASS_VCLICK_HIDDEN, active)
      }

      el.classList.toggle(CLASS_VCLICK_CURRENT, current)
    })
  }
})
```

#### 其他指令
- **v-after**: 点击后显示，延迟展示
- **v-click-hide**: 点击后隐藏，支持淡出效果
- **v-drag**: 拖拽功能，支持元素移动
- **v-mark**: 高亮标记，支持文本高亮
- **v-motion**: 动画效果，支持复杂动画序列

## 9. 样式系统

### UnoCSS 配置
高度可配置的原子化 CSS 系统：

```typescript
export default defineConfig({
  shortcuts: {
    'bg-main': 'bg-white dark:bg-[#121212]',
    'text-primary': 'color-$slidev-theme-primary',
    'slidev-glass-effect': 'shadow-xl backdrop-blur-8 border border-main bg-main bg-opacity-75!',
    // z-index 管理
    'z-drawing': 'z-10',
    'z-nav': 'z-50',
    'z-modal': 'z-70',
  },
  variants: [
    // 方向感知变体
    variantMatcher('forward', input => ({ prefix: `.slidev-nav-go-forward ${input.prefix}` })),
    variantMatcher('backward', input => ({ prefix: `.slidev-nav-go-backward ${input.prefix}` })),
  ],
  extractors: [extractorMdc()],
})
```

### 样式模块
- **index.css**: 主样式文件，包含全局样式
- **code.css**: 代码块样式，支持语法高亮
- **transitions.css**: 过渡动画，页面切换效果
- **layouts-base.css**: 布局基础样式，定义布局规范
- **vars.css**: CSS 变量定义，主题颜色和尺寸

## 10. 核心特性实现

### 点击动画系统
复杂的点击状态管理，支持：
- 相对和绝对点击位置 (`+1`, `+2`, `3`, `5`)
- 点击范围控制 (`[1,3]`, `"+1","+3"`)
- 动画效果（淡入、隐藏、消失）
- 多元素同步动画和序列控制

### 演示者同步
实时的演示者与观众同步：
- 基于 WebSocket 的状态同步
- 支持光标位置同步
- 延迟处理和冲突解决
- 多观众连接支持

### 打印支持
专门的打印页面渲染：
- 优化的打印样式
- 点击状态打印支持
- PDF 导出优化
- 多页打印布局

### 绘图功能
强大的绘图工具：
- 支持多种绘图工具（画笔、形状、文本）
- 绘图状态持久化
- 撤销/重做功能
- 颜色和样式选择

## 11. 性能优化

### 预加载策略
智能的内容预加载：
```typescript
// 预加载当前、前后幻灯片
watchEffect(() => {
  preloadRoute(currentSlideRoute.value)
  preloadRoute(prevRoute.value)
  preloadRoute(nextRoute.value)
})

// 3秒后全量预加载
watchEffect((onCleanup) => {
  const timeout = setTimeout(() => {
    slides.value.forEach(preloadRoute)
  }, 3000)
  onCleanup(() => clearTimeout(timeout))
})
```

### 内存管理
- 组件卸载时清理状态
- 事件监听器自动移除
- 响应式数据适当时机释放
- 避免内存泄漏的最佳实践

### 渲染优化
- 使用 `shallowRef` 减少深层响应式开销
- `TransitionGroup` 优化幻灯片切换性能
- 条件渲染减少不必要的组件创建
- 虚拟滚动支持大量内容

## 12. 架构优势

### 1. 模块化设计
- 每个功能都是独立的模块
- 便于维护、测试和扩展
- 清晰的依赖关系

### 2. 组合式架构
- 充分利用 Vue 3 Composition API
- 逻辑复用性高
- 类型安全的组合式函数

### 3. 类型安全
- 完整的 TypeScript 支持
- 严格的类型检查
- 良好的开发体验

### 4. 可扩展性
- 插件化架构
- 支持自定义组件和功能
- 主题系统可定制

### 5. 性能导向
- 多层次的性能优化策略
- 懒加载和预加载平衡
- 内存使用优化

### 6. 开发体验
- HMR 支持，热更新速度快
- 完善的开发工具集成
- 详细的错误信息和调试支持

## 13. 总结

Slidev 的 client 包展现了现代前端应用架构的最佳实践，通过以下设计原则创建了一个功能强大且易于维护的演示文稿系统：

1. **关注点分离**: 将视图、逻辑、状态清晰分离
2. **组合优于继承**: 通过组合式函数实现逻辑复用
3. **类型安全**: 利用 TypeScript 保证代码质量
4. **性能优先**: 多层次的性能优化策略
5. **用户体验**: 丰富的交互功能和流畅的动画效果

这个架构不仅适用于演示文稿系统，也为类似的复杂前端应用提供了很好的参考和借鉴价值。