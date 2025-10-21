# Slidev 后端 API 需求文档

## 1. 项目概述

本文档定义了 Slidev 后端 API 的完整需求，包括 PPT 管理功能和编辑功能的所有接口设计。

## 2. API 基础信息

### 2.1 基础配置
- **Base URL**: `/api`
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 2.2 通用响应格式
```typescript
interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
}
```

### 2.3 错误响应格式
```typescript
interface ErrorResponse {
  success: false
  message: string
  code: number
  details?: any
}
```

## 3. 文档管理 API

### 3.1 获取文档列表

**接口**: `GET /api/documents`

**功能**: 获取用户可访问的所有演示文稿列表

**查询参数**:
```typescript
interface PresentationsQuery {
  search?: string        // 搜索关键词
  filter?: 'all' | 'recent'  // 过滤类型
  sort?: 'title' | 'updated' | 'created' | 'opened'  // 排序字段
  order?: 'asc' | 'desc'  // 排序方向
  page?: number          // 页码（可选）
  limit?: number         // 每页数量（可选）
}
```

**后端实现逻辑**：
```typescript
async function getDocuments(req: Request) {
  const { search, filter, sort, order } = req.query

  let documents = await documentService.findByUserId(req.user.id)

  // 使用 @slidev/parser 解析内容获取元数据
  const presentations = documents.map(doc => {
    const parsed: SlidevMarkdown = parseSync(doc.content, 'temp.md')
    const firstSlide = parsed.slides[0]

    return {
      id: doc.id,
      title: firstSlide?.frontmatter.title || doc.title,
      description: doc.description,
      slideCount: parsed.slides.length,
      thumbnail: `/api/documents/${doc.id}/thumbnail`,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastOpened: doc.lastOpenedAt
    }
  })

  return presentations
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "presentations": [
      {
        "id": "1",
        "title": "Vue 3 最佳实践",
        "description": "关于 Vue 3 开发的最佳实践分享",
    "thumbnail": "/api/documents/1/thumbnail",
    "slideCount": 15,
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-20T00:00:00Z",
    "lastOpened": "2024-01-25T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

### 3.2 获取单个文档详情

**接口**: `GET /api/documents/:id`

**功能**: 获取指定演示文稿的详细信息

**后端实现逻辑**：
```typescript
async function getDocument(req: Request) {
  const document = await documentService.findById(req.params.id)

  if (!document) throw new NotFoundError('文档不存在')

  // 使用 @slidev/parser 解析
  const parsed: SlidevMarkdown = parseSync(document.content, 'temp.md')

  // 转换为前端需要的格式
  const slides = parsed.slides.map((slide: SourceSlideInfo, index: number) => ({
    no: index + 1,
    title: slide.title,
    content: slide.content,
    note: slide.note,
    frontmatter: slide.frontmatter
  }))

  return {
    id: document.id,
    title: document.title,
    description: document.description,
    slides,
    revision: document.revision,
    thumbnail: `/api/documents/${document.id}/thumbnail`,
    slideCount: slides.length,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    lastOpened: document.lastOpenedAt
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Vue 3 最佳实践",
    "description": "关于 Vue 3 开发的最佳实践分享",
    "thumbnail": "/api/documents/1/thumbnail",
    "slideCount": 15,
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-20T00:00:00Z",
    "lastOpened": "2024-01-25T00:00:00Z",
    "slides": [
      {
        "no": 1,
        "title": "封面",
        "content": "# Vue 3 最佳实践\n\n作者：张三",
        "note": "这是第一页的笔记"
      }
    ]
  }
}
```

### 3.3 删除文档

**接口**: `DELETE /api/documents/:id`

**功能**: 删除指定的演示文稿

**响应示例**:
```json
{
  "success": true,
  "message": "演示文稿删除成功"
}
```

### 3.4 获取文档缩略图

**接口**: `GET /api/documents/:id/thumbnail`

**功能**: 获取演示文稿的缩略图

**响应**: 图片文件（JPEG/PNG）

### 3.5 预览文档

**接口**: `GET /api/documents/:id/preview`

**功能**: 获取演示文稿的预览数据（前几页）

**查询参数**:
```typescript
interface PreviewQuery {
  count?: number  // 预览页数，默认3页
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Vue 3 最佳实践",
    "slides": [
      {
        "no": 1,
        "title": "封面",
        "content": "# Vue 3 最佳实践",
        "html": "<h1>Vue 3 最佳实践</h1>"
      }
    ]
  }
}
```

## 4. 幻灯片编辑功能 API

### 4.1 获取单个幻灯片信息

**接口**: `GET /api/documents/:doc_id/slides/:slide_no`

**功能**: 获取指定幻灯片的详细信息

**路径参数**:
- `doc_id`: 文档ID
- `slide_no`: 幻灯片编号

**后端实现逻辑**：
```typescript
async function getSlide(req: Request) {
  const { doc_id, slide_no } = req.params

  const document = await documentService.findById(doc_id)
  if (!document) throw new NotFoundError('文档不存在')

  // 使用 @slidev/parser 解析
  const parsed: SlidevMarkdown = parseSync(document.content, 'temp.md')
  const slideIndex = parseInt(slide_no) - 1

  if (slideIndex < 0 || slideIndex >= parsed.slides.length) {
    throw new NotFoundError('幻灯片不存在')
  }

  const slide: SourceSlideInfo = parsed.slides[slideIndex]

  return {
    index: slideIndex,
    no: slide_no,
    content: slide.content,
    note: slide.note,
    frontmatter: slide.frontmatter,
    frontmatterRaw: slide.frontmatterRaw,
    revision: document.revision
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "index": 1,
    "no": 1,
    "content": "# Vue 3 最佳实践\n\n这是第一页的内容",
    "note": "这是第一页的笔记",
    "frontmatter": {
      "layout": "cover",
      "title": "Vue 3 最佳实践"
    },
    "revision": "1"
  }
}
```

### 4.2 更新幻灯片内容

**接口**: `PUT /api/documents/:doc_id/slides/:slide_no`

**功能**: 更新指定幻灯片的内容

**请求体**:
```json
{
  "content": "# 更新后的标题\n\n更新后的内容",
  "note": "更新后的笔记",
  "frontmatterRaw": "layout: cover\ntitle: 更新后的标题",
  "frontmatter": {
    "layout": "cover",
    "title": "更新后的标题"
  }
}
```

**后端实现逻辑**：
```typescript
// 使用 @slidev/parser 的 SlidePatch 类型
import type { SlidePatch } from '@slidev/parser/core'

