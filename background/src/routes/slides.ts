import { Router } from 'express'
import { SlideController } from '@/controllers/SlideController'
import { authMiddleware } from '@/middleware/auth'
import { schemas, validateRequest } from '@/middleware/validation'

const router = Router()
const slideController = new SlideController()

// 所有路由都需要认证
router.use(authMiddleware)

// 获取文档的所有幻灯片
router.get(
  '/:doc_id/slides',
  validateRequest({ params: schemas.documentId }),
  slideController.getDocumentSlides.bind(slideController),
)

// 获取单个幻灯片信息
router.get(
  '/:doc_id/slides/:slide_no',
  validateRequest({ params: schemas.slideNumber }),
  slideController.getSlide.bind(slideController),
)

// 更新单个幻灯片内容
router.put(
  '/:doc_id/slides/:slide_no',
  validateRequest({
    params: schemas.slideNumber,
    body: schemas.updateSlide,
  }),
  slideController.updateSlide.bind(slideController),
)

// 批量更新幻灯片
router.put(
  '/:doc_id/slides',
  validateRequest({
    params: schemas.documentId,
    body: schemas.updateSlides,
  }),
  slideController.updateSlides.bind(slideController),
)

export default router
