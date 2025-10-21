// 演示文稿相关类型定义

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

export interface ErrorResponse {
  success: false
  message: string
  code: number
  details?: any
}

// 查询参数类型
export interface PresentationsQuery {
  search?: string
  filter?: 'all' | 'recent'
  sort?: 'title' | 'updated' | 'created' | 'opened'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PreviewQuery {
  count?: number
}

// 演示文稿类型
export interface Presentation {
  id: string
  title: string
  description?: string
  thumbnail?: string
  slideCount: number
  createdAt: string
  updatedAt: string
  lastOpened?: string
}

export interface PresentationDetail extends Presentation {
  slides: SlideData[]
  revision: string
}

// 幻灯片数据类型
export interface SlideData {
  no: number
  title?: string
  content: string
  note?: string
  frontmatter: Record<string, any>
  frontmatterRaw?: string
  index?: number
}

// 幻灯片更新数据
export interface SlideUpdate {
  no: number
  content?: string
  note?: string
  frontmatter?: Record<string, any>
  frontmatterRaw?: string
}

// 批量幻灯片更新请求
export interface UpdateSlidesRequest {
  slides: SlideUpdate[]
  revision: string
}

// 幻灯片补丁类型（用于单个幻灯片更新）
export interface SlidePatch {
  content?: string
  note?: string
  frontmatter?: Record<string, any>
  frontmatterRaw?: string
}

// 创建文档请求
export interface CreateDocumentRequest {
  title: string
  description?: string
  content: string
}

// 更新文档信息请求
export interface UpdateDocumentRequest {
  title?: string
  description?: string
}

// 复制文档请求
export interface DuplicateDocumentRequest {
  title: string
}

// 用户信息
export interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
}

// 错误码枚举
export enum ErrorCode {
  // 通用错误
  INTERNAL_ERROR = 1000,
  INVALID_REQUEST = 1001,
  UNAUTHORIZED = 1002,
  FORBIDDEN = 1003,
  NOT_FOUND = 1004,

  // 文档相关错误
  DOCUMENT_NOT_FOUND = 2001,
  DOCUMENT_ACCESS_DENIED = 2002,
  DOCUMENT_DELETE_FAILED = 2003,

  // 幻灯片相关错误
  SLIDE_NOT_FOUND = 3001,
  SLIDE_UPDATE_FAILED = 3002,

  // 用户相关错误
  USER_NOT_FOUND = 4001,
  USER_ALREADY_EXISTS = 4002,
}

// API响应数据类型
export interface PresentationsResponse {
  presentations: Presentation[]
  total: number
  page: number
  limit: number
}

export interface SlideResponse extends SlideData {
  revision: string
}

export interface UpdateSlideResponse extends SlideResponse {
  message?: string
}

export interface UpdateSlidesResponse {
  id: string
  revision: string
  content: string
  slides: SlideData[]
  message?: string
}