async function updateSlide(docId: string, slideNo: number, patch: SlidePatch) {
  const document = await documentService.findById(docId)

  // 解析当前内容
  const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')
  const slide = slidesData.slides[slideNo - 1]

  // 应用修改 - 使用与 Slidev 相同的逻辑
  if (patch.content !== undefined) {
    slide.content = patch.content
  }

  if (patch.frontmatterRaw !== undefined) {
    if (patch.frontmatterRaw.trim() === '') {
      slide.frontmatterDoc = slide.frontmatterStyle = undefined
      slide.frontmatter = {}
    } else {
      const parsed = YAML.parseDocument(patch.frontmatterRaw)
      if (parsed.errors.length > 0) {
        throw new ValidationError('frontmatter 格式错误')
      }
      slide.frontmatterDoc = parsed
      slide.frontmatter = parsed.toJSON() || {}
    }
  }

  if (patch.note !== undefined) {
    slide.note = patch.note
  }

  if (patch.frontmatter) {
    Object.assign(slide.frontmatter, patch.frontmatter)
  }

  // 使用 @slidev/parser 的 prettifySlide 格式化
  prettifySlide(slide)

  // 重新序列化整个文档
  const updatedContent = stringify(slidesData)
  const newRevision = hash(updatedContent.trim())

  // 保存到数据库
  await documentService.update(docId, {
    content: updatedContent,
    revision: newRevision
  })

  return { /* 返回更新后的数据 */ }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "index": 1,
    "no": 1,
    "content": "# 更新后的标题\n\n更新后的内容",
    "note": "更新后的笔记",
    "frontmatter": {
      "layout": "cover",
      "title": "更新后的标题"
    },
    "revision": "2"
  },
  "message": "幻灯片更新成功"
}
```

### 4.3 获取文档所有幻灯片

**接口**: `GET /api/documents/:doc_id/slides`

**功能**: 获取文档的所有幻灯片列表

**后端实现逻辑**：
```typescript
async function getDocumentSlides(docId: string) {
  const document = await documentService.findById(docId)

  if (!document) throw new NotFoundError('文档不存在')

  // 使用 @slidev/parser 直接解析
  const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')

  return slidesData.slides.map((slide: SourceSlideInfo, index: number) => ({
    index,
    no: index + 1,
    title: slide.title,
    note: slide.note,
    frontmatter: slide.frontmatter
  }))
}
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "index": 0,
      "no": 1,
      "title": "封面",
      "note": "这是第一页的笔记",
      "frontmatter": {
        "layout": "cover",
        "title": "Vue 3 最佳实践"
      }
    },
    {
      "index": 1,
      "no": 2,
      "title": "目录",
      "note": "这是第二页的笔记",
      "frontmatter": {
        "layout": "default"
      }
    }
  ]
}
```

### 4.4 批量更新幻灯片

**接口**: `PUT /api/documents/:doc_id/slides`

**功能**: 批量更新多个幻灯片，更新整个文档内容

**请求体**:
```json
{
  "slides": [
    {
      "no": 1,
      "content": "# 更新后的标题\n\n更新后的内容",
      "note": "更新后的笔记",
      "frontmatter": {
        "layout": "cover",
        "title": "更新后的标题"
      }
    },
    {
      "no": 2,
      "content": "# 第二页标题\n\n更新后的内容",
      "note": "更新后的笔记",
      "frontmatter": {
        "layout": "default"
      }
    }
  ],
  "revision": "3"
}
```

**后端实现逻辑**：
```typescript
async function updateSlides(docId: string, slides: SlideUpdate[], currentRevision: string) {
  const document = await documentService.findById(docId)

  // 版本检查
  if (document.revision !== currentRevision) {
    throw new ConflictError('文档已被修改，请刷新后重试')
  }

  // 使用 @slidev/parser 解析
  const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')

  // 应用批量更新
  for (const slideUpdate of slides) {
    const slideIndex = slideUpdate.no - 1
    if (slideIndex >= 0 && slideIndex < slidesData.slides.length) {
      const slide = slidesData.slides[slideIndex]

      if (slideUpdate.content !== undefined) {
        slide.content = slideUpdate.content
      }

      if (slideUpdate.note !== undefined) {
        slide.note = slideUpdate.note
      }

      if (slideUpdate.frontmatter) {
        Object.assign(slide.frontmatter, slideUpdate.frontmatter)
      }

      if (slideUpdate.frontmatterRaw !== undefined) {
        const parsed = YAML.parseDocument(slideUpdate.frontmatterRaw)
        if (parsed.errors.length === 0) {
          slide.frontmatterDoc = parsed
          slide.frontmatter = parsed.toJSON() || {}
        }
      }

      // 格式化
      prettifySlide(slide)
    }
  }

  // 序列化并保存
  const updatedContent = stringify(slidesData)
  const newRevision = hash(updatedContent.trim())

  await documentService.update(docId, {
    content: updatedContent,
    revision: newRevision
  })

  return {
    id: docId,
    revision: newRevision,
    content: updatedContent,
    slides: slides.map((s, idx) => ({
      ...s,
      frontmatter: slidesData.slides[idx]?.frontmatter,
      note: slidesData.slides[idx]?.note
    }))
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "doc_123",
    "revision": "3",
    "content": "---\nlayout: cover\ntitle: 更新后的标题\n---\n\n# 更新后的标题\n\n更新后的内容\n\n---\nlayout: default\n# 第二页标题\n\n更新后的内容",
    "slides": [
      {
        "no": 1,
        "title": "封面",
        "note": "更新后的笔记",
        "frontmatter": {
          "layout": "cover",
          "title": "更新后的标题"
        }
      }
    ]
  },
  "message": "文档更新成功"
}
```

## 5. 文档创建和复制 API

### 5.1 创建新文档

**接口**: `POST /api/documents`

**功能**: 创建新的演示文稿文档

**请求体**:
```json
{
  "title": "新演示文稿",
  "description": "演示文稿描述",
  "content": "# 标题\n\n第一页内容"
}
```

**后端实现逻辑**：
```typescript
async function createDocument(req: Request) {
  const { title, description, content } = req.body

  // 使用 @slidev/parser 验证和解析 Markdown
  const parsedSlides: SlidevMarkdown = await parse(content, 'temp.md')

  // 生成 revision（基于内容的哈希）
  const revision = hash(content.trim())

  // 保存到数据库
  const document = await documentService.create({
    title,
    description,
    content: stringify(parsedSlides),  // 使用 core 的 stringify
    revision,
    userId: req.user.id
  })

  return document
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "doc_123",
    "title": "新演示文稿",
    "description": "演示文稿描述",
    "createdAt": "2024-01-25T00:00:00Z"
  }
}
```

### 5.2 更新文档信息

**接口**: `PUT /api/documents/:doc_id`

**功能**: 更新文档的基本信息

**请求体**:
```json
{
  "title": "更新后的标题",
  "description": "更新后的描述"
}
```

### 5.3 复制文档

**接口**: `POST /api/documents/:doc_id/duplicate`

**功能**: 复制现有文档

**请求体**:
```json
{
  "title": "复制的演示文稿"
}
```

## 6. 用户相关 API

### 6.1 获取用户信息

**接口**: `GET /api/user/profile`

**功能**: 获取当前用户信息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "张三",
    "email": "zhangsan@example.com",
    "avatar": "/api/user/avatar"
  }
}
```

