<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { useHead } from '@unhead/vue'
import { useLocalStorage } from '@vueuse/core'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { createFixedClicks } from '../composables/useClicks'
import { useNav } from '../composables/useNav'
import { useDynamicSlideInfo } from '../composables/useSlideInfo'
import { CLICKS_MAX } from '../constants'
import { slidesTitle } from '../env'
import { editorHeight, editorWidth, isEditorVertical, showEditor } from '../state'
import IconButton from '../internals/IconButton.vue'
import NoteDisplay from '../internals/NoteDisplay.vue'
import NoteEditable from '../internals/NoteEditable.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import SlideWrapper from '../internals/SlideWrapper.vue'
import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'
import ClicksSlider from '../internals/ClicksSlider.vue'
import SideEditor from '../internals/SideEditor.vue'

// 文章阅读宽度
const articleWidth = 800

useHead({ title: `Article - ${slidesTitle}` })

const { slides, openInEditor } = useNav()

const blocks: Map<number, HTMLElement> = reactive(new Map())
const activeSlideNo = ref(1)
const editorSlideNo = ref(1) // 编辑器当前显示的幻灯片编号
const edittingNote = ref<number | null>(null) // 参考 overview 页面
const fontSize = useLocalStorage('slidev-article-font-size', 16)

// 为每个幻灯片创建独立的点击上下文
const clicksContextMap = new WeakMap<SlideRoute, any>()
function getClicksContext(route: SlideRoute) {
  if (!clicksContextMap.has(route))
    clicksContextMap.set(route, createFixedClicks(route, CLICKS_MAX))
  return clicksContextMap.get(route)!
}

// 获取幻灯片的点击次数
function getSlideClicks(route: SlideRoute) {
  return route.meta?.clicks || getClicksContext(route)?.total
}

// 参考 overview 页面的方法，直接为每个幻灯片创建 useDynamicSlideInfo
const slideInfoMap = new Map<number, ReturnType<typeof useDynamicSlideInfo>>()

function getSlideInfo(route: SlideRoute) {
  if (!slideInfoMap.has(route.no)) {
    const info = useDynamicSlideInfo(route.no)
    slideInfoMap.set(route.no, info)
  }
  return slideInfoMap.get(route.no)!
}

// 检测哪个幻灯片在视口中
function checkActiveSlide() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const windowHeight = window.innerHeight

  let activeNo = 1
  Array.from(blocks.entries()).forEach(([idx, el]) => {
    const rect = el.getBoundingClientRect()
    const elementTop = rect.top + scrollTop

    // 如果元素在视口上半部分，则认为它是当前活动幻灯片
    if (scrollTop >= elementTop - windowHeight / 3)
      activeNo = idx + 1
  })

  activeSlideNo.value = activeNo
}

