<script setup lang="ts">
import type { Presentation } from '../../types/presentation'

interface Props {
  isOpen: boolean
  presentation: Presentation | null
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Loading and error states
const loading = ref(false)
const error = ref('')

// Methods
function close() {
  if (!loading.value) {
    emit('close')
    error.value = ''
  }
}

async function handleDelete() {
  loading.value = true
  error.value = ''

  try {
    await emit('confirm')
    close()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '删除演示文稿失败，请稍后重试'
    console.error('Delete presentation error:', err)
  }
  finally {
    loading.value = false
  }
}

// Reset error when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    error.value = ''
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
            <!-- Warning icon -->
            <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.734-.833-2.464 0L3.34 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h2 class="text-xl font-semibold text-gray-900 mb-2 text-center">
              删除演示文稿
            </h2>

            <!-- Presentation info -->
            <div v-if="presentation" class="mb-4 text-center">
              <p class="text-lg font-medium text-gray-900">
                {{ presentation.title }}
              </p>
              <p v-if="presentation.description" class="text-sm text-gray-600 mt-1">
                {{ presentation.description }}
              </p>
            </div>

            <p class="text-gray-600 text-center mb-6">
              此操作不可恢复，确定要删除这个演示文稿吗？
            </p>

            <!-- Error message -->
            <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    删除失败
                  </h3>
                  <div class="mt-2 text-sm text-red-700">
                    {{ error }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex justify-center space-x-3">
              <button
                type="button"
                :disabled="loading"
                class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                @click="close"
              >
                取消
              </button>
              <button
                type="button"
                :disabled="loading"
                class="px-6 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                @click="handleDelete"
              >
                <span v-if="loading">删除中...</span>
                <span v-else>确认删除</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