### 6.2 更新最近打开时间

**接口**: `POST /api/documents/:doc_id/open`

**功能**: 记录文档打开时间，用于"最近使用"排序

**响应示例**:
```json
{
  "success": true,
  "message": "打开时间已更新"
}
```

## 7. 数据库设计

### 7.1 数据库设计 (TypeORM + SQLite)

**Document 实体定义**：
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'text' })
  content: string              // 完整的 Markdown 内容（所有幻灯片）

  @Column({ type: 'varchar', length: 50 })
  userId: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string

  @Column({ type: 'varchar', length: 50, default: '1' })
  revision: string             // 版本号，用于并发控制

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ type: 'datetime', nullable: true })
  lastOpenedAt: Date

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date
}
```

**User 实体定义**：
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  username: string

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string

  @CreateDateColumn()
  createdAt: Date
}
```

### 7.2 JSON 内容格式说明

**完整文档存储格式**：
```json
{
  "id": "doc_123",
  "title": "Vue 3 最佳实践",
  "description": "关于 Vue 3 开发的最佳实践分享",
  "content": "---\ntitle: Vue 3 最佳实践\nlayout: cover\n---\n\n# 第一页内容\n\n这是第一页的详细内容\n\n---\n# 第二页标题\nlayout: default\n\n这是第二页的内容",
  "revision": "1",
  "user_id": "user_123",
  "thumbnail_url": "/api/documents/doc_123/thumbnail",
  "created_at": "2024-01-25T00:00:00Z",
  "updated_at": "2024-01-25T00:00:00Z",
  "last_opened_at": "2024-01-25T00:00:00Z"
}
```