// 滚动到指定幻灯片
function scrollToSlide(idx: number) {
  const el = blocks.get(idx)
  if (el)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 处理点击幻灯片打开编辑器
function onSlideClick(route: SlideRoute) {
  // 设置当前幻灯片为活动状态
  activeSlideNo.value = route.no
  // 设置编辑器显示的幻灯片
  editorSlideNo.value = route.no
  // 显示编辑器
  showEditor.value = true
  // 滚动到对应幻灯片
  scrollToSlide(route.no - 1)
}


onMounted(() => {
  nextTick(() => {
    checkActiveSlide()
  })
  window.addEventListener('scroll', checkActiveSlide)
})
</script>

<template>
  <div class="h-screen w-screen flex bg-main">
    <!-- 左侧导航栏 -->
    <nav class="fixed left-0 top-0 bottom-0 w-14 border-r border-main select-none bg-main z-10 flex flex-col">
      <div class="flex-auto overflow-y-auto overflow-x-hidden py-2">
        <div
          v-for="(route, idx) of slides"
          :key="route.no"
          class="flex items-center justify-center"
        >
          <button
            class="relative transition duration-300 w-10 h-10 rounded-full hover:bg-active hover:op100 my-0.5"
            :class="activeSlideNo === idx + 1 ? 'op100 text-primary bg-primary/10 font-bold' : 'op40'"
            :title="`幻灯片 ${idx + 1}${route.meta?.slide?.title ? `: ${route.meta.slide.title}` : ''}`"
            @click="onSlideClick(route)"
          >
            {{ idx + 1 }}
          </button>
        </div>
      </div>

      <!-- 底部工具栏 -->
      <div class="border-t border-main p-2 flex flex-col gap-1">
        <IconButton
          v-if="!isColorSchemaConfigured"
          :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleDark()"
        >
          <carbon-moon v-if="isDark" />
          <carbon-sun v-else />
        </IconButton>
    
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="flex-1 ml-14 overflow-y-auto" :class="showEditor ? 'mr-18' : ''">
      <div class="max-w-full flex flex-col items-center py-10 px-4">
        <!-- 标题区域 -->
        <div class="w-full mb-10 text-center" :style="{ maxWidth: `${articleWidth}px` }">
          <h1 class="text-4xl font-bold mb-2">
            {{ slidesTitle }}
          </h1>
          <div class="text-sm op50">
            共 {{ slides.length }} 页幻灯片
          </div>
        </div>

        <!-- 文章式内容 -->
        <article class="w-full" :style="{ maxWidth: `${articleWidth}px` }">
          <section
            v-for="(route, idx) of slides"
            :key="route.no"
            :ref="el => blocks.set(idx, el as any)"
            class="mb-16 slide-section"
          >
            <!-- 幻灯片序号和标题 -->
            <div class="mb-4">
              <div class="flex items-center gap-3">
                <div class="text-primary text-2xl font-bold">
                  {{ idx + 1 }}
                </div>
                <h2 v-if="route.meta?.slide?.title" class="text-2xl font-semibold">
                  {{ route.meta.slide.title }}
                </h2>
              </div>
            </div>

            <!-- 幻灯片预览 -->
            <div
              class="border rounded-lg border-main overflow-hidden bg-main mb-6 shadow-lg cursor-pointer hover:border-primary transition-all"
              :class="[
                activeSlideNo === route.no ? 'border-primary ring-2 ring-primary/20' : '',
                showEditor && activeSlideNo === route.no ? 'scale-105 shadow-xl' : ''
              ]"
              :style="{ width: '100%' }"
              @click="onSlideClick(route)"
              title="点击打开编辑器"
            >
              <SlideContainer
                :key="route.no"
                :width="articleWidth"
                class="pointer-events-none"
              >
                <SlideWrapper
                  :clicks-context="getClicksContext(route)"
                  :route="route"
                  render-context="overview"
                />
              </SlideContainer>
            </div>

            <!-- Clicks 控制器 -->
            <div v-if="getSlideClicks(route)" class="mb-6">
              <ClicksSlider
                :clicks-context="getClicksContext(route)"
                :active="true"
                class="w-full"
              />
            </div>

            <!-- 注释内容 -->
            <div class="flex gap-4">
              <div
                v-if="getSlideInfo(route).info.value?.note || route.meta?.slide?.noteHTML || edittingNote === route.no"
                class="flex-1 prose dark:prose-invert max-w-none"
                :style="{ fontSize: `${fontSize}px` }"
              >
                <!-- 如果正在编辑，使用 NoteEditable，否则使用 NoteDisplay -->
                <NoteEditable
                  v-if="edittingNote === route.no"
                  :no="route.no"
                  :auto-height="true"
                  :highlight="true"
                  :editing="edittingNote === route.no"
                  :clicks-context="getClicksContext(route)"
                  :placeholder="`幻灯片 ${idx + 1} 没有注释`"
                  @update:editing="edittingNote = null"
                />
                <NoteDisplay
                  v-else
                  :note="getSlideInfo(route).info.value?.note"
                  :note-html="route.meta.slide.noteHTML"
                  :clicks-context="getClicksContext(route)"
                  :placeholder="`幻灯片 ${idx + 1} 没有注释`"
                />
              </div>
              <!-- 编辑按钮 -->
              <div class="py3 mt-0.5 mr--8 ml--4 op0 transition group-hover:op100">
                <IconButton
                  title="Edit Note"
                  class="rounded-full w-9 h-9 text-sm"
                  :class="edittingNote === route.no ? 'important:op0' : ''"
                  @click="edittingNote = route.no"
                >
                  <div class="i-carbon:pen" />
                </IconButton>
              </div>
            </div>
            <div
              v-if="!getSlideInfo(route).info.value?.note && !route.meta?.slide?.noteHTML && edittingNote !== route.no"
              class="text-center py-8 op30 italic"
              :style="{ fontSize: `${fontSize}px` }"
            >
              幻灯片 {{ idx + 1 }} 没有注释
            </div>

            <!-- 分隔线 -->
            <div v-if="idx < slides.length - 1" class="mt-12 border-b border-main op20" />
          </section>
        </article>

        <!-- 结束标记 -->
        <div class="text-center py-10 op50">
          <div class="text-2xl mb-2">
            ✨
          </div>
          <div class="text-sm">
            演示文稿结束
          </div>
        </div>
      </div>
      </main>

    <!-- 进度指示器 -->
    <div
      class="fixed top-0 left-14 right-0 h-1 bg-primary transition-all z-20"
      :style="{ width: `${(activeSlideNo / slides.length) * 100}%` }"
    />

    <!-- SideEditor 组件 -->
    <SideEditor
      v-if="showEditor"
      :resize="true"
      :slide-no="editorSlideNo"
    />
  </div>
</template>

<style scoped>
.slide-section {
  scroll-margin-top: 2rem;
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 优化文章阅读体验 */
article {
  line-height: 1.8;
}

/* 注释样式优化 */
.prose {
  @apply text-main;
}

.prose :deep(h1) {
  @apply text-2xl font-bold mt-6 mb-4;
}

.prose :deep(h2) {
  @apply text-xl font-bold mt-5 mb-3;
}

.prose :deep(h3) {
  @apply text-lg font-semibold mt-4 mb-2;
}

.prose :deep(p) {
  @apply mb-4;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply mb-4 pl-6;
}

.prose :deep(li) {
  @apply mb-2;
}

.prose :deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm;
}

.prose :deep(pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 overflow-x-auto;
}

.prose :deep(blockquote) {
  @apply border-l-4 border-primary pl-4 italic my-4;
}

.prose :deep(a) {
  @apply text-primary underline hover:op80;
}
</style>
