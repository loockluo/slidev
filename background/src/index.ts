import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import { AppDataSource } from '@/config/database'
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler'
import routes from '@/routes'
import 'reflect-metadata'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize()
    console.log('✅ 数据库连接成功')

    // 中间件
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ['\'self\''],
          styleSrc: ['\'self\'', '\'unsafe-inline\''],
          scriptSrc: ['\'self\''],
          imgSrc: ['\'self\'', 'data:', 'https:'],
        },
      },
    }))

    app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }))

    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // 请求日志
    app.use((req, res, next) => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] ${req.method} ${req.url}`)
      next()
    })

    // API 路由
    app.use('/api', routes)

    // 404 处理
    app.use(notFoundHandler)

    // 错误处理
    app.use(errorHandler)

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 Slidev 后端 API 服务器启动成功`)
      console.log(`📍 服务地址: http://localhost:${PORT}`)
      console.log(`🔍 API 文档: http://localhost:${PORT}/api`)
      console.log(`💚 健康检查: http://localhost:${PORT}/api/health`)
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
    })
  }
  catch (error) {
    console.error('❌ 服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🔄 正在关闭服务器...')

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
    console.log('✅ 数据库连接已关闭')
  }

  console.log('✅ 服务器已关闭')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🔄 收到 SIGTERM 信号，正在关闭服务器...')

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
    console.log('✅ 数据库连接已关闭')
  }

  console.log('✅ 服务器已关闭')
  process.exit(0)
})

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason)
  console.error('Promise:', promise)
  process.exit(1)
})

// 启动服务器
startServer()
