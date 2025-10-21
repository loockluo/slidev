import type { Request, Response } from 'express'
import type { APIResponse, JWTPayload } from '@/types'
import jwt from 'jsonwebtoken'
import { DocumentService } from '@/services/DocumentService'
import { UserService } from '@/services/UserService'
import { ErrorCode } from '@/types'

export class UserController {
  private userService: UserService
  private documentService: DocumentService

  constructor() {
    this.userService = new UserService()
    this.documentService = new DocumentService()
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body

      if (!username || !email || !password) {
        const response: APIResponse = {
          success: false,
          message: '用户名、邮箱和密码不能为空',
          code: ErrorCode.INVALID_REQUEST,
        }
        res.status(400).json(response)
        return
      }

      const user = await this.userService.create({
        username,
        email,
        password,
      })

      const token = this.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
      })

      const response: APIResponse = {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatarUrl,
          token,
        },
        message: '注册成功',
      }

      res.status(201).json(response)
    }
    catch (error: any) {
      console.error('注册失败:', error)

      let code = ErrorCode.INTERNAL_ERROR
      let message = '注册失败'

      if (error.message === '用户已存在') {
        code = ErrorCode.USER_ALREADY_EXISTS
        message = '用户已存在'
      }

      const response: APIResponse = {
        success: false,
        message,
        code,
      }
      res.status(400).json(response)
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        const response: APIResponse = {
          success: false,
          message: '邮箱和密码不能为空',
          code: ErrorCode.INVALID_REQUEST,
        }
        res.status(400).json(response)
        return
      }

      const user = await this.userService.validatePassword(email, password)
      if (!user) {
        const response: APIResponse = {
          success: false,
          message: '邮箱或密码错误',
          code: ErrorCode.INVALID_CREDENTIALS,
        }
        res.status(401).json(response)
        return
      }

      const token = this.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
      })

      const response: APIResponse = {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatarUrl,
          token,
        },
        message: '登录成功',
      }

      res.json(response)
    }
    catch (error) {
      console.error('登录失败:', error)
      const response: APIResponse = {
        success: false,
        message: '登录失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id

      const user = await this.userService.findById(userId)
      if (!user) {
        const response: APIResponse = {
          success: false,
          message: '用户不存在',
          code: ErrorCode.USER_NOT_FOUND,
        }
        res.status(404).json(response)
        return
      }

      const documents = await this.documentService.findByUserId(userId)

      const response: APIResponse = {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatarUrl || '/api/user/avatar',
          documentCount: documents.length,
          createdAt: user.createdAt,
        },
      }

      res.json(response)
    }
    catch (error) {
      console.error('获取用户信息失败:', error)
      const response: APIResponse = {
        success: false,
        message: '获取用户信息失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id
      const { username, avatarUrl } = req.body

      await this.userService.updateProfile(userId, {
        username,
        avatarUrl,
      })

      const response: APIResponse = {
        success: true,
        message: '用户信息更新成功',
      }

      res.json(response)
    }
    catch (error) {
      console.error('更新用户信息失败:', error)
      const response: APIResponse = {
        success: false,
        message: '更新用户信息失败',
        code: ErrorCode.INTERNAL_ERROR,
      }
      res.status(500).json(response)
    }
  }

  async getAvatar(req: Request, res: Response): Promise<void> {
    try {
      res.status(404).json({
        success: false,
        message: '头像功能暂未实现',
        code: ErrorCode.NOT_FOUND,
      })
    }
    catch (error) {
      console.error('获取头像失败:', error)
      res.status(500).json({
        success: false,
        message: '获取头像失败',
        code: ErrorCode.INTERNAL_ERROR,
      })
    }
  }

  private generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

    return jwt.sign(payload, secret, { expiresIn })
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
      return jwt.verify(token, secret) as JWTPayload
    }
    catch (error) {
      return null
    }
  }
}
