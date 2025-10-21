<script setup lang="ts">
import type { Presentation, PresentationsQuery } from '../types/presentation'
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
// Components (these would be created separately)
import CreateModal from '../components/modals/CreateModal.vue'

import DeleteConfirmation from '../components/modals/DeleteConfirmation.vue'
import DuplicateModal from '../components/modals/DuplicateModal.vue'
import { usePresentationStore } from '../stores/presentation'

const router = useRouter()
const store = usePresentationStore()

// Reactive data
const searchQuery = ref('')
const filterType = ref<'all' | 'recent'>('all')
const sortBy = ref<PresentationsQuery['sort']>('updated')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Modal states
const showCreateModal = ref(false)
const showDuplicateModal = ref(false)
const showDeleteModal = ref(false)
const selectedPresentation = ref<Presentation | null>(null)

// Action menu
const actionMenuId = ref<string | null>(null)

// Computed properties
const { presentations, listLoading, listError, hasPresentations } = store

// Methods
async function loadPresentations() {
  try {
    await store.loadPresentations({
      search: searchQuery.value,
      filter: filterType.value,
      sort: sortBy.value,
      order: sortOrder.value,
    })
  }
  catch (error) {
    console.error('Failed to load presentations:', error)
  }
}

// Debounced search
let searchTimeout: NodeJS.Timeout
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadPresentations()
  }, 300)
}

function openPresentation(presentationId: string) {
  router.push(`/${presentationId}`)
}

function showActionMenu(presentationId: string) {
  actionMenuId.value = presentationId
  nextTick(() => {
    // Auto close menu after 5 seconds
    setTimeout(() => {
      if (actionMenuId.value === presentationId) {
        actionMenuId.value = null
      }
    }, 5000)
  })
}

function closeActionMenu() {
  actionMenuId.value = null
}

async function duplicatePresentation(presentation: Presentation) {
  selectedPresentation.value = presentation
  showDuplicateModal.value = true
  closeActionMenu()
}

async function deletePresentation(presentation: Presentation) {
  selectedPresentation.value = presentation
  showDeleteModal.value = true
  closeActionMenu()
}

async function handleCreatePresentation(data: { title: string, description?: string }) {
  try {
    const presentation = await store.createPresentation({
      title: data.title,
      description: data.description || '',
      content: `# ${data.title}\n\n创建于 ${new Date().toLocaleDateString()}`,
    })

    showCreateModal.value = false
    router.push(`/${presentation.id}`)
  }
  catch (error) {
    console.error('Failed to create presentation:', error)
    // Show error notification
  }
}

async function handleDuplicatePresentation(data: { title: string }) {
  if (!selectedPresentation.value)
    return

  try {
    const presentation = await store.duplicatePresentation(
      selectedPresentation.value.id,
      { title: data.title },
    )

    showDuplicateModal.value = false
    selectedPresentation.value = null
    router.push(`/${presentation.id}`)
  }
  catch (error) {
    console.error('Failed to duplicate presentation:', error)
    // Show error notification
  }
}

async function handleDeletePresentation() {
  if (!selectedPresentation.value)
    return

  try {
    await store.deletePresentation(selectedPresentation.value.id)
    showDeleteModal.value = false
    selectedPresentation.value = null
  }
  catch (error) {
    console.error('Failed to delete presentation:', error)
    // Show error notification
  }
}

function handleThumbnailError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Lifecycle
onMounted(() => {
  loadPresentations()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              演示文稿管理
            </h1>
            <p class="mt-2 text-gray-600">
              管理您的所有演示文稿
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <button
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="showCreateModal = true"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              新建演示文稿
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索演示文稿..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                @input="debouncedSearch"
              >
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <select
              v-model="filterType"
              class="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              @change="loadPresentations"
            >
              <option value="all">
                全部
              </option>
              <option value="recent">
                最近使用
              </option>
            </select>
            <select
              v-model="sortBy"
              class="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              @change="loadPresentations"
            >
              <option value="updated">
                修改时间
              </option>
              <option value="created">
                创建时间
              </option>
              <option value="title">
                标题
              </option>
              <option value="opened">
                打开时间
              </option>
            </select>
            <select
              v-model="sortOrder"
              class="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              @change="loadPresentations"
            >
              <option value="desc">
                降序
              </option>
              <option value="asc">
                升序
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="listLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <span class="ml-3 text-gray-600">加载中...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="listError" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              加载失败
            </h3>
            <div class="mt-2 text-sm text-red-700">
              {{ listError }}
            </div>
            <div class="mt-4">
              <button
                class="text-sm font-medium text-red-600 hover:text-red-500"
                @click="loadPresentations"
              >
                重新加载
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasPresentations" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          暂无演示文稿
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          开始创建您的第一个演示文稿吧
        </p>
        <div class="mt-6">
          <button
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="showCreateModal = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            新建演示文稿
          </button>
        </div>
      </div>

      <!-- Presentations Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="presentation in presentations"
          :key="presentation.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          <!-- Thumbnail -->
          <div class="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
            <img
              v-if="presentation.thumbnail"
              :src="presentation.getThumbnailUrl?.(presentation.id) || `/api/documents/${presentation.id}/thumbnail`"
              :alt="presentation.title"
              class="w-full h-full object-cover"
              @error="handleThumbnailError"
            >
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <div class="text-center">
                <svg class="mx-auto h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">
                  {{ presentation.slideCount }} 页
                </p>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4">
            <h3 class="font-medium text-gray-900 truncate">
              {{ presentation.title }}
            </h3>
            <p v-if="presentation.description" class="mt-1 text-sm text-gray-500 line-clamp-2">
              {{ presentation.description }}
            </p>

            <div class="mt-3 flex items-center justify-between">
              <div class="text-xs text-gray-400">
                更新于 {{ formatDate(presentation.updatedAt) }}
              </div>
              <div class="flex items-center space-x-1">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {{ presentation.slideCount }} 页
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex justify-between">
              <button
                class="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                @click="openPresentation(presentation.id)"
              >
                打开
              </button>
              <div class="ml-2 relative">
                <button
                  class="p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="showActionMenu(presentation.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="actionMenuId === presentation.id"
                  v-click-outside="closeActionMenu"
                  class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                >
                  <div class="py-1">
                    <button
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      @click="duplicatePresentation(presentation)"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      复制
                    </button>
                    <button
                      class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      @click="deletePresentation(presentation)"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <CreateModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @create="handleCreatePresentation"
    />

    <!-- Duplicate Modal -->
    <DuplicateModal
      v-if="showDuplicateModal"
      :presentation="selectedPresentation"
      @close="showDuplicateModal = false"
      @duplicate="handleDuplicatePresentation"
    />

    <!-- Delete Confirmation -->
    <DeleteConfirmation
      v-if="showDeleteModal"
      :presentation="selectedPresentation"
      @close="showDeleteModal = false"
      @confirm="handleDeletePresentation"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
