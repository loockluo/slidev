import type { NextFunction, Request, Response } from 'express'
import type { APIResponse } from '@/types'
import { UserController } from '@/controllers/UserController'
import { ErrorCode } from '@/types'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    username: string
    email: string
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: APIResponse = {
        success: false,
        message: '未提供认证令牌',
        code: ErrorCode.UNAUTHORIZED,
      }
      res.status(401).json(response)
      return
    }

    const token = authHeader.substring(7)
    const userController = new UserController()
    const payload = userController.verifyToken(token)

    if (!payload) {
      const response: APIResponse = {
        success: false,
        message: '认证令牌无效或已过期',
        code: ErrorCode.UNAUTHORIZED,
      }
      res.status(401).json(response)
      return
    }

    req.user = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
    }

    next()
  }
  catch (error) {
    console.error('认证中间件错误:', error)
    const response: APIResponse = {
      success: false,
      message: '认证失败',
      code: ErrorCode.UNAUTHORIZED,
    }
    res.status(401).json(response)
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const userController = new UserController()
      const payload = userController.verifyToken(token)

      if (payload) {
        req.user = {
          id: payload.id,
          username: payload.username,
          email: payload.email,
        }
      }
    }

    next()
  }
  catch (error) {
    console.error('可选认证中间件错误:', error)
    next()
  }
}
