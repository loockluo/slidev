import type { SlidevMarkdown, SourceSlideInfo } from '@slidev/parser'
import type { Repository } from 'typeorm'
import { parseSync } from '@slidev/parser'
import { IsNull } from 'typeorm'
import { AppDataSource } from '@/config/database'
import { Document } from '@/entities/Document'
import { generateRevision } from '@/utils/hash'

export class DocumentService {
  private documentRepository: Repository<Document>

  constructor() {
    this.documentRepository = AppDataSource.getRepository(Document)
  }

  async findById(id: string): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['user'],
    })
  }

  async findByUserId(userId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { updatedAt: 'DESC' },
      relations: ['user'],
    })
  }

  async searchDocuments(userId: string, query: any): Promise<Document[]> {
    const { search, filter, sort, order } = query

    let queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .where('document.userId = :userId', { userId })
      .andWhere('document.deletedAt IS NULL')

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(document.title LIKE :search OR document.description LIKE :search)',
        { search: `%${search}%` },
      )
    }

    if (filter === 'recent') {
      queryBuilder = queryBuilder.andWhere(
        'document.lastOpenedAt IS NOT NULL',
      )
    }

    const sortField = sort || 'updated'
    const sortOrder = order || 'desc'

    queryBuilder = queryBuilder.orderBy(`document.${sortField}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')

    return queryBuilder.getMany()
  }

  async create(data: {
    title: string
    description?: string
    content: string
    userId: string
  }): Promise<Document> {
    const revision = generateRevision(data.content)

    const document = this.documentRepository.create({
      title: data.title,
      description: data.description,
      content: data.content,
      revision,
      userId: data.userId,
    })

    return this.documentRepository.save(document)
  }

  async update(id: string, data: {
    title?: string
    description?: string
    content?: string
    revision?: string
  }): Promise<void> {
    await this.documentRepository.update(id, data)
  }

  async softDelete(id: string): Promise<void> {
    await this.documentRepository.update(id, { deletedAt: new Date() })
  }

  async updateLastOpened(id: string): Promise<void> {
    await this.documentRepository.update(id, { lastOpenedAt: new Date() })
  }

  async duplicate(originalId: string, newTitle: string, userId: string): Promise<Document> {
    const original = await this.findById(originalId)
    if (!original) {
      throw new Error('原始文档不存在')
    }

    const newContent = `${original.content}\n\n---\nlayout: default\n# 副本\n\n这是复制的演示文稿`
    const revision = generateRevision(newContent)

    const newDocument = this.documentRepository.create({
      title: newTitle,
      description: original.description ? `${original.description} (副本)` : undefined,
      content: newContent,
      revision,
      userId,
    })

    return this.documentRepository.save(newDocument)
  }

  parseDocumentContent(document: Document): {
    slides: SourceSlideInfo[]
    slideCount: number
  } {
    const slidesData: SlidevMarkdown = parseSync(document.content, 'temp.md')

    return {
      slides: slidesData.slides,
      slideCount: slidesData.slides.length,
    }
  }

  async getDocumentWithSlides(id: string): Promise<Document & { slides: SourceSlideInfo[] } | null> {
    const document = await this.findById(id)
    if (!document)
      return null

    const { slides } = this.parseDocumentContent(document)

    return { ...document, slides }
  }

  async updateDocumentContent(
    id: string,
    content: string,
    currentRevision?: string,
  ): Promise<{ revision: string, content: string }> {
    const document = await this.findById(id)
    if (!document) {
      throw new Error('文档不存在')
    }

    if (currentRevision && document.revision !== currentRevision) {
      throw new Error('文档已被修改，请刷新后重试')
    }

    const newRevision = generateRevision(content)

    await this.update(id, {
      content,
      revision: newRevision,
    })

    return {
      revision: newRevision,
      content,
    }
  }
}
