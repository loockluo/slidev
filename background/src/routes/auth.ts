import { Router } from 'express'
import { UserController } from '@/controllers/UserController'
import { authMiddleware } from '@/middleware/auth'
import { schemas, validateRequest } from '@/middleware/validation'

const router = Router()
const userController = new UserController()

// 用户注册（不需要认证）
router.post(
  '/register',
  validateRequest({ body: schemas.register }),
  userController.register.bind(userController),
)

// 用户登录（不需要认证）
router.post(
  '/login',
  validateRequest({ body: schemas.login }),
  userController.login.bind(userController),
)

// 获取用户信息（需要认证）
router.get(
  '/profile',
  authMiddleware,
  userController.getProfile.bind(userController),
)

// 更新用户信息（需要认证）
router.put(
  '/profile',
  authMiddleware,
  validateRequest({ body: schemas.updateProfile }),
  userController.updateProfile.bind(userController),
)

// 获取用户头像（需要认证）
router.get(
  '/avatar',
  authMiddleware,
  userController.getAvatar.bind(userController),
)

export default router
