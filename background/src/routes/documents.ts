import { Router } from 'express'
import { DocumentController } from '@/controllers/DocumentController'
import { authMiddleware } from '@/middleware/auth'
import { schemas, validateRequest } from '@/middleware/validation'

const router = Router()
const documentController = new DocumentController()

// 所有路由都需要认证
router.use(authMiddleware)

// 获取文档列表
router.get(
  '/',
  validateRequest({ query: schemas.documentsQuery }),
  documentController.getDocuments.bind(documentController),
)

// 创建新文档
router.post(
  '/',
  validateRequest({ body: schemas.createDocument }),
  documentController.createDocument.bind(documentController),
)

// 获取单个文档详情
router.get(
  '/:id',
  validateRequest({ params: schemas.documentId }),
  documentController.getDocument.bind(documentController),
)

// 更新文档基本信息
router.put(
  '/:id',
  validateRequest({
    params: schemas.documentId,
    body: schemas.updateDocument,
  }),
  documentController.updateDocument.bind(documentController),
)

// 删除文档
router.delete(
  '/:id',
  validateRequest({ params: schemas.documentId }),
  documentController.deleteDocument.bind(documentController),
)

// 复制文档
router.post(
  '/:id/duplicate',
  validateRequest({
    params: schemas.documentId,
    body: schemas.duplicateDocument,
  }),
  documentController.duplicateDocument.bind(documentController),
)

// 获取文档缩略图
router.get(
  '/:id/thumbnail',
  validateRequest({ params: schemas.documentId }),
  documentController.getThumbnail.bind(documentController),
)

// 预览文档
router.get(
  '/:id/preview',
  validateRequest({
    params: schemas.documentId,
    query: schemas.previewQuery,
  }),
  documentController.getPreview.bind(documentController),
)

// 记录文档打开时间
router.post(
  '/:id/open',
  validateRequest({ params: schemas.documentId }),
  documentController.openDocument.bind(documentController),
)

export default router
