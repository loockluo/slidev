import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

export interface ErrorInfo {
  code: string | number
  message: string
  details?: any
  timestamp: Date
}

export function useErrorHandler() {
  const router = useRouter()
  const errors = ref<ErrorInfo[]>([])
  const currentError = ref<ErrorInfo | null>(null)

  // Computed properties
  const hasErrors = computed(() => errors.value.length > 0)
  const hasCurrentError = computed(() => !!currentError.value)

  // Error handling methods
  function handleError(error: unknown, context?: string) {
    const errorInfo: ErrorInfo = {
      code: 'UNKNOWN',
      message: '发生未知错误',
      timestamp: new Date(),
    }

    if (error instanceof Error) {
      errorInfo.message = error.message
      errorInfo.code = (error as any).code || 'UNKNOWN_ERROR'
    }
    else if (typeof error === 'string') {
      errorInfo.message = error
      errorInfo.code = 'STRING_ERROR'
    }
    else if (typeof error === 'object' && error !== null) {
      errorInfo.message = (error as any).message || '发生未知错误'
      errorInfo.code = (error as any).code || (error as any).status || 'OBJECT_ERROR'
      errorInfo.details = (error as any).details
    }

    // Add context to error message
    if (context) {
      errorInfo.message = `${context}: ${errorInfo.message}`
    }

    // Add to errors list
    errors.value.unshift(errorInfo)

    // Keep only last 50 errors
    if (errors.value.length > 50) {
      errors.value = errors.value.slice(0, 50)
    }

    // Set as current error
    currentError.value = errorInfo

    // Log error
    console.error('Error handled:', errorInfo, error)

    return errorInfo
  }

  function handleApiError(error: unknown, context?: string) {
    const errorInfo = handleError(error, context)

    // Specific handling for API errors
    if (typeof errorInfo.code === 'number') {
      switch (errorInfo.code) {
        case 401:
          // Unauthorized - redirect to login or show login modal
          showError('请先登录后再试')
          break
        case 403:
          // Forbidden - show permission error
          showError('您没有权限执行此操作')
          break
        case 404:
          // Not found - show not found error
          showError('请求的资源不存在')
          break
        case 409:
          // Conflict - show conflict error
          showError('数据已被修改，请刷新后重试')
          break
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          showError('服务器错误，请稍后重试')
          break
        default:
          showError(errorInfo.message)
      }
    }
    else {
      showError(errorInfo.message)
    }

    return errorInfo
  }

  function clearError() {
    currentError.value = null
  }

  function clearErrors() {
    errors.value = []
    currentError.value = null
  }

  function showError(message: string, code: string | number = 'SHOW_ERROR') {
    const errorInfo: ErrorInfo = {
      code,
      message,
      timestamp: new Date(),
    }

    currentError.value = errorInfo
    errors.value.unshift(errorInfo)

    if (errors.value.length > 50) {
      errors.value = errors.value.slice(0, 50)
    }

    // Auto-hide success/error messages after 5 seconds
    if (code !== 'SHOW_ERROR') {
      setTimeout(() => {
        if (currentError.value?.code === code) {
          clearError()
        }
      }, 5000)
    }
  }

  function showSuccess(message: string) {
    // For success messages, we can use the same error system but with different styling
    showError(message, 'SUCCESS')
  }

  function handlePresentationError(error: unknown, presentationId?: string) {
    const errorInfo = handleApiError(error, '演示文稿操作失败')

    // Specific handling for presentation errors
    if (errorInfo.code === 404 && presentationId) {
      // Presentation not found, redirect to manage page
      router.push('/manage')
    }
    else if (errorInfo.code === 403) {
      // Permission denied
      showError('您没有权限访问此演示文稿')
    }

    return errorInfo
  }

  function handleSlideError(error: unknown, context?: string) {
    return handleApiError(error, context || '幻灯片操作失败')
  }

  function handleNetworkError(error: unknown) {
    const errorInfo = handleError(error, '网络连接失败')

    // Check if it's a network error
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        showError('网络连接失败，请检查您的网络连接')
      }
      else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        showError('请求超时，请稍后重试')
      }
      else {
        showError('网络错误，请稍后重试')
      }
    }
    else {
      showError('网络连接失败，请稍后重试')
    }

    return errorInfo
  }

  function handleValidationError(error: unknown, context?: string) {
    const errorInfo = handleError(error, context || '数据验证失败')
    showError(errorInfo.message, 'VALIDATION_ERROR')
    return errorInfo
  }

  function isRetryableError(error: ErrorInfo): boolean {
    // Determine if an error is retryable
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR']
    return retryableCodes.includes(error.code as string)
      || (typeof error.code === 'number' && error.code >= 500 && error.code < 600)
  }

  function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
    asyncFunction: T,
    maxRetries: number = 3,
    delay: number = 1000,
  ): T {
    return (async (...args: Parameters<T>) => {
      let lastError: ErrorInfo | null = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await asyncFunction(...args)
        }
        catch (error) {
          const errorInfo = handleError(error, `重试第 ${attempt} 次`)
          lastError = errorInfo

          // Don't retry on non-retryable errors
          if (!isRetryableError(errorInfo)) {
            throw error
          }

          // Don't wait after the last attempt
          if (attempt < maxRetries) {
            // Exponential backoff
            const waitTime = delay * 2 ** (attempt - 1)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }
      }

      // Throw the last error if all retries failed
      if (lastError) {
        throw new Error(lastError.message)
      }
    }) as T
  }

  return {
    // State
    errors: computed(() => errors.value),
    currentError: computed(() => currentError.value),
    hasErrors,
    hasCurrentError,

    // Methods
    handleError,
    handleApiError,
    handlePresentationError,
    handleSlideError,
    handleNetworkError,
    handleValidationError,
    clearError,
    clearErrors,
    showError,
    showSuccess,
    isRetryableError,
    createRetryWrapper,
  }
}
