<script setup lang="ts">
import { useErrorHandler } from '../composables/useErrorHandler'

const { currentError, clearError } = useErrorHandler()

function getErrorClasses(code: string | number): string {
  if (code === 'SUCCESS') {
    return 'bg-green-50 border border-green-200'
  }

  switch (code) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT_ERROR':
      return 'bg-yellow-50 border border-yellow-200'
    case 401:
    case 403:
      return 'bg-orange-50 border border-orange-200'
    default:
      return 'bg-red-50 border border-red-200'
  }
}

function isSuccess(): boolean {
  return currentError.value?.code === 'SUCCESS'
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString()
}
</script>

<template>
  <teleport to="body">
    <div
      v-if="currentError"
      class="fixed top-4 right-4 z-50 max-w-sm p-4 rounded-md shadow-lg transform transition-all duration-300"
      :class="[
        getErrorClasses(currentError.code),
      ]"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            v-if="isSuccess()"
            class="h-5 w-5 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg
            v-else
            class="h-5 w-5 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium" :class="isSuccess() ? 'text-green-800' : 'text-red-800'">
            {{ currentError.message }}
          </p>
          <p class="text-xs" :class="isSuccess() ? 'text-green-600' : 'text-red-600'">
            {{ formatTime(currentError.timestamp) }}
          </p>
        </div>
        <button
          class="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
          @click="clearError"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </teleport>
</template>
