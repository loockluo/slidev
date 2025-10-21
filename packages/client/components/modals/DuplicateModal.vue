<script setup lang="ts">
import type { Presentation } from '../../types/presentation'

interface Props {
  isOpen: boolean
  presentation: Presentation | null
}

interface Emits {
  (e: 'close'): void
  (e: 'duplicate', data: { title: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive form data
const form = ref({
  title: '',
})

// Loading and error states
const loading = ref(false)
const error = ref('')

// Methods
function close() {
  if (!loading.value) {
    emit('close')
    resetForm()
  }
}

async function handleSubmit() {
  if (!form.value.title.trim()) {
    error.value = '请输入新演示文稿的标题'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await emit('duplicate', {
      title: form.value.title.trim(),
    })
    close()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '复制演示文稿失败，请稍后重试'
    console.error('Duplicate presentation error:', err)
  }
  finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    title: '',
  }
  error.value = ''
}

// Set default title when presentation changes
watch(() => props.presentation, (presentation) => {
  if (presentation) {
    form.value.title = `${presentation.title} - 副本`
  }
})

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.presentation) {
    form.value.title = `${props.presentation.title} - 副本`
  }
  if (!isOpen) {
    resetForm()
  }
})
</script>

<template>
  <teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="close" />

        <!-- Modal panel -->
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <!-- Close button -->
          <button
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            @click="close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Modal content -->
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              复制演示文稿
            </h2>

            <!-- Original presentation info -->
            <div v-if="presentation" class="mb-4 p-3 bg-gray-50 rounded-md">
              <p class="text-sm text-gray-600">
                <span class="font-medium">原演示文稿：</span> {{ presentation.title }}
              </p>
              <p v-if="presentation.description" class="text-sm text-gray-600 mt-1">
                <span class="font-medium">描述：</span> {{ presentation.description }}
              </p>
            </div>

            <form class="space-y-4" @submit.prevent="handleSubmit">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                  新标题 <span class="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入新演示文稿的标题"
                >
              </div>

              <!-- Error message -->
              <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">
                      复制失败
                    </h3>
                    <div class="mt-2 text-sm text-red-700">
                      {{ error }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  :disabled="loading"
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  @click="close"
                >
                  取消
                </button>
                <button
                  type="submit"
                  :disabled="loading || !form.title.trim()"
                  class="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <span v-if="loading">复制中...</span>
                  <span v-else>复制</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
