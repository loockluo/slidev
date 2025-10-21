import type { NextFunction, Request, Response } from 'express'
import type { APIResponse } from '@/types'
import Joi from 'joi'
import { ErrorCode } from '@/types'

export function validateRequest(schema: {
  body?: Joi.ObjectSchema
  query?: Joi.ObjectSchema
  params?: Joi.ObjectSchema
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body)
        if (error) {
          const response: APIResponse = {
            success: false,
            message: '请求体参数错误',
            code: ErrorCode.INVALID_REQUEST,
            details: error.details.map(detail => detail.message),
          }
          res.status(400).json(response)
          return
        }
        req.body = value
      }

      if (schema.query) {
        const { error, value } = schema.query.validate(req.query)
        if (error) {
          const response: APIResponse = {
            success: false,
            message: '查询参数错误',
            code: ErrorCode.INVALID_REQUEST,
            details: error.details.map(detail => detail.message),
          }
          res.status(400).json(response)
          return
        }
        req.query = value
      }

      if (schema.params) {
        const { error, value } = schema.params.validate(req.params)
        if (error) {
          const response: APIResponse = {
            success: false,
            message: '路径参数错误',
            code: ErrorCode.INVALID_REQUEST,
            details: error.details.map(detail => detail.message),
          }
          res.status(400).json(response)
          return
        }
        req.params = value
      }

      next()
    }
    catch (error) {
      console.error('验证中间件错误:', error)
      const response: APIResponse = {
        success: false,
        message: '参数验证失败',
        code: ErrorCode.INVALID_REQUEST,
      }
      res.status(400).json(response)
    }
  }
}

export const schemas = {
  register: Joi.object({
    username: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createDocument: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    content: Joi.string().min(1).required(),
  }),

  updateDocument: Joi.object({
    title: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(''),
  }),

  duplicateDocument: Joi.object({
    title: Joi.string().min(1).max(255).required(),
  }),

  updateSlide: Joi.object({
    content: Joi.string().optional(),
    note: Joi.string().optional().allow(''),
    frontmatterRaw: Joi.string().optional().allow(''),
    frontmatter: Joi.object().optional(),
  }),

  updateSlides: Joi.object({
    slides: Joi.array().items(
      Joi.object({
        no: Joi.number().integer().min(1).required(),
        content: Joi.string().optional(),
        note: Joi.string().optional().allow(''),
        frontmatter: Joi.object().optional(),
        frontmatterRaw: Joi.string().optional().allow(''),
      }),
    ).min(1).required(),
    revision: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    username: Joi.string().min(2).max(50).optional(),
    avatarUrl: Joi.string().uri().optional().allow(''),
  }),

  documentId: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  slideNumber: Joi.object({
    doc_id: Joi.string().uuid().required(),
    slide_no: Joi.number().integer().min(1).required(),
  }),

  documentsQuery: Joi.object({
    search: Joi.string().max(255).optional(),
    filter: Joi.string().valid('all', 'recent').optional(),
    sort: Joi.string().valid('title', 'updated', 'created', 'opened').optional(),
    order: Joi.string().valid('asc', 'desc').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),

  previewQuery: Joi.object({
    count: Joi.number().integer().min(1).max(10).optional(),
  }),
}
