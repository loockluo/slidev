import type { Request, Response } from 'express'
import type { APIResponse, PresentationsQuery, PreviewQuery } from '@/types'
import { DocumentService } from '@/services/DocumentService'
import { ErrorCode } from '@/types'

export class DocumentController {
  private documentService: DocumentService

  constructor() {
    this.documentService = new DocumentService()
  }

  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id
      const query = req.query as PresentationsQuery

      const documents = await this.documentService.searchDocuments(userId, query)

      const presentations = documents.map((doc) => {
        const { slideCount } = this.documentService.parseDocumentContent(doc)

        return {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          slideCount,
          thumbnail: `/api/documents/${doc.id}/thumbnail`,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          lastOpened: doc.lastOpenedAt,
        }
      })

      const response: APIResponse = {
        success: true,
        data: {
          presentations,
          total: presentations.length,
          page: 1,
          limit: 20,
        },
      }

      res.json(response)
    }
    catch (error) {
      console.error('获取文档列表失败:', error)
      const response: APIResponse = {
        success: false,
        message: '获取文档列表失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id

      const document = await this.documentService.findById(id)
      if (!document) {
        const response: APIResponse = {
          success: false,
          message: '文档不存在',
          code: ErrorCode.DOCUMENT_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      if (document.userId !== userId) {
        const response: APIResponse = {
          success: false,
          message: '无权访问此文档',
          code: ErrorCode.DOCUMENT_ACCESS_DENIED,
        }
        res.status(403).json(response)
        return
      }

      const { slides } = this.documentService.parseDocumentContent(document)

      const response: APIResponse = {
        success: true,
        data: {
          id: document.id,
          title: document.title,
          description: document.description,
          slideCount: slides.length,
          thumbnail: `/api/documents/${document.id}/thumbnail`,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          lastOpened: document.lastOpenedAt,
          slides: slides.map((slide, index) => ({
            no: index + 1,
            title: slide.title,
            content: slide.content,
            note: slide.note,
            frontmatter: slide.frontmatter,
          })),
        },
      }

      res.json(response)
    }
    catch (error) {
      console.error('获取文档详情失败:', error)
      const response: APIResponse = {
        success: false,
        message: '获取文档详情失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id
      const { title, description, content } = req.body

      const document = await this.documentService.create({
        title,
        description,
        content,
        userId,
      })

      const response: APIResponse = {
        success: true,
        data: {
          id: document.id,
          title: document.title,
          description: document.description,
          createdAt: document.createdAt,
        },
        message: '演示文稿创建成功',
      }

      res.status(201).json(response)
    }
    catch (error) {
      console.error('创建文档失败:', error)
      const response: APIResponse = {
        success: false,
        message: '创建文档失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id
      const { title, description } = req.body

      const document = await this.documentService.findById(id)
      if (!document) {
        const response: APIResponse = {
          success: false,
          message: '文档不存在',
          code: ErrorCode.DOCUMENT_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      if (document.userId !== userId) {
        const response: APIResponse = {
          success: false,
          message: '无权修改此文档',
          code: ErrorCode.DOCUMENT_ACCESS_DENIED,
        }
        res.status(403).json(response)
        return
      }

      await this.documentService.update(id, { title, description })

      const response: APIResponse = {
        success: true,
        message: '文档更新成功',
      }

      res.json(response)
    }
    catch (error) {
      console.error('更新文档失败:', error)
      const response: APIResponse = {
        success: false,
        message: '更新文档失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id

      const document = await this.documentService.findById(id)
      if (!document) {
        const response: APIResponse = {
          success: false,
          message: '文档不存在',
          code: ErrorCode.DOCUMENT_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      if (document.userId !== userId) {
        const response: APIResponse = {
          success: false,
          message: '无权删除此文档',
          code: ErrorCode.DOCUMENT_ACCESS_DENIED,
        }
        res.status(403).json(response)
        return
      }

      await this.documentService.softDelete(id)

      const response: APIResponse = {
        success: true,
        message: '演示文稿删除成功',
      }

      res.json(response)
    }
    catch (error) {
      console.error('删除文档失败:', error)
      const response: APIResponse = {
        success: false,
        message: '删除文档失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async duplicateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id
      const { title } = req.body

      const originalDocument = await this.documentService.findById(id)
      if (!originalDocument) {
        const response: APIResponse = {
          success: false,
          message: '原始文档不存在',
          code: ErrorCode.DOCUMENT_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      if (originalDocument.userId !== userId) {
        const response: APIResponse = {
          success: false,
          message: '无权复制此文档',
          code: ErrorCode.DOCUMENT_ACCESS_DENIED,
        }
        res.status(403).json(response)
        return
      }

      const newDocument = await this.documentService.duplicate(id, title, userId)

      const response: APIResponse = {
        success: true,
        data: {
          id: newDocument.id,
          title: newDocument.title,
          description: newDocument.description,
          createdAt: newDocument.createdAt,
        },
        message: '文档复制成功',
      }

      res.status(201).json(response)
    }
    catch (error) {
      console.error('复制文档失败:', error)
      const response: APIResponse = {
        success: false,
        message: '复制文档失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async getThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      res.status(404).json({
        success: false,
        message: '缩略图功能暂未实现',
        code: ErrorCode.NOT_FOUND,
      })
    }
    catch (error) {
      console.error('获取缩略图失败:', error)
      res.status(500).json({
        success: false,
        message: '获取缩略图失败',
        code: ErrorCode.INTERNAL_ERROR,
      })
    }
  }

  async getPreview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id
      const { count = 3 } = req.query as PreviewQuery

      const document = await this.documentService.findById(id)
      if (!document || document.userId !== userId) {
        const response: APIResponse = {
          success: false,
          message: '文档不存在或无权访问',
          code: ErrorCode.DOCUMENT_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      const { slides } = this.documentService.parseDocumentContent(document)
      const previewSlides = slides.slice(0, Number(count))

      const response: APIResponse = {
        success: true,
        data: {
          id: document.id,
          title: document.title,
          slides: previewSlides.map((slide, index) => ({
            no: index + 1,
            title: slide.title,
            content: slide.content,
            html: slide.content,
          })),
        },
      }

      res.json(response)
    }
    catch (error) {
      console.error('获取预览失败:', error)
      const response: APIResponse = {
        success: false,
        message: '获取预览失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async openDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id

      const document = await this.documentService.findById(id)
      if (!document || document.userId !== userId) {
        const response: APIResponse = {
          success: false,
          message: '文档不存在或无权访问',
          code: ErrorCode.DOCUMENT_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      await this.documentService.updateLastOpened(id)

      const response: APIResponse = {
        success: true,
        message: '打开时间已更新',
      }

      res.json(response)
    }
    catch (error) {
      console.error('更新打开时间失败:', error)
      const response: APIResponse = {
        success: false,
        message: '更新打开时间失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }
}
