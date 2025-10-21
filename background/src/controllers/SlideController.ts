import type { Request, Response } from 'express'
import type { APIResponse, BatchSlidesUpdate, SlidePatch } from '@/types'
import { parseSync, prettifySlide, stringify } from '@slidev/parser'
import YAML from 'yaml'
import { DocumentService } from '@/services/DocumentService'
import { ErrorCode } from '@/types'

type SourceSlideInfo = ReturnType<typeof prettifySlide>
type SlidevMarkdown = ReturnType<typeof parseSync>

export class SlideController {
  private documentService: DocumentService

  constructor() {
    this.documentService = new DocumentService()
  }

  async getSlide(req: Request, res: Response): Promise<void> {
    try {
      const { doc_id, slide_no } = req.params
      const userId = (req as any).user.id

      if (!doc_id || !slide_no) {
        const response: APIResponse = {
          success: false,
          message: '缺少必要参数',
          code: ErrorCode.INVALID_REQUEST,
        }
        res.status(400).json(response)
        return
      }

      const document = await this.documentService.findById(doc_id)
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

      const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')
      const slideIndex = Number.parseInt(slide_no) - 1

      if (slideIndex < 0 || slideIndex >= slidesData.slides.length) {
        const response: APIResponse = {
          success: false,
          message: '幻灯片不存在',
          code: ErrorCode.SLIDE_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      const slide: SourceSlideInfo | undefined = slidesData.slides[slideIndex]

      if (!slide) {
        const response: APIResponse = {
          success: false,
          message: '幻灯片不存在',
          code: ErrorCode.SLIDE_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      const response: APIResponse = {
        success: true,
        data: {
          index: slideIndex,
          no: slide_no,
          content: slide.content,
          note: slide.note,
          frontmatter: slide.frontmatter,
          frontmatterRaw: slide.frontmatterRaw,
          revision: document.revision,
        },
      }

      res.json(response)
    }
    catch (error) {
      console.error('获取幻灯片失败:', error)
      const response: APIResponse = {
        success: false,
        message: '获取幻灯片失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async updateSlide(req: Request, res: Response): Promise<void> {
    try {
      const { doc_id, slide_no } = req.params
      const userId = (req as any).user.id
      const patch: SlidePatch = req.body

      if (!doc_id || !slide_no) {
        const response: APIResponse = {
          success: false,
          message: '缺少必要参数',
          code: ErrorCode.INVALID_REQUEST,
        }
        res.status(400).json(response)
        return
      }

      const document = await this.documentService.findById(doc_id)
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

      const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')
      const slideIndex = Number.parseInt(slide_no) - 1

      if (slideIndex < 0 || slideIndex >= slidesData.slides.length) {
        const response: APIResponse = {
          success: false,
          message: '幻灯片不存在',
          code: ErrorCode.SLIDE_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      const slide = slidesData.slides[slideIndex]

      if (!slide) {
        const response: APIResponse = {
          success: false,
          message: '幻灯片不存在',
          code: ErrorCode.SLIDE_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      if (patch.content !== undefined) {
        slide.content = patch.content
      }

      if (patch.frontmatterRaw !== undefined) {
        if (patch.frontmatterRaw.trim() === '') {
          delete slide.frontmatterDoc
          delete slide.frontmatterStyle
          slide.frontmatter = {}
        }
        else {
          try {
            const parsed = YAML.parseDocument(patch.frontmatterRaw)
            if (parsed.errors.length > 0) {
              const response: APIResponse = {
                success: false,
                message: 'frontmatter 格式错误',
                code: ErrorCode.FRONTMATTER_ERROR,
                details: parsed.errors,
              }
              res.status(400).json(response)
              return
            }
            slide.frontmatterDoc = parsed
            slide.frontmatter = parsed.toJSON() || {}
          }
          catch (error) {
            const response: APIResponse = {
              success: false,
              message: 'frontmatter 格式错误',
              code: ErrorCode.FRONTMATTER_ERROR,
              details: error,
            }
            res.status(400).json(response)
            return
          }
        }
      }

      if (patch.note !== undefined) {
        slide.note = patch.note
      }

      if (patch.frontmatter) {
        Object.assign(slide.frontmatter, patch.frontmatter)
      }

      prettifySlide(slide)

      const updatedContent = stringify(slidesData)
      const { revision } = await this.documentService.updateDocumentContent(
        doc_id,
        updatedContent,
      )

      const response: APIResponse = {
        success: true,
        data: {
          index: slideIndex,
          no: slide_no,
          content: slide.content,
          note: slide.note,
          frontmatter: slide.frontmatter,
          revision,
        },
        message: '幻灯片更新成功',
      }

      res.json(response)
    }
    catch (error) {
      console.error('更新幻灯片失败:', error)
      const response: APIResponse = {
        success: false,
        message: '更新幻灯片失败',
        code: ErrorCode.SLIDE_UPDATE_FAILED,
      }
      res.status(500).json(response)
    }
  }

  async getDocumentSlides(req: Request, res: Response): Promise<void> {
    try {
      const { doc_id } = req.params
      const userId = (req as any).user.id

      if (!doc_id) {
        const response: APIResponse = {
          success: false,
          message: '缺少文档ID',
          code: ErrorCode.INVALID_REQUEST,
        }
        res.status(400).json(response)
        return
      }

      const document = await this.documentService.findById(doc_id)
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

      const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')

      const slides = slidesData.slides.map((slide: SourceSlideInfo, index: number) => ({
        index,
        no: index + 1,
        title: slide.title,
        note: slide.note,
        frontmatter: slide.frontmatter,
      }))

      const response: APIResponse = {
        success: true,
        data: slides,
      }

      res.json(response)
    }
    catch (error) {
      console.error('获取文档幻灯片失败:', error)
      const response: APIResponse = {
        success: false,
        message: '获取文档幻灯片失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async updateSlides(req: Request, res: Response): Promise<void> {
    try {
      const { doc_id } = req.params
      const userId = (req as any).user.id
      const { slides, revision }: BatchSlidesUpdate = req.body

      if (!doc_id) {
        const response: APIResponse = {
          success: false,
          message: '缺少文档ID',
          code: ErrorCode.INVALID_REQUEST,
        }
        res.status(400).json(response)
        return
      }

      const document = await this.documentService.findById(doc_id)
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

      if (document.revision !== revision) {
        const response: APIResponse = {
          success: false,
          message: '文档已被修改，请刷新后重试',
          code: ErrorCode.DOCUMENT_CONFLICT,
        }
        res.status(409).json(response)
        return
      }

      const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')

      for (const slideUpdate of slides) {
        const slideIndex = slideUpdate.no - 1
        if (slideIndex >= 0 && slideIndex < slidesData.slides.length) {
          const slide = slidesData.slides[slideIndex]

          if (!slide) {
            continue
          }

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
            try {
              const parsed = YAML.parseDocument(slideUpdate.frontmatterRaw)
              if (parsed.errors.length === 0) {
                slide.frontmatterDoc = parsed
                slide.frontmatter = parsed.toJSON() || {}
              }
            }
            catch (error) {
              console.warn('解析 frontmatter 失败:', error)
            }
          }

          prettifySlide(slide)
        }
      }

      const updatedContent = stringify(slidesData)
      const { revision: newRevision } = await this.documentService.updateDocumentContent(
        doc_id,
        updatedContent,
        revision,
      )

      const updatedSlidesData: SlidevMarkdown = parseSync(updatedContent, 'temp.md')

      const response: APIResponse = {
        success: true,
        data: {
          id: doc_id,
          revision: newRevision,
          content: updatedContent,
          slides: slides.map((s, idx) => ({
            ...s,
            frontmatter: updatedSlidesData.slides[idx]?.frontmatter,
            note: updatedSlidesData.slides[idx]?.note,
          })),
        },
        message: '文档更新成功',
      }

      res.json(response)
    }
    catch (error) {
      console.error('批量更新幻灯片失败:', error)
      const response: APIResponse = {
        success: false,
        message: '批量更新幻灯片失败',
        code: ErrorCode.SLIDE_UPDATE_FAILED,
      }
      res.status(500).json(response)
    }
  }
}
