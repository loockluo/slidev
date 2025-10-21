import type { NextFunction, Request, Response } from 'express'
import type { APIResponse } from '@/types'
import { ErrorCode } from '@/types'

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('全局错误处理:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  })

  const response: APIResponse = {
    success: false,
    message: '服务器内部错误',
    code: ErrorCode.INTERNAL_ERROR,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  }

  res.status(500).json(response)
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: APIResponse = {
    success: false,
    message: `路由 ${req.method} ${req.url} 不存在`,
    code: ErrorCode.NOT_FOUND,
  }

  res.status(404).json(response)
}