**Markdown 内容处理逻辑**：

后端直接使用 `@slidev/parser` 库的核心方法，无需重新实现：

```typescript
// 导入 @slidev/parser 核心方法
import { parse, stringify, parseSlide, prettifySlide, SlidevMarkdown, SourceSlideInfo } from '@slidev/parser/core'

// 解析完整 Markdown 为幻灯片数组
const slidesData: SlidevMarkdown = await parse(markdownContent, 'temp.md')
const slides: SourceSlideInfo[] = slidesData.slides

// 将幻灯片数组序列化回完整 Markdown
const updatedMarkdown: string = stringify(slidesData)

// 解析单个幻灯片
const singleSlide = parseSlide(slideRawContent)

// 格式化幻灯片内容
prettifySlide(slideObject)
```

**API 实现示例**：

```typescript
// 获取文档所有幻灯片
async function getDocumentSlides(docId: string) {
  const document = await db.findById(docId)

  // 使用 @slidev/parser 直接解析
  const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')

  return slidesData.slides.map((slide: SourceSlideInfo, index: number) => ({
    no: index + 1,
    title: slide.title,
    content: slide.content,
    note: slide.note,
    frontmatter: slide.frontmatter
  }))
}

// 更新单个幻灯片
async function updateSlide(docId: string, slideNo: number, patch: SlidePatch) {
  const document = await db.findById(docId)

  // 解析当前内容
  const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')
  const slide = slidesData.slides[slideNo - 1]

  // 应用修改
  if (patch.content !== undefined) slide.content = patch.content
  if (patch.note !== undefined) slide.note = patch.note
  if (patch.frontmatter) Object.assign(slide.frontmatter, patch.frontmatter)

  // 格式化并重新序列化
  prettifySlide(slide)
  const updatedContent = stringify(slidesData)

  // 保存到数据库
  await db.update(docId, {
    content: updatedContent,
    revision: hash(updatedContent.trim())
  })
}
```

