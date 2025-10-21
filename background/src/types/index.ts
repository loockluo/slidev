export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
  details?: any
}

export interface ErrorResponse {
  success: false
  message: string
  code: number
  details?: any
}

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

export interface SlidePatch {
  content?: string
  note?: string
  frontmatterRaw?: string
  frontmatter?: Record<string, any>
}

export interface SlideUpdate {
  no: number
  content?: string
  note?: string
  frontmatter?: Record<string, any>
  frontmatterRaw?: string
}

export interface BatchSlidesUpdate {
  slides: SlideUpdate[]
  revision: string
}

export interface CreateDocumentRequest {
  title: string
  description?: string
  content: string
}

export interface UpdateDocumentRequest {
  title?: string
  description?: string
}

export interface DuplicateDocumentRequest {
  title: string
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    username: string
    email: string
  }
}

export interface SlideInfo {
  index: number
  no: number
  title?: string
  content: string
  note?: string
  frontmatter: Record<string, any>
  frontmatterRaw?: string
}

export interface DocumentDetail {
  id: string
  title: string
  description?: string
  slideCount: number
  thumbnail: string
  slides: SlideInfo[]
  revision: string
  createdAt: Date
  updatedAt: Date
  lastOpened?: Date
}

export interface DocumentListItem {
  id: string
  title: string
  description?: string
  slideCount: number
  thumbnail: string
  createdAt: Date
  updatedAt: Date
  lastOpened?: Date
}

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
  DOCUMENT_CONFLICT = 2004,

  // 幻灯片相关错误
  SLIDE_NOT_FOUND = 3001,
  SLIDE_UPDATE_FAILED = 3002,
  SLIDE_INVALID_FORMAT = 3003,

  // 用户相关错误
  USER_NOT_FOUND = 4001,
  USER_ALREADY_EXISTS = 4002,
  INVALID_CREDENTIALS = 4003,

  // 解析相关错误
  PARSING_ERROR = 5001,
  FRONTMATTER_ERROR = 5002,
}

export interface JWTPayload {
  id: string
  username: string
  email: string
  iat?: number
  exp?: number
}
