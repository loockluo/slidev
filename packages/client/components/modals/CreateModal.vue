<script setup lang="ts">
interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'create', data: { title: string, description?: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive form data
const form = ref({
  title: '',
  description: '',
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
    error.value = '请输入演示文稿标题'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await emit('create', {
      title: form.value.title.trim(),
      description: form.value.description.trim() || undefined,
    })
    close()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '创建演示文稿失败，请稍后重试'
    console.error('Create presentation error:', err)
  }
  finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    title: '',
    description: '',
  }
  error.value = ''
}

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
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
              新建演示文稿
            </h2>

            <form class="space-y-4" @submit.prevent="handleSubmit">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                  标题 <span class="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入演示文稿标题"
                >
              </div>

              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  id="description"
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入演示文稿描述（可选）"
                />
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
                      创建失败
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
                  <span v-if="loading">创建中...</span>
                  <span v-else>创建</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
