import type {
  CreateDocumentRequest,
  DuplicateDocumentRequest,
  Presentation,
  PresentationDetail,
  PresentationsQuery,
  PresentationsResponse,
  PreviewQuery,
  SlideData,
  SlidePatch,
  UpdateDocumentRequest,
  UpdateSlidesRequest,
  UserInfo,
} from '../types/presentation'

class PresentationAPI {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status,
        }))

        // Create error with status code for better error handling
        const error = new Error(errorData.message || `HTTP ${response.status}`)
        ;(error as any).code = response.status
        ;(error as any).details = errorData.details

        throw error
      }

      const data = await response.json()

      // 处理API响应格式
      if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
          const error = new Error(data.message || 'API request failed')
          ;(error as any).code = data.code || 'API_ERROR'
          ;(error as any).details = data.details
          throw error
        }
        return data.data
      }

      return data
    }
    catch (error) {
      console.error(`API request failed: ${endpoint}`, error)

      // Handle network errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          ;(error as any).code = 'NETWORK_ERROR'
        }
        else if (error.message.includes('timeout')) {
          ;(error as any).code = 'TIMEOUT_ERROR'
        }
      }

      throw error
    }
  }

  // 文档管理相关API
  async getPresentations(query?: PresentationsQuery): Promise<PresentationsResponse> {
    const params = new URLSearchParams()

    if (query?.search)
      params.append('search', query.search)
    if (query?.filter)
      params.append('filter', query.filter)
    if (query?.sort)
      params.append('sort', query.sort)
    if (query?.order)
      params.append('order', query.order)
    if (query?.page)
      params.append('page', query.page.toString())
    if (query?.limit)
      params.append('limit', query.limit.toString())

    const queryString = params.toString()
    return this.request<PresentationsResponse>(`/documents${queryString ? `?${queryString}` : ''}`)
  }

  async getPresentation(docId: string): Promise<PresentationDetail> {
    return this.request<PresentationDetail>(`/documents/${docId}`)
  }

  async createDocument(data: CreateDocumentRequest): Promise<Presentation> {
    return this.request<Presentation>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDocument(docId: string, data: UpdateDocumentRequest): Promise<void> {
    return this.request<void>(`/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletePresentation(docId: string): Promise<void> {
    return this.request<void>(`/documents/${docId}`, {
      method: 'DELETE',
    })
  }

  async duplicateDocument(docId: string, data: DuplicateDocumentRequest): Promise<Presentation> {
    return this.request<Presentation>(`/documents/${docId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getDocumentPreview(docId: string, query?: PreviewQuery): Promise<PresentationDetail> {
    const params = new URLSearchParams()
    if (query?.count)
      params.append('count', query.count.toString())

    const queryString = params.toString()
    return this.request<PresentationDetail>(`/documents/${docId}/preview${queryString ? `?${queryString}` : ''}`)
  }

  async recordDocumentOpen(docId: string): Promise<void> {
    return this.request<void>(`/documents/${docId}/open`, {
      method: 'POST',
    })
  }

  // 幻灯片相关API
  async getSlides(docId: string): Promise<SlideData[]> {
    return this.request<SlideData[]>(`/documents/${docId}/slides`)
  }

  async getSlide(docId: string, slideNo: number): Promise<SlideData> {
    return this.request<SlideData>(`/documents/${docId}/slides/${slideNo}`)
  }

  async updateSlide(docId: string, slideNo: number, patch: SlidePatch): Promise<SlideData> {
    return this.request<SlideData>(`/documents/${docId}/slides/${slideNo}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    })
  }

  async updateSlides(docId: string, data: UpdateSlidesRequest): Promise<SlideData[]> {
    return this.request<SlideData[]>(`/documents/${docId}/slides`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 用户相关API
  async getUserProfile(): Promise<UserInfo> {
    return this.request<UserInfo>('/user/profile')
  }

  // 工具方法
  getThumbnailUrl(docId: string): string {
    return `${this.baseURL}/documents/${docId}/thumbnail`
  }

  getAvatarUrl(): string {
    return `${this.baseURL}/user/avatar`
  }
}

// 创建全局API实例
export const presentationAPI = new PresentationAPI()

// 导出类型
export type { PresentationAPI }
