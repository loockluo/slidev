import { Router } from 'express'
import authRouter from './auth'
import documentsRouter from './documents'
import slidesRouter from './slides'

const router = Router()

// API 路由
router.use('/auth', authRouter)
router.use('/documents', documentsRouter)
router.use('/slides', slidesRouter)

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Slidev 后端 API 服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// API 根路径
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Slidev 后端 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      documents: '/api/documents',
      slides: '/api/slides',
      health: '/api/health',
    },
  })
})

export default router
