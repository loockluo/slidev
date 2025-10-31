<script setup lang="ts">
import type { SlideRoute } from '@slidev/types'
import { useHead } from '@unhead/vue'
import { useLocalStorage } from '@vueuse/core'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { createFixedClicks } from '../composables/useClicks'
import { useNav } from '../composables/useNav'
import { CLICKS_MAX } from '../constants'
import { slidesTitle } from '../env'
import IconButton from '../internals/IconButton.vue'
import NoteDisplay from '../internals/NoteDisplay.vue'
import SlideContainer from '../internals/SlideContainer.vue'
import SlideWrapper from '../internals/SlideWrapper.vue'
import { isColorSchemaConfigured, isDark, toggleDark } from '../logic/dark'

// 文章阅读宽度
const articleWidth = 800

useHead({ title: `Article - ${slidesTitle}` })

const { slides } = useNav()

const blocks: Map<number, HTMLElement> = reactive(new Map())
const activeSlideNo = ref(1)
const fontSize = useLocalStorage('slidev-article-font-size', 16)

// 为每个幻灯片创建独立的点击上下文
const clicksContextMap = new WeakMap<SlideRoute, any>()
function getClicksContext(route: SlideRoute) {
  if (!clicksContextMap.has(route))
    clicksContextMap.set(route, createFixedClicks(route, CLICKS_MAX))
  return clicksContextMap.get(route)!
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

// 字号调整
function increaseFontSize() {
  fontSize.value = Math.min(24, fontSize.value + 1)
}

function decreaseFontSize() {
  fontSize.value = Math.max(12, fontSize.value - 1)
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
            :title="`Slide ${idx + 1}${route.meta?.slide?.title ? `: ${route.meta.slide.title}` : ''}`"
            @click="scrollToSlide(idx)"
          >
            {{ idx + 1 }}
          </button>
        </div>
      </div>

      <!-- 底部工具栏 -->
      <div class="border-t border-main p-2 flex flex-col gap-1">
        <IconButton
          v-if="!isColorSchemaConfigured"
          :title="isDark ? 'Switch to light mode theme' : 'Switch to dark mode theme'"
          @click="toggleDark()"
        >
          <carbon-moon v-if="isDark" />
          <carbon-sun v-else />
        </IconButton>
        <IconButton title="Increase font size" @click="increaseFontSize">
          <div class="i-carbon:zoom-in" />
        </IconButton>
        <IconButton title="Decrease font size" @click="decreaseFontSize">
          <div class="i-carbon:zoom-out" />
        </IconButton>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="flex-1 ml-14 overflow-y-auto">
      <div class="max-w-full flex flex-col items-center py-10 px-4">
        <!-- 标题区域 -->
        <div class="w-full mb-10 text-center" :style="{ maxWidth: `${articleWidth}px` }">
          <h1 class="text-4xl font-bold mb-2">
            {{ slidesTitle }}
          </h1>
          <div class="text-sm op50">
            {{ slides.length }} slides
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
              class="border rounded-lg border-main overflow-hidden bg-main mb-6 shadow-lg"
              :style="{ width: '100%' }"
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

            <!-- 注释内容 -->
            <div
              v-if="route.meta?.slide?.note || route.meta?.slide?.noteHTML"
              class="prose dark:prose-invert max-w-none"
              :style="{ fontSize: `${fontSize}px` }"
            >
              <NoteDisplay
                :note="route.meta.slide.note"
                :note-html="route.meta.slide.noteHTML"
                :clicks-context="getClicksContext(route)"
                :placeholder="`No notes for slide ${idx + 1}`"
              />
            </div>
            <div
              v-else
              class="text-center py-8 op30 italic"
              :style="{ fontSize: `${fontSize}px` }"
            >
              No notes for this slide
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
            End of presentation
          </div>
        </div>
      </div>
    </main>

    <!-- 进度指示器 -->
    <div
      class="fixed top-0 left-14 right-0 h-1 bg-primary transition-all z-20"
      :style="{ width: `${(activeSlideNo / slides.length) * 100}%` }"
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