### 7.3 数据库配置

**TypeORM 配置示例**：
```typescript
import { DataSource } from 'typeorm'
import { Document } from './entities/Document'
import { User } from './entities/User'

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './database.sqlite',
  entities: [Document, User],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
})
```

**数据库服务示例**：
```typescript
import { Repository } from 'typeorm'
import { AppDataSource } from '../config/database'
import { Document } from '../entities/Document'

export class DocumentService {
  private documentRepository: Repository<Document>

  constructor() {
    this.documentRepository = AppDataSource.getRepository(Document)
  }

  async findById(id: string): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id, deletedAt: IsNull() }
    })
  }

  async findByUserId(userId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { updatedAt: 'DESC' }
    })
  }

  async create(data: Partial<Document>): Promise<Document> {
    const document = this.documentRepository.create(data)
    return this.documentRepository.save(document)
  }

  async update(id: string, data: Partial<Document>): Promise<void> {
    await this.documentRepository.update(id, data)
  }

  async softDelete(id: string): Promise<void> {
    await this.documentRepository.update(id, { deletedAt: new Date() })
  }
}
```

## 8. 技术实现要求

### 8.1 后端技术栈
- **语言**: Node.js / TypeScript
- **框架**: Express.js
- **数据库**: SQLite
- **ORM**: TypeORM
- **Markdown 处理**: `@slidev/parser` - Slidev 官方解析库

### 8.2 认证授权
- 使用 JWT Token 进行用户认证
- 支持基于角色的权限控制 (RBAC)
- API 密钥管理

### 8.3 内容处理
- **Markdown 解析和处理**: 直接使用 `@slidev/parser` 库的核心方法
  - `parse()` - 解析完整 Markdown 为幻灯片对象
  - `stringify()` - 将幻灯片对象序列化回 Markdown
  - `parseSlide()` - 解析单个幻灯片
  - `prettifySlide()` - 格式化幻灯片内容
- 缩略图生成和存储
- 图片处理和存储

### 8.4 性能要求
- API 响应时间 < 200ms
- 支持 1000+ 并发用户
- 数据库查询优化

## 9. 错误处理

### 9.1 HTTP 状态码
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `500` - 服务器内部错误

### 9.2 错误码定义
```typescript
enum ErrorCode {
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
  USER_ALREADY_EXISTS = 4002
}
```

## 10. 安全要求

### 10.1 输入验证
- 所有输入参数必须进行验证
- 防止 SQL 注入和 XSS 攻击
- 图片上传安全检查
- 内容安全过滤

### 10.2 权限控制
- 用户只能访问自己的文档
- API 接口权限验证
- 敏感操作日志记录

### 10.3 数据保护
- 敏感数据加密存储
- HTTPS 强制使用
- 定期数据备份

## 11. 部署要求

### 11.1 环境配置
- 开发环境 (development)
- 测试环境 (staging)
- 生产环境 (production)

### 11.2 监控和日志
- API 请求日志
- 错误监控和报警
- 性能指标监控

### 11.3 扩展性
- 支持水平扩展
- 数据库读写分离
- CDN 缓存支持

## 12. 开发计划

### 12.1 第一阶段 (基础功能)
- PPT 管理相关 API
- 用户认证
- 基础权限控制

### 12.2 第二阶段 (编辑功能)
- 幻灯片编辑 API
- 实时保存
- 冲突处理

### 12.3 第三阶段 (高级功能)
- 协作编辑
- 版本控制
- 高级搜索

---

**备注**: 本 API 需求文档会根据前端开发进展和用户反馈进行更新和调整。